import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-sqlite', () => ({ openDatabaseAsync: vi.fn() }));
vi.mock('expo-crypto', () => ({ getRandomBytesAsync: vi.fn() }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

import { SQLiteAuthSessionStore } from '../data/authSessionRepository';

describe('SQLiteAuthSessionStore', () => {
  it('scopes a durable authenticated snapshot to its server profile', async () => {
    const runAsync = vi.fn().mockResolvedValue(undefined);
    const getFirstAsync = vi.fn().mockResolvedValue({
      user_json: JSON.stringify({ id: 7, username: 'alice', role: 'admin' }),
      databases_json: JSON.stringify([{ id: 4, name: 'family', display_name: 'Family' }]),
      current_database: 'family',
      updated_at: '2026-07-15T12:00:00.000Z',
    });
    const store = new SQLiteAuthSessionStore(async () => ({ runAsync, getFirstAsync }) as never);
    const snapshot = {
      user: { id: 7, username: 'alice', role: 'admin' as const },
      databases: [{ id: 4, name: 'family', display_name: 'Family' }],
      currentDatabase: 'family',
      updatedAt: '2026-07-15T12:00:00.000Z',
    };

    await store.save('server-home', snapshot);
    await expect(store.get('server-home')).resolves.toEqual(snapshot);

    expect(runAsync.mock.calls[0].slice(1, 3)).toEqual([
      'server-home',
      JSON.stringify(snapshot.user),
    ]);
    expect(getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('FROM auth_sessions WHERE server_profile_id = ?'),
      'server-home',
    );
  });

  it('updates and clears only the requested profile snapshot', async () => {
    const runAsync = vi.fn().mockResolvedValue(undefined);
    const store = new SQLiteAuthSessionStore(async () => ({ runAsync }) as never);

    await store.setCurrentDatabase('server-home', '_all_');
    await store.clear('server-home');

    expect(runAsync.mock.calls[0][1]).toBe('_all_');
    expect(runAsync.mock.calls[0][3]).toBe('server-home');
    expect(runAsync.mock.calls[1]).toEqual([
      'DELETE FROM auth_sessions WHERE server_profile_id = ?',
      'server-home',
    ]);
  });

  it('lists the last selected database for every durable profile session', async () => {
    const getAllAsync = vi.fn().mockResolvedValue([
      { server_profile_id: 'billmanager-cloud', current_database: '_all_' },
      { server_profile_id: 'server-home', current_database: 'family' },
    ]);
    const store = new SQLiteAuthSessionStore(async () => ({ getAllAsync }) as never);

    await expect(store.listCurrentScopes()).resolves.toEqual([
      { serverProfileId: 'billmanager-cloud', databaseId: '_all_' },
      { serverProfileId: 'server-home', databaseId: 'family' },
    ]);
    expect(getAllAsync).toHaveBeenCalledWith(expect.stringContaining('current_database IS NOT NULL'));
  });
});
