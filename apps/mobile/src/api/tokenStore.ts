import * as SecureStore from 'expo-secure-store';

export interface ProfileTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface ProfileTokenStore {
  load(profileId: string): Promise<ProfileTokens>;
  save(profileId: string, tokens: ProfileTokens): Promise<void>;
  clear(profileId: string): Promise<void>;
}

export interface LegacySecureStore {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string, options?: SecureStore.SecureStoreOptions): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function key(profileId: string, token: 'access' | 'refresh'): string {
  return `billmanager_profile_${profileId}_${token}_token`;
}

export class SecureProfileTokenStore implements ProfileTokenStore {
  constructor(private readonly storage: LegacySecureStore = SecureStore) {}

  async load(profileId: string): Promise<ProfileTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.storage.getItemAsync(key(profileId, 'access')),
      this.storage.getItemAsync(key(profileId, 'refresh')),
    ]);
    return { accessToken, refreshToken };
  }

  async save(profileId: string, tokens: ProfileTokens): Promise<void> {
    const writes: Promise<void>[] = [];
    if (tokens.accessToken) {
      writes.push(this.storage.setItemAsync(key(profileId, 'access'), tokens.accessToken, secureOptions));
    } else {
      writes.push(this.storage.deleteItemAsync(key(profileId, 'access')));
    }
    if (tokens.refreshToken) {
      writes.push(this.storage.setItemAsync(key(profileId, 'refresh'), tokens.refreshToken, secureOptions));
    } else {
      writes.push(this.storage.deleteItemAsync(key(profileId, 'refresh')));
    }
    await Promise.all(writes);
  }

  async clear(profileId: string): Promise<void> {
    await Promise.all([
      this.storage.deleteItemAsync(key(profileId, 'access')),
      this.storage.deleteItemAsync(key(profileId, 'refresh')),
    ]);
  }
}

export const profileTokenStorageKey = key;
export const profileTokenSecureStoreOptions = secureOptions;
