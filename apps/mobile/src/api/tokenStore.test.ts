import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

import {
  SecureProfileTokenStore,
  profileTokenSecureStoreOptions,
  profileTokenStorageKey,
} from './tokenStore';

describe('SecureProfileTokenStore', () => {
  it('isolates credentials by server profile and uses device-only storage', async () => {
    const storage = {
      getItemAsync: vi.fn().mockResolvedValue(null),
      setItemAsync: vi.fn().mockResolvedValue(undefined),
      deleteItemAsync: vi.fn().mockResolvedValue(undefined),
    };
    const tokenStore = new SecureProfileTokenStore(storage);

    await tokenStore.save('server-a', {
      accessToken: 'access-a',
      refreshToken: 'refresh-a',
    });
    await tokenStore.save('server-b', {
      accessToken: 'access-b',
      refreshToken: 'refresh-b',
    });

    expect(profileTokenStorageKey('server-a', 'access')).not.toBe(
      profileTokenStorageKey('server-b', 'access'),
    );
    expect(storage.setItemAsync).toHaveBeenCalledWith(
      profileTokenStorageKey('server-a', 'access'),
      'access-a',
      profileTokenSecureStoreOptions,
    );
  });
});
