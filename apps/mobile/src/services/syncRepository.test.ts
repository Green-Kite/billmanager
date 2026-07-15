import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-sqlite', () => ({ openDatabaseAsync: vi.fn() }));
vi.mock('expo-crypto', () => ({ getRandomBytesAsync: vi.fn() }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));
import type { OutboxMutationResult, OutboxStatus, SyncEntity } from '../domain/sync';
import { SQLiteSyncRepository } from '../data/syncRepository';

interface BillState {
  serverProfileId: string;
  databaseId: string;
  entityId: string;
  payload: Record<string, unknown>;
  serverUpdatedAt: string | null;
  dirty: boolean;
  archived: boolean;
}

interface OutboxState {
  id: string;
  serverProfileId: string;
  databaseId: string;
  entity: SyncEntity;
  entityId: string | null;
  operation?: string;
  payload: Record<string, unknown>;
  baseUpdatedAt?: string | null;
  dependsOn?: string | null;
  status: OutboxStatus;
}

interface PaymentState {
  serverProfileId: string;
  databaseId: string;
  entityId: string;
  billId: string;
  payload: Record<string, unknown>;
  dirty: boolean;
}

class ReconciliationDatabase {
  constructor(
    readonly bills: BillState[],
    readonly outbox: OutboxState[],
    readonly payments: PaymentState[],
  ) {}

  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    await callback();
  }

  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    const [serverProfileId, databaseId, entityId] = params as string[];
    if (sql.includes('SELECT payload_json FROM bills')) {
      const row = this.bills.find((candidate) => (
        candidate.serverProfileId === serverProfileId
        && candidate.databaseId === databaseId
        && candidate.entityId === entityId
      ));
      return row ? ({ payload_json: JSON.stringify(row.payload) } as T) : null;
    }
    if (sql.includes('SELECT payload_json FROM payments')) {
      const row = this.payments.find((candidate) => (
        candidate.serverProfileId === serverProfileId
        && candidate.databaseId === databaseId
        && candidate.entityId === entityId
      ));
      return row ? ({ payload_json: JSON.stringify(row.payload) } as T) : null;
    }
    throw new Error(`Unexpected getFirstAsync query: ${sql}`);
  }

  async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    const [serverProfileId, databaseId, billId] = params as string[];
    if (sql.includes('SELECT id, payload_json FROM outbox')) {
      return this.outbox
        .filter((row) => (
          row.serverProfileId === serverProfileId
          && row.databaseId === databaseId
          && (row.status === 'pending' || row.status === 'retry')
        ))
        .map((row) => ({ id: row.id, payload_json: JSON.stringify(row.payload) }) as T);
    }
    if (sql.includes('SELECT entity_id, payload_json FROM payments')) {
      return this.payments
        .filter((row) => (
          row.serverProfileId === serverProfileId
          && row.databaseId === databaseId
          && row.billId === billId
        ))
        .map((row) => ({
          entity_id: row.entityId,
          payload_json: JSON.stringify(row.payload),
        }) as T);
    }
    throw new Error(`Unexpected getAllAsync query: ${sql}`);
  }

  async runAsync(sql: string, ...params: unknown[]): Promise<void> {
    if (sql.includes('UPDATE bills SET entity_id')) {
      const [serverId, payloadJson, serverUpdatedAt, serverProfileId, databaseId, temporaryId]
        = params as [string, string, string | null, string, string, string];
      const row = this.bills.find((candidate) => (
        candidate.serverProfileId === serverProfileId
        && candidate.databaseId === databaseId
        && candidate.entityId === temporaryId
      ));
      if (row) {
        row.entityId = String(serverId);
        row.payload = JSON.parse(payloadJson) as Record<string, unknown>;
        row.serverUpdatedAt = serverUpdatedAt;
      }
      return;
    }

    if (sql.includes('UPDATE bills SET payload_json')) {
      const [payloadJson, serverUpdatedAt, serverProfileId, databaseId, entityId]
        = params as [string, string, string, string, string];
      const row = this.bills.find((candidate) => (
        candidate.serverProfileId === serverProfileId
        && candidate.databaseId === databaseId
        && candidate.entityId === entityId
      ));
      if (row) {
        row.payload = JSON.parse(payloadJson) as Record<string, unknown>;
        row.serverUpdatedAt = serverUpdatedAt;
      }
      return;
    }

    if (sql.includes('UPDATE outbox SET payload_json')) {
      const [payloadJson, baseUpdatedAt, id] = params as [string, string | null, string];
      const row = this.outbox.find((candidate) => candidate.id === id);
      if (row) {
        row.payload = JSON.parse(payloadJson) as Record<string, unknown>;
        if (baseUpdatedAt) row.baseUpdatedAt = baseUpdatedAt;
      }
      return;
    }

    if (sql.includes('UPDATE outbox SET entity_id')) {
      const [serverId, baseUpdatedAt, serverProfileId, databaseId, temporaryId]
        = params as [string, string | null, string, string, string];
      for (const row of this.outbox) {
        const matchesEntity = sql.includes("entity = 'payment'")
          ? row.entity === 'payment' && (row.entityId === temporaryId)
            && (row.status === 'pending' || row.status === 'retry')
          : row.entityId === temporaryId
            && (row.entity === 'bill' || row.entity === 'bill_archive' || row.entity === 'bill_restore')
            && (row.status === 'pending' || row.status === 'retry');
        if (
          row.serverProfileId === serverProfileId
          && row.databaseId === databaseId
          && matchesEntity
        ) {
          row.entityId = String(serverId);
          if (baseUpdatedAt) row.baseUpdatedAt = baseUpdatedAt;
        }
      }
      return;
    }

    if (sql.includes('UPDATE outbox SET base_updated_at')) {
      const [baseUpdatedAt, dependsOn, excludedEntityId]
        = params as [string, string, string];
      for (const row of this.outbox) {
        if (
          row.dependsOn === dependsOn
          && (row.status === 'pending' || row.status === 'retry')
          && !(
            row.entity === 'payment'
            && row.entityId === excludedEntityId
            && (row.operation === 'update' || row.operation === 'delete')
          )
        ) {
          row.baseUpdatedAt = baseUpdatedAt;
        }
      }
      return;
    }

    if (sql.includes('UPDATE payments SET entity_id')) {
      const [serverId, payloadJson, serverUpdatedAt, serverProfileId, databaseId, temporaryId]
        = params as [string, string, string | null, string, string, string];
      const row = this.payments.find((candidate) => (
        candidate.serverProfileId === serverProfileId
        && candidate.databaseId === databaseId
        && candidate.entityId === temporaryId
      ));
      if (row) {
        row.entityId = String(serverId);
        row.payload = JSON.parse(payloadJson) as Record<string, unknown>;
      }
      void serverUpdatedAt;
      return;
    }

    if (sql.includes('UPDATE payments SET bill_id')) {
      const [serverId, payloadJson, serverProfileId, databaseId, entityId]
        = params as [string, string, string, string, string];
      const row = this.payments.find((candidate) => (
        candidate.serverProfileId === serverProfileId
        && candidate.databaseId === databaseId
        && candidate.entityId === entityId
      ));
      if (row) {
        row.billId = String(serverId);
        row.payload = JSON.parse(payloadJson) as Record<string, unknown>;
      }
      return;
    }

    throw new Error(`Unexpected runAsync query: ${sql}`);
  }
}

describe('SQLiteSyncRepository bill creation reconciliation', () => {
  it('remaps a temporary bill throughout its scoped cache and dependent mutations', async () => {
    const targetProfile = 'server-a';
    const targetDatabase = 'family';
    const temporaryId = '-7';
    const database = new ReconciliationDatabase(
      [
        {
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entityId: temporaryId,
          payload: { id: -7, name: 'Rent', archived: true },
          serverUpdatedAt: null,
          dirty: true,
          archived: true,
        },
        {
          serverProfileId: 'server-b',
          databaseId: targetDatabase,
          entityId: temporaryId,
          payload: { id: -7, name: 'Other server' },
          serverUpdatedAt: null,
          dirty: true,
          archived: false,
        },
        {
          serverProfileId: targetProfile,
          databaseId: 'personal',
          entityId: temporaryId,
          payload: { id: -7, name: 'Other database' },
          serverUpdatedAt: null,
          dirty: true,
          archived: false,
        },
      ],
      [
        {
          id: 'create-payment',
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entity: 'payment',
          entityId: null,
          payload: { bill_id: -7, amount: 1100 },
          status: 'pending',
        },
        {
          id: 'update-bill',
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entity: 'bill',
          entityId: temporaryId,
          payload: { name: 'Updated rent' },
          status: 'pending',
        },
        {
          id: 'archive-bill',
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entity: 'bill_archive',
          entityId: temporaryId,
          payload: {},
          status: 'retry',
        },
        {
          id: 'restore-bill',
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entity: 'bill_restore',
          entityId: temporaryId,
          payload: {},
          status: 'pending',
        },
        {
          id: 'other-profile-payment',
          serverProfileId: 'server-b',
          databaseId: targetDatabase,
          entity: 'payment',
          entityId: null,
          payload: { bill_id: -7, amount: 12 },
          status: 'pending',
        },
        {
          id: 'other-database-update',
          serverProfileId: targetProfile,
          databaseId: 'personal',
          entity: 'bill',
          entityId: temporaryId,
          payload: { name: 'Must not change' },
          status: 'pending',
        },
      ],
      [
        {
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entityId: '-101',
          billId: temporaryId,
          payload: { id: -101, bill_id: -7, amount: 1100 },
          dirty: true,
        },
        {
          serverProfileId: 'server-b',
          databaseId: targetDatabase,
          entityId: '-102',
          billId: temporaryId,
          payload: { id: -102, bill_id: -7, amount: 12 },
          dirty: true,
        },
        {
          serverProfileId: targetProfile,
          databaseId: 'personal',
          entityId: '-103',
          billId: temporaryId,
          payload: { id: -103, bill_id: -7, amount: 25 },
          dirty: true,
        },
      ],
    );
    const repository = new SQLiteSyncRepository(async () => database as never);
    const result: OutboxMutationResult = {
      serverEntity: {
        id: 88,
        name: 'Rent',
        last_updated: '2026-07-15T13:00:00.000Z',
      },
      serverUpdatedAt: '2026-07-15T13:00:01.000Z',
    };

    await repository.applyResult({
      id: 'create-bill',
      serverProfileId: targetProfile,
      databaseId: targetDatabase,
      entity: 'bill',
      entityId: temporaryId,
      operation: 'create',
      payload: { name: 'Rent' },
      baseUpdatedAt: null,
      createdAt: '2026-07-15T12:00:00.000Z',
      attempts: 0,
      nextAttemptAt: null,
      dependsOn: null,
      status: 'processing',
      lastError: null,
    }, result);

    const targetBill = database.bills[0];
    expect(targetBill).toMatchObject({
      entityId: '88',
      dirty: true,
      archived: true,
      serverUpdatedAt: '2026-07-15T13:00:01.000Z',
    });
    expect(targetBill.payload).toMatchObject({
      id: 88,
      name: 'Rent',
      archived: true,
      last_updated: '2026-07-15T13:00:00.000Z',
    });

    expect(database.outbox.find((row) => row.id === 'create-payment')?.payload.bill_id).toBe(88);
    expect(database.outbox.find((row) => row.id === 'create-payment')?.baseUpdatedAt)
      .toBe('2026-07-15T13:00:00.000Z');
    expect(database.outbox.find((row) => row.id === 'update-bill')?.entityId).toBe('88');
    expect(database.outbox.find((row) => row.id === 'update-bill')?.baseUpdatedAt)
      .toBe('2026-07-15T13:00:00.000Z');
    expect(database.outbox.find((row) => row.id === 'archive-bill')?.entityId).toBe('88');
    expect(database.outbox.find((row) => row.id === 'restore-bill')?.entityId).toBe('88');
    expect(database.payments[0]).toMatchObject({ billId: '88', dirty: true });
    expect(database.payments[0].payload.bill_id).toBe(88);

    expect(database.bills[1]).toMatchObject({ entityId: temporaryId });
    expect(database.bills[2]).toMatchObject({ entityId: temporaryId });
    expect(database.outbox.find((row) => row.id === 'other-profile-payment')?.payload.bill_id)
      .toBe(-7);
    expect(database.outbox.find((row) => row.id === 'other-database-update')?.entityId)
      .toBe(temporaryId);
    expect(database.payments[1].billId).toBe(temporaryId);
    expect(database.payments[2].billId).toBe(temporaryId);
  });

  it('does nothing when a create result has no durable server id', async () => {
    const database = new ReconciliationDatabase([], [], []);
    const repository = new SQLiteSyncRepository(async () => database as never);

    await repository.applyResult({
      id: 'create-bill',
      serverProfileId: 'server-a',
      databaseId: 'family',
      entity: 'bill',
      entityId: '-7',
      operation: 'create',
      payload: {},
      baseUpdatedAt: null,
      createdAt: '2026-07-15T12:00:00.000Z',
      attempts: 0,
      nextAttemptAt: null,
      dependsOn: null,
      status: 'processing',
      lastError: null,
    }, { serverEntity: { name: 'Missing id' } });

    expect(database.bills).toEqual([]);
    expect(database.outbox).toEqual([]);
    expect(database.payments).toEqual([]);
  });
});

describe('SQLiteSyncRepository background scopes', () => {
  it('discovers every profile and database with unresolved outbox work', async () => {
    const getAllAsync = vi.fn().mockResolvedValue([
      { server_profile_id: 'billmanager-cloud', database_id: 'personal' },
      { server_profile_id: 'server-home', database_id: 'family' },
    ]);
    const repository = new SQLiteSyncRepository(async () => ({ getAllAsync }) as never);

    await expect(repository.listMutationScopes()).resolves.toEqual([
      { serverProfileId: 'billmanager-cloud', databaseId: 'personal' },
      { serverProfileId: 'server-home', databaseId: 'family' },
    ]);
    expect(getAllAsync).toHaveBeenCalledWith(expect.stringContaining("status IN ('pending', 'processing', 'retry', 'conflict')"));
  });
});

describe('SQLiteSyncRepository mutation version chaining', () => {
  it('persists a successful update timestamp into the cache and later bill mutations', async () => {
    let cachedPayload: Record<string, unknown> = {
      id: 44,
      name: 'Rent',
      last_updated: '2026-07-15T10:00:00.000Z',
    };
    let queuedBase: string | null = '2026-07-15T10:00:00.000Z';
    const database = {
      withTransactionAsync: async (callback: () => Promise<void>) => callback(),
      getFirstAsync: vi.fn().mockResolvedValue({
        payload_json: JSON.stringify(cachedPayload),
      }),
      runAsync: vi.fn(async (sql: string, ...params: unknown[]) => {
        if (sql.includes('UPDATE bills SET payload_json')) {
          cachedPayload = JSON.parse(String(params[0])) as Record<string, unknown>;
          return;
        }
        if (sql.includes('UPDATE outbox SET base_updated_at')) {
          queuedBase = String(params[0]);
          return;
        }
        throw new Error(`Unexpected run query: ${sql}`);
      }),
    };
    const repository = new SQLiteSyncRepository(async () => database as never);

    await repository.applyResult({
      id: 'first-update',
      serverProfileId: 'server-a',
      databaseId: 'family',
      entity: 'bill',
      entityId: '44',
      operation: 'update',
      payload: { name: 'Updated rent' },
      baseUpdatedAt: '2026-07-15T10:00:00.000Z',
      createdAt: '2026-07-15T11:00:00.000Z',
      attempts: 0,
      nextAttemptAt: null,
      dependsOn: null,
      status: 'processing',
      lastError: null,
    }, {
      serverEntity: { id: 44, last_updated: '2026-07-15T12:00:00.000Z' },
      serverUpdatedAt: '2026-07-15T12:00:00.000Z',
    });

    expect(cachedPayload.last_updated).toBe('2026-07-15T12:00:00.000Z');
    expect(queuedBase).toBe('2026-07-15T12:00:00.000Z');
    expect(database.runAsync).toHaveBeenLastCalledWith(
      expect.stringContaining("entity IN ('bill', 'bill_archive', 'bill_restore', 'reminder_settings')"),
      '2026-07-15T12:00:00.000Z',
      'server-a',
      'family',
      '44',
      'first-update',
      '2026-07-15T11:00:00.000Z',
      '2026-07-15T11:00:00.000Z',
      'first-update',
      'first-update',
    );
  });

  it('finds the latest unresolved mutation across bill operations', async () => {
    const getFirstAsync = vi.fn().mockResolvedValue({ id: 'latest-bill-change' });
    const repository = new SQLiteSyncRepository(async () => ({ getFirstAsync }) as never);

    await expect(repository.findLatestPendingForEntity(
      'server-a',
      'family',
      'bill_restore',
      '44',
    )).resolves.toBe('latest-bill-change');
    expect(getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("entity IN ('bill', 'bill_archive', 'bill_restore', 'reminder_settings')"),
      'server-a',
      'family',
      '44',
    );
  });

  it('treats an offline payment create as a pending mutation of its bill', async () => {
    const getAllAsync = vi.fn().mockResolvedValue([
      {
        id: 'pending-payment',
        entity: 'payment',
        entity_id: '-501',
        operation: 'create',
        payload_json: JSON.stringify({ bill_id: 44, advance_due: true }),
      },
    ]);
    const repository = new SQLiteSyncRepository(async () => ({ getAllAsync }) as never);

    await expect(repository.findLatestPendingForBill(
      'server-a',
      'family',
      '44',
    )).resolves.toBe('pending-payment');
  });
});

describe('SQLiteSyncRepository payment creation reconciliation', () => {
  it('remaps the temporary payment cache id and scoped dependent mutations', async () => {
    const targetProfile = 'server-a';
    const targetDatabase = 'family';
    const temporaryId = '-501';
    const database = new ReconciliationDatabase(
      [
        {
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entityId: '44',
          payload: {
            id: 44,
            name: 'Utilities',
            last_updated: '2026-07-15T11:59:00.000Z',
          },
          serverUpdatedAt: '2026-07-15T11:59:00.000Z',
          dirty: true,
          archived: false,
        },
      ],
      [
        {
          id: 'update-payment',
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entity: 'payment',
          entityId: temporaryId,
          payload: { amount: 75 },
          status: 'pending',
        },
        {
          id: 'delete-payment',
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entity: 'payment',
          entityId: temporaryId,
          payload: {},
          status: 'retry',
        },
        {
          id: 'second-payment',
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entity: 'payment',
          entityId: '-502',
          operation: 'create',
          payload: { bill_id: 44, amount: 25, advance_due: true },
          baseUpdatedAt: '2026-07-15T11:59:00.000Z',
          dependsOn: 'create-payment',
          status: 'pending',
        },
        {
          id: 'other-profile-update',
          serverProfileId: 'server-b',
          databaseId: targetDatabase,
          entity: 'payment',
          entityId: temporaryId,
          payload: { amount: 15 },
          status: 'pending',
        },
        {
          id: 'other-database-delete',
          serverProfileId: targetProfile,
          databaseId: 'personal',
          entity: 'payment',
          entityId: temporaryId,
          payload: {},
          status: 'pending',
        },
      ],
      [
        {
          serverProfileId: targetProfile,
          databaseId: targetDatabase,
          entityId: temporaryId,
          billId: '44',
          payload: {
            id: -501,
            bill_id: 44,
            amount: 50,
            payment_date: '2026-07-15',
          },
          dirty: true,
        },
        {
          serverProfileId: 'server-b',
          databaseId: targetDatabase,
          entityId: temporaryId,
          billId: '44',
          payload: { id: -501, bill_id: 44, amount: 15 },
          dirty: true,
        },
      ],
    );
    const repository = new SQLiteSyncRepository(async () => database as never);

    await repository.applyResult({
      id: 'create-payment',
      serverProfileId: targetProfile,
      databaseId: targetDatabase,
      entity: 'payment',
      entityId: temporaryId,
      operation: 'create',
      payload: { bill_id: 44, amount: 50 },
      baseUpdatedAt: null,
      createdAt: '2026-07-15T12:00:00.000Z',
      attempts: 0,
      nextAttemptAt: null,
      dependsOn: null,
      status: 'processing',
      lastError: null,
    }, {
      serverEntity: {
        id: 901,
        updated_at: '2026-07-15T12:01:00.000Z',
        bill_last_updated: '2026-07-15T12:01:01.000Z',
      },
      serverUpdatedAt: '2026-07-15T12:01:01.000Z',
    });

    expect(database.payments[0]).toMatchObject({
      entityId: '901',
      billId: '44',
      dirty: true,
    });
    expect(database.payments[0].payload).toMatchObject({
      id: 901,
      bill_id: 44,
      amount: 50,
      updated_at: '2026-07-15T12:01:00.000Z',
    });
    expect(database.outbox.find((row) => row.id === 'update-payment')?.entityId).toBe('901');
    expect(database.outbox.find((row) => row.id === 'update-payment')?.baseUpdatedAt)
      .toBe('2026-07-15T12:01:00.000Z');
    expect(database.outbox.find((row) => row.id === 'delete-payment')?.entityId).toBe('901');
    expect(database.outbox.find((row) => row.id === 'second-payment')?.baseUpdatedAt)
      .toBe('2026-07-15T12:01:01.000Z');
    expect(database.bills[0].payload.last_updated).toBe('2026-07-15T12:01:01.000Z');
    expect(database.outbox.find((row) => row.id === 'other-profile-update')?.entityId)
      .toBe(temporaryId);
    expect(database.outbox.find((row) => row.id === 'other-database-delete')?.entityId)
      .toBe(temporaryId);
    expect(database.payments[1].entityId).toBe(temporaryId);
  });
});

describe('SQLiteSyncRepository interrupted processing recovery', () => {
  it('recovers only processing rows in the requested profile/database scope', async () => {
    const rows = [
      {
        id: 'stale-target',
        server_profile_id: 'server-a',
        database_id: 'family',
        entity: 'bill' as const,
        entity_id: '10',
        operation: 'update' as const,
        payload_json: JSON.stringify({ name: 'Recovered' }),
        base_updated_at: null,
        created_at: '2026-07-15T10:00:00.000Z',
        attempts: 1,
        next_attempt_at: null,
        depends_on: null,
        status: 'processing' as OutboxStatus,
        last_error: null as string | null,
      },
      {
        id: 'stale-other-profile',
        server_profile_id: 'server-b',
        database_id: 'family',
        entity: 'bill' as const,
        entity_id: '11',
        operation: 'update' as const,
        payload_json: JSON.stringify({ name: 'Untouched' }),
        base_updated_at: null,
        created_at: '2026-07-15T10:01:00.000Z',
        attempts: 1,
        next_attempt_at: null,
        depends_on: null,
        status: 'processing' as OutboxStatus,
        last_error: null as string | null,
      },
    ];
    const database = {
      runAsync: vi.fn(async (sql: string, serverProfileId: string, databaseId: string) => {
        if (!sql.includes("status = 'retry'")) throw new Error(`Unexpected run query: ${sql}`);
        for (const row of rows) {
          if (
            row.server_profile_id === serverProfileId
            && row.database_id === databaseId
            && row.status === 'processing'
          ) {
            row.status = 'retry';
            row.next_attempt_at = null;
            row.last_error = 'Recovered an interrupted synchronization attempt.';
          }
        }
        return { changes: 1 };
      }),
      getAllAsync: vi.fn(async (
        _sql: string,
        serverProfileId: string,
        databaseId: string,
      ) => rows.filter((row) => (
        row.server_profile_id === serverProfileId
        && row.database_id === databaseId
        && (row.status === 'pending' || row.status === 'retry')
      ))),
    };
    const repository = new SQLiteSyncRepository(async () => database as never);

    const ready = await repository.getReady(
      'server-a',
      'family',
      '2026-07-15T12:00:00.000Z',
    );

    expect(ready).toHaveLength(1);
    expect(ready[0]).toMatchObject({
      id: 'stale-target',
      status: 'retry',
      lastError: 'Recovered an interrupted synchronization attempt.',
    });
    expect(rows[1].status).toBe('processing');
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("status = 'processing'"),
      'server-a',
      'family',
    );
  });
});
