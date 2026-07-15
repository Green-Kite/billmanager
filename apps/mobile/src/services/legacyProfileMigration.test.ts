import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: vi.fn(async (_algorithm: string, value: string) => {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(value).digest('hex');
  }),
}));
import type { PersistedServerProfile, ServerProfileStore } from '../domain/serverProfile';
import type { ProfileTokenStore } from '../api/tokenStore';
import {
  legacyMobileStorageKeys,
  migrateLegacyProfile,
} from './legacyProfileMigration';

function memoryProfileStore(): ServerProfileStore & { profiles: Map<string, PersistedServerProfile> } {
  const profiles = new Map<string, PersistedServerProfile>();
  return {
    profiles,
    getActive: vi.fn(async () => [...profiles.values()].find((profile) => profile.isActive) ?? null),
    getById: vi.fn(async (id) => profiles.get(id) ?? null),
    list: vi.fn(async () => [...profiles.values()]),
    upsert: vi.fn(async (profile) => {
      if (profile.isActive) {
        for (const saved of profiles.values()) saved.isActive = false;
      }
      profiles.set(profile.id, { ...profile });
    }),
    setActive: vi.fn(async (id) => {
      for (const saved of profiles.values()) saved.isActive = saved.id === id;
    }),
    setSelectedDatabase: vi.fn(async (id, databaseId) => {
      const profile = profiles.get(id);
      if (profile) profile.selectedDatabase = databaseId;
    }),
  };
}

function memoryTokenStore(): ProfileTokenStore & { tokens: Map<string, { accessToken: string | null; refreshToken: string | null }> } {
  const tokens = new Map<string, { accessToken: string | null; refreshToken: string | null }>();
  return {
    tokens,
    load: vi.fn(async (id) => tokens.get(id) ?? { accessToken: null, refreshToken: null }),
    save: vi.fn(async (id, value) => { tokens.set(id, value); }),
    clear: vi.fn(async (id) => { tokens.delete(id); }),
  };
}

describe('legacy mobile profile migration', () => {
  it('migrates self-hosted URL, selected group, and global tokens atomically', async () => {
    const values = new Map<string, string>([
      [legacyMobileStorageKeys.serverType, 'self-hosted'],
      [legacyMobileStorageKeys.apiUrl, 'https://bills.example.com/'],
      [legacyMobileStorageKeys.currentGroup, 'family'],
      [legacyMobileStorageKeys.accessToken, 'legacy-access'],
      [legacyMobileStorageKeys.refreshToken, 'legacy-refresh'],
    ]);
    const storage = {
      getItemAsync: vi.fn(async (key: string) => values.get(key) ?? null),
      setItemAsync: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
      deleteItemAsync: vi.fn(async (key: string) => { values.delete(key); }),
    };
    const profiles = memoryProfileStore();
    const tokens = memoryTokenStore();

    const result = await migrateLegacyProfile(profiles, tokens, storage);

    expect(result.profile.baseUrl).toBe('https://bills.example.com/api/v2');
    expect(result.profile.deploymentMode).toBe('self_hosted');
    expect(result.profile.selectedDatabase).toBe('family');
    expect(tokens.tokens.get(result.profile.id)).toEqual({
      accessToken: 'legacy-access',
      refreshToken: 'legacy-refresh',
    });
    expect(values.has(legacyMobileStorageKeys.accessToken)).toBe(false);
    expect(values.get(legacyMobileStorageKeys.serverType)).toBe('self-hosted');
  });

  it('does not let legacy credentials overwrite existing scoped credentials', async () => {
    const active: PersistedServerProfile = {
      id: 'billmanager-cloud',
      displayName: 'BillManager Cloud',
      baseUrl: 'https://app.billmanager.app/api/v2',
      deploymentMode: 'saas',
      lastVerifiedAt: null,
      capabilities: null,
      selectedDatabase: 'personal',
      isActive: true,
    };
    const profiles = memoryProfileStore();
    profiles.profiles.set(active.id, active);
    const tokens = memoryTokenStore();
    tokens.tokens.set(active.id, { accessToken: 'current', refreshToken: 'current-refresh' });
    const storage = {
      getItemAsync: vi.fn(async (key: string) =>
        key === legacyMobileStorageKeys.accessToken ? 'stale' : null),
      setItemAsync: vi.fn().mockResolvedValue(undefined),
      deleteItemAsync: vi.fn().mockResolvedValue(undefined),
    };

    await migrateLegacyProfile(profiles, tokens, storage);

    expect(tokens.tokens.get(active.id)).toEqual({
      accessToken: 'current',
      refreshToken: 'current-refresh',
    });
  });
});
