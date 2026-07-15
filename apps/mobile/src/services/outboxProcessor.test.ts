import { describe, expect, it, vi } from 'vitest';
import type {
  OutboxMutation,
  OutboxStore,
  SyncConflict,
} from '../domain/sync';
import { OutboxProcessor } from './outboxProcessor';

function mutation(id: string): OutboxMutation {
  return {
    id,
    serverProfileId: 'server-a',
    databaseId: 'personal',
    entity: 'bill',
    entityId: '10',
    operation: 'update',
    payload: { name: id },
    baseUpdatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-07-15T00:00:00.000Z',
    attempts: 0,
    nextAttemptAt: null,
    dependsOn: null,
    status: 'pending',
    lastError: null,
  };
}

function storeWith(items: OutboxMutation[]): OutboxStore & {
  applyResult: ReturnType<typeof vi.fn>;
  markCompleted: ReturnType<typeof vi.fn>;
  markRetry: ReturnType<typeof vi.fn>;
  markConflict: ReturnType<typeof vi.fn>;
} {
  return {
    enqueue: vi.fn().mockResolvedValue(undefined),
    getReady: vi.fn().mockResolvedValue(items),
    applyResult: vi.fn().mockResolvedValue(undefined),
    markProcessing: vi.fn().mockResolvedValue(undefined),
    markCompleted: vi.fn().mockResolvedValue(undefined),
    markRetry: vi.fn().mockResolvedValue(undefined),
    markConflict: vi.fn().mockResolvedValue(undefined),
  };
}

describe('OutboxProcessor', () => {
  const clock = () => new Date('2026-07-15T12:00:00.000Z');

  it('executes a profile/database queue sequentially', async () => {
    const store = storeWith([mutation('one'), mutation('two')]);
    const order: string[] = [];
    const executor = {
      execute: vi.fn(async (item: OutboxMutation) => {
        order.push(item.id);
        return {};
      }),
    };
    const processor = new OutboxProcessor(store, executor, { now: clock, random: () => 0.5 });

    const summary = await processor.process('server-a', 'personal');

    expect(order).toEqual(['one', 'two']);
    expect(store.applyResult).toHaveBeenCalledTimes(2);
    expect(store.applyResult.mock.invocationCallOrder[0])
      .toBeLessThan(store.markCompleted.mock.invocationCallOrder[0]);
    expect(summary).toEqual({ attempted: 2, completed: 2, conflicts: 0, retries: 0 });
  });

  it('chains later mutations in the ready snapshot to the prior server version', async () => {
    const first = mutation('first-edit');
    const second = mutation('second-edit');
    second.createdAt = '2026-07-15T00:01:00.000Z';
    const store = storeWith([first, second]);
    const observedBases: Array<string | null> = [];
    const executor = {
      execute: vi.fn(async (item: OutboxMutation) => {
        observedBases.push(item.baseUpdatedAt);
        return {
          serverUpdatedAt: item.id === first.id
            ? '2026-07-15T12:01:00.000Z'
            : '2026-07-15T12:02:00.000Z',
        };
      }),
    };
    const processor = new OutboxProcessor(store, executor, { now: clock });

    await processor.process('server-a', 'personal');

    expect(observedBases).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-07-15T12:01:00.000Z',
    ]);
  });

  it('reconciles the executor result before completing the mutation', async () => {
    const item = {
      ...mutation('create-bill'),
      operation: 'create' as const,
      entityId: '-7',
    };
    const store = storeWith([item]);
    const result = {
      serverEntity: { id: 88, last_updated: '2026-07-15T12:01:00.000Z' },
      serverUpdatedAt: '2026-07-15T12:01:00.000Z',
    };
    const executor = { execute: vi.fn().mockResolvedValue(result) };
    const processor = new OutboxProcessor(store, executor, { now: clock });

    await processor.process('server-a', 'personal');

    expect(store.applyResult).toHaveBeenCalledWith(item, result);
    expect(store.applyResult.mock.invocationCallOrder[0])
      .toBeLessThan(store.markCompleted.mock.invocationCallOrder[0]);
  });

  it('maps a stable 409 response to a user-resolvable conflict', async () => {
    const item = mutation('conflict');
    const store = storeWith([item]);
    const executor = {
      execute: vi.fn().mockRejectedValue({
        response: {
          status: 409,
          data: {
            reason: 'modified',
            server_data: { id: 10, name: 'Server version' },
            server_updated_at: '2026-07-15T11:59:00.000Z',
          },
        },
      }),
    };
    const processor = new OutboxProcessor(store, executor, { now: clock });

    const summary = await processor.process('server-a', 'personal');

    expect(summary.conflicts).toBe(1);
    const conflict = store.markConflict.mock.calls[0][0] as SyncConflict;
    expect(conflict.mutationId).toBe('conflict');
    expect(conflict.local).toEqual(item.payload);
    expect(conflict.server).toEqual({ id: 10, name: 'Server version' });
  });

  it('maps the server contract conflict envelope without retrying it', async () => {
    const item = mutation('contract-conflict');
    const store = storeWith([item]);
    const executor = {
      execute: vi.fn().mockRejectedValue({
        response: {
          status: 409,
          data: {
            success: false,
            code: 'resource_conflict',
            conflict: {
              entity: 'bill',
              entity_id: 10,
              reason: 'modified',
              server: { id: 10, name: 'Server contract version' },
              server_updated_at: '2026-07-15T11:58:00.000Z',
            },
          },
        },
      }),
    };
    const processor = new OutboxProcessor(store, executor, { now: clock });

    const summary = await processor.process('server-a', 'personal');

    expect(summary).toEqual({ attempted: 1, completed: 0, conflicts: 1, retries: 0 });
    expect(store.markConflict).toHaveBeenCalledWith(expect.objectContaining({
      reason: 'modified',
      server: { id: 10, name: 'Server contract version' },
      serverUpdatedAt: '2026-07-15T11:58:00.000Z',
    }));
  });

  it('quarantines permission loss and continues later independent mutations', async () => {
    const rejected = mutation('permission-lost');
    const later = mutation('later-change');
    const store = storeWith([rejected, later]);
    const executor = {
      execute: vi.fn(async (item: OutboxMutation) => {
        if (item.id === rejected.id) {
          throw {
            response: {
              status: 403,
              data: { success: false, error: 'Access to this bill was revoked.' },
            },
          };
        }
        return {};
      }),
    };
    const processor = new OutboxProcessor(store, executor, { now: clock });

    const summary = await processor.process('server-a', 'personal');

    expect(summary).toEqual({ attempted: 2, completed: 1, conflicts: 1, retries: 0 });
    expect(store.markConflict).toHaveBeenCalledWith(expect.objectContaining({
      mutationId: 'permission-lost',
      reason: 'permission_changed',
      server: expect.objectContaining({
        __sync_failure: true,
        status: 403,
        error: 'Access to this bill was revoked.',
      }),
    }));
    expect(store.markCompleted).toHaveBeenCalledWith('later-change');
    expect(store.markRetry).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'modified'],
    [401, 'permission_changed'],
    [404, 'deleted'],
  ] as const)('quarantines permanent HTTP %s failures as %s', async (status, reason) => {
    const item = mutation(`http-${status}`);
    const store = storeWith([item]);
    const executor = {
      execute: vi.fn().mockRejectedValue({
        response: { status, data: { success: false, error: `HTTP ${status}` } },
      }),
    };
    const processor = new OutboxProcessor(store, executor, { now: clock });

    const summary = await processor.process('server-a', 'personal');

    expect(summary.conflicts).toBe(1);
    expect(summary.retries).toBe(0);
    expect(store.markConflict).toHaveBeenCalledWith(expect.objectContaining({ reason }));
  });

  it('backs off and stops the scope after a transient failure', async () => {
    const store = storeWith([mutation('failed'), mutation('must-wait')]);
    const executor = { execute: vi.fn().mockRejectedValue(new Error('offline')) };
    const processor = new OutboxProcessor(store, executor, { now: clock, random: () => 0.5 });

    const summary = await processor.process('server-a', 'personal');

    expect(executor.execute).toHaveBeenCalledTimes(1);
    expect(summary.retries).toBe(1);
    expect(store.markRetry).toHaveBeenCalledWith(
      'failed',
      1,
      '2026-07-15T12:00:02.000Z',
      'offline',
    );
  });
});
