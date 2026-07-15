import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: vi.fn(async () => 'state-digest'),
}));
vi.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

import { oauthScopeTtlMs, SecureOAuthScopeStore } from './oauthScopeStore';

describe('SecureOAuthScopeStore', () => {
  it('consumes an authorization scope exactly once', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItemAsync: vi.fn(async (key: string) => values.get(key) ?? null),
      setItemAsync: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
      deleteItemAsync: vi.fn(async (key: string) => { values.delete(key); }),
    };
    const store = new SecureOAuthScopeStore(storage, () => 1000);
    const scope = { serverProfileId: 'server-a', databaseId: 'personal' };

    await store.save('oauth-state-a', scope);

    await expect(store.consume('oauth-state-a')).resolves.toEqual(scope);
    await expect(store.consume('oauth-state-a')).resolves.toBeNull();
  });

  it('rejects and deletes an expired authorization scope', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItemAsync: vi.fn(async (key: string) => values.get(key) ?? null),
      setItemAsync: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
      deleteItemAsync: vi.fn(async (key: string) => { values.delete(key); }),
    };
    let now = 1000;
    const store = new SecureOAuthScopeStore(storage, () => now);
    await store.save('oauth-state-a', { serverProfileId: 'server-a', databaseId: null });
    now += oauthScopeTtlMs + 1;

    await expect(store.consume('oauth-state-a')).resolves.toBeNull();
    expect(values.size).toBe(0);
  });
});
