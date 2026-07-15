import { describe, expect, it, vi } from 'vitest';
import type { BillManagerApi } from '../api/client';
import type { OutboxMutation } from '../domain/sync';
import { ApiOutboxMutationExecutor } from './apiOutboxExecutor';

function paymentMutation(): OutboxMutation<{ bill_id: number; amount: number }> {
  return {
    id: '019f-payment-mutation',
    serverProfileId: 'server-a',
    databaseId: 'family',
    entity: 'payment',
    entityId: null,
    operation: 'create',
    payload: { bill_id: 44, amount: 120 },
    baseUpdatedAt: '2026-07-15T00:00:00.000Z',
    createdAt: '2026-07-15T12:00:00.000Z',
    attempts: 0,
    nextAttemptAt: null,
    dependsOn: null,
    status: 'pending',
    lastError: null,
  };
}

describe('ApiOutboxMutationExecutor', () => {
  it('routes mutations and forwards durable concurrency metadata', async () => {
    const requestScopedMutation = vi.fn().mockResolvedValue({
      data: {
        id: 55,
        updated_at: '2026-07-15T12:01:00.000Z',
        bill_last_updated: '2026-07-15T12:02:00.000Z',
      },
    });
    const executor = new ApiOutboxMutationExecutor({ requestScopedMutation } as unknown as BillManagerApi);

    const result = await executor.execute(paymentMutation());

    expect(requestScopedMutation).toHaveBeenCalledWith(
      'POST',
      '/bills/44/pay',
      { amount: 120 },
      {
        clientMutationId: '019f-payment-mutation',
        baseUpdatedAt: '2026-07-15T00:00:00.000Z',
      },
      {
        serverProfileId: 'server-a',
        databaseId: 'family',
      },
    );
    expect(result).toEqual({
      serverEntity: {
        id: 55,
        updated_at: '2026-07-15T12:01:00.000Z',
        bill_last_updated: '2026-07-15T12:02:00.000Z',
      },
      serverUpdatedAt: '2026-07-15T12:02:00.000Z',
    });
  });

  it('preserves an explicit destination database when moving a bill from All Buckets', async () => {
    const requestScopedMutation = vi.fn().mockResolvedValue({ data: { id: 44 } });
    const executor = new ApiOutboxMutationExecutor({ requestScopedMutation } as unknown as BillManagerApi);
    const mutation: OutboxMutation<{ database_id: number }> = {
      ...paymentMutation(),
      id: '019f-bill-move',
      databaseId: '_all_',
      entity: 'bill',
      entityId: '44',
      operation: 'update',
      payload: { database_id: 9 },
    };

    await executor.execute(mutation);

    expect(requestScopedMutation).toHaveBeenCalledWith(
      'PUT',
      '/bills/44',
      { database_id: 9 },
      expect.objectContaining({ clientMutationId: '019f-bill-move' }),
      { serverProfileId: 'server-a', databaseId: '_all_' },
    );
  });
});
