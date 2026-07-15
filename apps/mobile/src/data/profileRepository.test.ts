import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-sqlite', () => ({ openDatabaseAsync: vi.fn() }));
vi.mock('expo-crypto', () => ({ getRandomBytesAsync: vi.fn() }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

import { SQLiteServerProfileStore } from './profileRepository';

describe('SQLiteServerProfileStore profile identity migration', () => {
  it('re-keys every profile-scoped table in the same deferred transaction', async () => {
    const runAsync = vi.fn(async (sql: string) => ({
      changes: sql.startsWith('UPDATE server_profiles') ? 1 : 0,
    }));
    const database = {
      getFirstAsync: vi.fn().mockResolvedValue(null),
      execAsync: vi.fn().mockResolvedValue(undefined),
      runAsync,
      withTransactionAsync: vi.fn(async (callback: () => Promise<void>) => callback()),
    };
    const store = new SQLiteServerProfileStore(async () => database as never);

    await store.migrateProfileId('server-ce45fdba', 'server-v2-safe');

    expect(database.execAsync).toHaveBeenCalledWith('PRAGMA defer_foreign_keys = ON');
    const sql = runAsync.mock.calls.map(([statement]) => statement).join('\n');
    for (const table of [
      'bill_groups',
      'bills',
      'payments',
      'reminder_state',
      'analytics_snapshots',
      'sync_state',
      'outbox',
      'conflicts',
      'auth_sessions',
    ]) {
      expect(sql).toContain(`UPDATE ${table} SET server_profile_id = ?`);
    }
  });
});
