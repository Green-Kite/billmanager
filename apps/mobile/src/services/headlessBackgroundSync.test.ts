import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-sqlite', () => ({ openDatabaseAsync: vi.fn() }));
vi.mock('expo-crypto', () => ({ getRandomBytesAsync: vi.fn() }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));
vi.mock('../native/localNotifications', () => ({
  scheduleLocalBillReminders: vi.fn(),
}));

import { runHeadlessBackgroundSync } from './headlessBackgroundSync';

describe('headless background synchronization', () => {
  it('deduplicates persisted scopes and refreshes each without activating it', async () => {
    const requestScopedGet = vi.fn(async (path: string, scope: { databaseId: string }) => ({
      success: true,
      data: path === '/bills'
        ? [{ id: scope.databaseId === 'family' ? 1 : 2, name: 'Rent' }]
        : [{ id: 9, bill_id: 1, amount: 100 }],
    }));
    const syncRepository = {
      enqueue: vi.fn(),
      getReady: vi.fn().mockResolvedValue([]),
      applyResult: vi.fn(),
      markProcessing: vi.fn(),
      markCompleted: vi.fn(),
      markRetry: vi.fn(),
      markConflict: vi.fn(),
      listMutationScopes: vi.fn().mockResolvedValue([
        { serverProfileId: 'server-home', databaseId: 'family' },
        { serverProfileId: 'billmanager-cloud', databaseId: 'personal' },
      ]),
      getSyncState: vi.fn().mockResolvedValue(null),
      setSyncState: vi.fn(),
      hasUnresolvedMutations: vi.fn().mockResolvedValue(false),
      pruneCompleted: vi.fn(),
    };
    const cacheRepository = {
      replaceBills: vi.fn(),
      replacePayments: vi.fn(),
      markScopeClean: vi.fn(),
    };
    const scheduleReminders = vi.fn().mockResolvedValue(1);

    const result = await runHeadlessBackgroundSync({
      api: {
        requestScopedGet,
        requestScopedMutation: vi.fn(),
      } as never,
      sessions: {
        listCurrentScopes: vi.fn().mockResolvedValue([
          { serverProfileId: 'server-home', databaseId: 'family' },
        ]),
      },
      syncRepository: syncRepository as never,
      cacheRepository,
      scheduleReminders,
      now: () => new Date('2026-07-15T12:00:00.000Z'),
    });

    expect(result).toEqual({ scopesAttempted: 2, scopesSucceeded: 2, scopesFailed: 0 });
    expect(requestScopedGet).toHaveBeenCalledTimes(4);
    expect(requestScopedGet).toHaveBeenCalledWith(
      '/bills',
      { serverProfileId: 'server-home', databaseId: 'family' },
      { include_archived: true },
    );
    expect(cacheRepository.markScopeClean).toHaveBeenCalledTimes(2);
    expect(scheduleReminders).toHaveBeenCalledTimes(2);
    expect(syncRepository.setSyncState).toHaveBeenCalledWith(
      'server-home',
      'family',
      expect.objectContaining({ status: 'idle', lastSyncedAt: '2026-07-15T12:00:00.000Z' }),
    );
  });
});
