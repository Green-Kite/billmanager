import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-sqlite', () => ({ openDatabaseAsync: vi.fn() }));
vi.mock('expo-crypto', () => ({ getRandomBytesAsync: vi.fn() }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));
import type { Bill } from '../types';
import { MobileCacheRepository } from '../data/cacheRepository';

describe('MobileCacheRepository bill scope', () => {
  it('writes archived bills into only the requested profile and database', async () => {
    const runAsync = vi.fn().mockResolvedValue(undefined);
    const database = {
      runAsync,
      withTransactionAsync: vi.fn(async (callback: () => Promise<void>) => callback()),
    };
    const repository = new MobileCacheRepository(async () => database as never);
    const archivedBill = {
      id: 42,
      name: 'Archived rent',
      next_due: '2026-08-01',
      archived: true,
    } as Bill;

    await repository.upsertBills(
      { serverProfileId: 'server-a', databaseId: 'family' },
      [archivedBill],
      { dirty: true },
    );

    expect(runAsync).toHaveBeenCalledTimes(1);
    const [, serverProfileId, databaseId, entityId, payloadJson, , , dirty, archived]
      = runAsync.mock.calls[0];
    expect({ serverProfileId, databaseId, entityId, dirty, archived }).toEqual({
      serverProfileId: 'server-a',
      databaseId: 'family',
      entityId: '42',
      dirty: 1,
      archived: 1,
    });
    expect(JSON.parse(payloadJson)).toMatchObject({ id: 42, archived: true });
  });

  it('uses profile, database, and archive visibility as cache read boundaries', async () => {
    const getAllAsync = vi.fn()
      .mockResolvedValueOnce([{ payload_json: JSON.stringify({ id: 1, archived: false }) }])
      .mockResolvedValueOnce([
        { payload_json: JSON.stringify({ id: 1, archived: false }) },
        { payload_json: JSON.stringify({ id: 2, archived: true }) },
      ]);
    const repository = new MobileCacheRepository(async () => ({ getAllAsync }) as never);
    const scope = { serverProfileId: 'server-a', databaseId: 'family' };

    const active = await repository.getBills(scope);
    const all = await repository.getBills(scope, true);

    expect(active.map((bill) => bill.id)).toEqual([1]);
    expect(all.map((bill) => bill.id)).toEqual([1, 2]);
    expect(getAllAsync.mock.calls[0].slice(1)).toEqual(['server-a', 'family', 0]);
    expect(getAllAsync.mock.calls[1].slice(1)).toEqual(['server-a', 'family', 1]);
    expect(getAllAsync.mock.calls[0][0]).toContain('server_profile_id = ? AND database_id = ?');
    expect(getAllAsync.mock.calls[0][0]).toContain('(? = 1 OR is_archived = 0)');
  });

  it('stores and reads feature snapshots inside the selected profile and database', async () => {
    const runAsync = vi.fn().mockResolvedValue(undefined);
    const getFirstAsync = vi.fn().mockResolvedValue({
      payload_json: JSON.stringify({ summary: { net_balance: 125 } }),
    });
    const repository = new MobileCacheRepository(async () => ({ runAsync, getFirstAsync }) as never);
    const scope = { serverProfileId: 'server-b', databaseId: '_all_' };

    await repository.putAnalyticsSnapshot(scope, 'settlements-v1', { summary: { net_balance: 125 } }, null);
    const saved = await repository.getAnalyticsSnapshot<{ summary: { net_balance: number } }>(scope, 'settlements-v1');

    expect(runAsync.mock.calls[0].slice(1, 4)).toEqual(['server-b', '_all_', 'settlements-v1']);
    expect(getFirstAsync.mock.calls[0].slice(1, 4)).toEqual(['server-b', '_all_', 'settlements-v1']);
    expect(saved?.summary.net_balance).toBe(125);
  });

  it('marks only the rejected scoped entity clean before server reconciliation', async () => {
    const runAsync = vi.fn().mockResolvedValue(undefined);
    const repository = new MobileCacheRepository(async () => ({ runAsync }) as never);

    await repository.markEntityClean(
      { serverProfileId: 'server-a', databaseId: 'family' },
      'payment',
      '-501',
    );

    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE payments SET is_dirty = 0'),
      'server-a',
      'family',
      '-501',
    );
  });

  it('persists reminder snooze and dismissed occurrence state by scope and bill', async () => {
    const runAsync = vi.fn().mockResolvedValue(undefined);
    const repository = new MobileCacheRepository(async () => ({ runAsync }) as never);

    await repository.putReminderState(
      { serverProfileId: 'server-a', databaseId: 'family' },
      {
        billId: '42',
        notificationIds: ['notification-1'],
        nextScheduledAt: '2026-08-01T09:00:00.000Z',
        snoozedUntil: '2026-08-01T09:00:00.000Z',
        dismissedDueDate: '2026-08-15',
        updatedAt: '2026-07-15T12:00:00.000Z',
      },
    );

    expect(runAsync.mock.calls[0].slice(1)).toEqual([
      'server-a',
      'family',
      '42',
      '["notification-1"]',
      '2026-08-01T09:00:00.000Z',
      '2026-08-01T09:00:00.000Z',
      '2026-08-15',
      '2026-07-15T12:00:00.000Z',
    ]);
  });
});
