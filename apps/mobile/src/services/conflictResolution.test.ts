import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-sqlite', () => ({ openDatabaseAsync: vi.fn() }));
vi.mock('expo-crypto', () => ({ getRandomBytesAsync: vi.fn() }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

import { SQLiteSyncRepository } from '../data/syncRepository';
import type { OutboxStatus, SyncConflict, SyncEntity, SyncOperation } from '../domain/sync';

interface MutableOutbox {
  id: string;
  entity: SyncEntity;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  baseUpdatedAt: string | null;
}

class ConflictDatabase {
  conflict: SyncConflict | null = null;
  cacheDirty = true;

  constructor(
    readonly outbox: MutableOutbox,
    readonly cachedPayload: Record<string, unknown>,
  ) {}

  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    await callback();
  }

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    if (sql.includes('SELECT payload_json FROM bills') || sql.includes('SELECT payload_json FROM payments')) {
      return { payload_json: JSON.stringify(this.cachedPayload) } as T;
    }
    if (sql.includes('SELECT * FROM conflicts')) {
      if (!this.conflict) return null;
      return {
        mutation_id: this.conflict.mutationId,
        server_profile_id: this.conflict.serverProfileId,
        database_id: this.conflict.databaseId,
        entity: this.conflict.entity,
        entity_id: this.conflict.entityId,
        local_json: JSON.stringify(this.conflict.local),
        server_json: JSON.stringify(this.conflict.server),
        server_updated_at: this.conflict.serverUpdatedAt,
        reason: this.conflict.reason,
        created_at: this.conflict.createdAt,
      } as T;
    }
    if (sql.includes('SELECT entity, operation FROM outbox')) {
      return { entity: this.outbox.entity, operation: this.outbox.operation } as T;
    }
    throw new Error(`Unexpected query: ${sql}`);
  }

  async runAsync(sql: string, ...params: unknown[]): Promise<void> {
    if (sql.includes('INSERT INTO conflicts')) {
      this.conflict = {
        mutationId: String(params[0]),
        serverProfileId: String(params[1]),
        databaseId: String(params[2]),
        entity: params[3] as SyncEntity,
        entityId: params[4] === null ? null : String(params[4]),
        local: JSON.parse(String(params[5])) as unknown,
        server: JSON.parse(String(params[6])) as unknown,
        serverUpdatedAt: String(params[7]),
        reason: params[8] as SyncConflict['reason'],
        createdAt: String(params[9]),
      };
      return;
    }
    if (sql.includes("UPDATE outbox SET status = 'conflict'")) {
      this.outbox.status = 'conflict';
      return;
    }
    if (sql.includes("SET entity = ?, operation = 'create'")) {
      this.outbox.entity = params[0] as SyncEntity;
      this.outbox.operation = 'create';
      this.outbox.payload = JSON.parse(String(params[1])) as Record<string, unknown>;
      this.outbox.baseUpdatedAt = null;
      this.outbox.status = 'pending';
      return;
    }
    if (sql.includes("UPDATE outbox SET status = 'completed'")) {
      this.outbox.status = 'completed';
      return;
    }
    if (sql.includes('SET is_dirty = 0')) {
      this.cacheDirty = false;
      return;
    }
    if (sql.includes('DELETE FROM conflicts')) {
      this.conflict = null;
      return;
    }
    throw new Error(`Unexpected update: ${sql}`);
  }
}

function deletedConflict(entity: SyncEntity, entityId: string): SyncConflict {
  return {
    mutationId: 'mutation-1',
    serverProfileId: 'server-a',
    databaseId: 'family',
    entity,
    entityId,
    local: { notes: 'offline edit' },
    server: { __sync_failure: true, status: 404 },
    serverUpdatedAt: '2026-07-15T12:00:00.000Z',
    reason: 'deleted',
    createdAt: '2026-07-15T12:01:00.000Z',
  };
}

describe('deleted-object conflict resolution', () => {
  it('recreates a locally edited bill from the complete encrypted cache payload', async () => {
    const cachedBill = {
      id: 42,
      name: 'Rent',
      amount: 1200,
      frequency: 'monthly',
      next_due: '2026-08-01',
      notes: 'offline edit',
    };
    const database = new ConflictDatabase({
      id: 'mutation-1',
      entity: 'bill',
      operation: 'update',
      payload: { notes: 'offline edit' },
      status: 'pending',
      baseUpdatedAt: '2026-07-01T00:00:00.000Z',
    }, cachedBill);
    const repository = new SQLiteSyncRepository(async () => database as never);

    await repository.markConflict(deletedConflict('bill', '42'));
    await repository.resolveConflict('mutation-1', 'keep_local');

    expect(database.outbox).toMatchObject({
      entity: 'bill',
      operation: 'create',
      payload: cachedBill,
      status: 'pending',
      baseUpdatedAt: null,
    });
    expect(database.conflict).toBeNull();
  });

  it('treats a missing payment as success when the local intent was deletion', async () => {
    const database = new ConflictDatabase({
      id: 'mutation-1',
      entity: 'payment',
      operation: 'delete',
      payload: {},
      status: 'pending',
      baseUpdatedAt: '2026-07-01T00:00:00.000Z',
    }, { id: 9, bill_id: 42, amount: 1200 });
    const repository = new SQLiteSyncRepository(async () => database as never);

    await repository.markConflict(deletedConflict('payment', '9'));
    await repository.resolveConflict('mutation-1', 'keep_local');

    expect(database.outbox.status).toBe('completed');
    expect(database.cacheDirty).toBe(false);
    expect(database.conflict).toBeNull();
  });
});
