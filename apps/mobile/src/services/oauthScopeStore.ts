import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import type { LegacySecureStore } from '../api/tokenStore';
import type { AuthSessionScope } from '../features/auth/types';

const OAUTH_SCOPE_PREFIX = 'billmanager_oauth_scope_v1_';
const OAUTH_SCOPE_TTL_MS = 15 * 60 * 1000;

interface StoredOAuthScope {
  scope: AuthSessionScope;
  createdAt: number;
}

export interface OAuthScopeStore {
  save(state: string, scope: AuthSessionScope): Promise<void>;
  consume(state: string): Promise<AuthSessionScope | null>;
}

async function storageKey(state: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    state,
  );
  return `${OAUTH_SCOPE_PREFIX}${digest.toLowerCase()}`;
}

export class SecureOAuthScopeStore implements OAuthScopeStore {
  constructor(
    private readonly storage: LegacySecureStore = SecureStore,
    private readonly now: () => number = Date.now,
  ) {}

  async save(state: string, scope: AuthSessionScope): Promise<void> {
    const value: StoredOAuthScope = { scope, createdAt: this.now() };
    await this.storage.setItemAsync(
      await storageKey(state),
      JSON.stringify(value),
      { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
    );
  }

  async consume(state: string): Promise<AuthSessionScope | null> {
    const key = await storageKey(state);
    const raw = await this.storage.getItemAsync(key);
    if (!raw) return null;
    await this.storage.deleteItemAsync(key);
    try {
      const value = JSON.parse(raw) as StoredOAuthScope;
      if (
        !value.scope?.serverProfileId
        || typeof value.createdAt !== 'number'
        || this.now() - value.createdAt > OAUTH_SCOPE_TTL_MS
      ) {
        return null;
      }
      return {
        serverProfileId: value.scope.serverProfileId,
        databaseId: value.scope.databaseId ?? null,
      };
    } catch {
      return null;
    }
  }
}

export const oauthScopeTtlMs = OAUTH_SCOPE_TTL_MS;
