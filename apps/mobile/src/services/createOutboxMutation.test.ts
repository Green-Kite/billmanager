import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-crypto', () => ({ randomUUID: vi.fn(() => 'generated-id') }));

import { createOutboxMutation } from './createOutboxMutation';

describe('createOutboxMutation', () => {
  it('uses one id as the durable queue key and server idempotency key', () => {
    const result = createOutboxMutation(
      {
        serverProfileId: 'server-a',
        databaseId: 'family',
        entity: 'bill',
        entityId: '10',
        operation: 'update',
        payload: { name: 'Power' },
        baseUpdatedAt: '2026-07-15T00:00:00.000Z',
      },
      {
        id: '019f-test-mutation',
        now: new Date('2026-07-15T12:00:00.000Z'),
      },
    );

    expect(result).toMatchObject({
      id: '019f-test-mutation',
      status: 'pending',
      attempts: 0,
      nextAttemptAt: null,
      baseUpdatedAt: '2026-07-15T00:00:00.000Z',
    });
  });
});
