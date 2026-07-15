import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: vi.fn(async (_algorithm: string, value: string) => {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(value).digest('hex');
  }),
}));

import type { ProfileTokens, ProfileTokenStore } from '../api/tokenStore';
import {
  legacyProfileIdForBaseUrl,
  profileIdForBaseUrl,
  type PersistedServerProfile,
  type ServerProfileStore,
} from '../domain/serverProfile';
import { migrateProfileIdentities } from './profileIdentityMigration';

function storesFor(profile: PersistedServerProfile) {
  const profiles = new Map([[profile.id, { ...profile }]]);
  const tokens = new Map<string, ProfileTokens>([[profile.id, {
    accessToken: 'victim-access',
    refreshToken: 'victim-refresh',
  }]]);
  const cachedScopes = new Map([[profile.id, ['bill-1', 'payment-1', 'outbox-1']]]);

  const profileStore: ServerProfileStore = {
    getActive: vi.fn(async () => [...profiles.values()].find((item) => item.isActive) ?? null),
    getById: vi.fn(async (id) => profiles.get(id) ?? null),
    list: vi.fn(async () => [...profiles.values()]),
    upsert: vi.fn(async (item) => { profiles.set(item.id, { ...item }); }),
    setActive: vi.fn(async () => undefined),
    setSelectedDatabase: vi.fn(async () => undefined),
    migrateProfileId: vi.fn(async (previousId, nextId) => {
      const current = profiles.get(previousId);
      if (!current) throw new Error('missing profile');
      profiles.delete(previousId);
      profiles.set(nextId, { ...current, id: nextId });
      const cache = cachedScopes.get(previousId);
      cachedScopes.delete(previousId);
      if (cache) cachedScopes.set(nextId, cache);
    }),
  };
  const tokenStore: ProfileTokenStore = {
    load: vi.fn(async (id) => tokens.get(id) ?? {
      accessToken: null,
      refreshToken: null,
    }),
    save: vi.fn(async (id, value) => { tokens.set(id, { ...value }); }),
    clear: vi.fn(async (id) => { tokens.delete(id); }),
  };
  return { profileStore, tokenStore, profiles, tokens, cachedScopes };
}

describe('profile identity migration', () => {
  it('moves legacy profile tokens and cached scopes without exposing the collision', async () => {
    const victimUrl = 'https://victim.example/api/v2';
    const attackerUrl = 'https://attacker.example/9YJEx5/api/v2';
    const legacyId = legacyProfileIdForBaseUrl(victimUrl);
    expect(legacyId).toBe(legacyProfileIdForBaseUrl(attackerUrl));

    const stores = storesFor({
      id: legacyId,
      displayName: 'Victim',
      baseUrl: victimUrl,
      deploymentMode: 'self_hosted',
      lastVerifiedAt: null,
      capabilities: null,
      selectedDatabase: 'personal',
      isActive: true,
    });
    const victimId = await profileIdForBaseUrl(victimUrl);
    const attackerId = await profileIdForBaseUrl(attackerUrl);

    await expect(migrateProfileIdentities(
      stores.profileStore,
      stores.tokenStore,
    )).resolves.toEqual([{ previousId: legacyId, nextId: victimId }]);

    expect(victimId).not.toBe(attackerId);
    expect(stores.profiles.has(legacyId)).toBe(false);
    expect(stores.profiles.get(victimId)?.baseUrl).toBe(victimUrl);
    expect(stores.tokens.has(legacyId)).toBe(false);
    expect(stores.tokens.get(victimId)).toEqual({
      accessToken: 'victim-access',
      refreshToken: 'victim-refresh',
    });
    expect(stores.cachedScopes.get(victimId)).toEqual([
      'bill-1',
      'payment-1',
      'outbox-1',
    ]);
    expect(stores.cachedScopes.has(attackerId)).toBe(false);
  });
});
