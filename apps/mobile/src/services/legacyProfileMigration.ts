import {
  CLOUD_API_BASE_URL,
  PersistedServerProfile,
  ServerProfileStore,
  defaultCloudProfile,
} from '../domain/serverProfile';
import { normalizeServerUrl, profileForUrl } from '../api/serverUrl';
import {
  LegacySecureStore,
  ProfileTokenStore,
} from '../api/tokenStore';

const LEGACY_KEYS = {
  accessToken: 'billmanager_access_token',
  refreshToken: 'billmanager_refresh_token',
  currentDatabase: 'billmanager_current_database',
  currentGroup: 'billmanager_current_group',
  serverType: 'billmanager_server_type',
  apiUrl: 'billmanager_api_url',
} as const;

const LEGACY_DEVELOPMENT_API_URL = 'http://192.168.2.48:5001/api/v2';

export interface LegacyMigrationResult {
  profile: PersistedServerProfile;
  migratedProfile: boolean;
  migratedTokens: boolean;
}

function buildLegacyProfile(
  serverType: string | null,
  apiUrl: string | null,
  selectedDatabase: string | null,
): Promise<PersistedServerProfile> {
  if (serverType === 'self-hosted' && apiUrl) {
    return profileForUrl(apiUrl, { allowInsecure: true }).then((profile) => ({
      ...profile,
      deploymentMode: 'self_hosted',
      selectedDatabase,
    }));
  }
  if (serverType === 'local-dev') {
    return profileForUrl(LEGACY_DEVELOPMENT_API_URL, { allowInsecure: true }).then((profile) => ({
      ...profile,
      deploymentMode: 'development',
      displayName: 'Local development',
      selectedDatabase,
    }));
  }
  return Promise.resolve({
    ...defaultCloudProfile(),
    baseUrl: normalizeServerUrl(CLOUD_API_BASE_URL),
    selectedDatabase,
  });
}

/**
 * Moves alpha-era global session data into an isolated server profile. The old
 * non-secret server preference keys remain temporarily because the legacy login
 * UI still reads them; global token keys are removed only after the scoped copy
 * succeeds.
 */
export async function migrateLegacyProfile(
  profileStore: ServerProfileStore,
  tokenStore: ProfileTokenStore,
  legacyStorage: LegacySecureStore,
): Promise<LegacyMigrationResult> {
  const [
    existingActive,
    serverType,
    apiUrl,
    currentDatabase,
    currentGroup,
    accessToken,
    refreshToken,
  ] = await Promise.all([
    profileStore.getActive(),
    legacyStorage.getItemAsync(LEGACY_KEYS.serverType),
    legacyStorage.getItemAsync(LEGACY_KEYS.apiUrl),
    legacyStorage.getItemAsync(LEGACY_KEYS.currentDatabase),
    legacyStorage.getItemAsync(LEGACY_KEYS.currentGroup),
    legacyStorage.getItemAsync(LEGACY_KEYS.accessToken),
    legacyStorage.getItemAsync(LEGACY_KEYS.refreshToken),
  ]);

  const selectedDatabase = currentDatabase ?? currentGroup;
  const profile = existingActive ?? await buildLegacyProfile(serverType, apiUrl, selectedDatabase);
  let migratedProfile = false;
  if (!existingActive) {
    await profileStore.upsert(profile);
    migratedProfile = true;
  } else if (!existingActive.selectedDatabase && selectedDatabase) {
    await profileStore.setSelectedDatabase(existingActive.id, selectedDatabase);
    profile.selectedDatabase = selectedDatabase;
  }

  let migratedTokens = false;
  if (accessToken || refreshToken) {
    const scoped = await tokenStore.load(profile.id);
    await tokenStore.save(profile.id, {
      accessToken: scoped.accessToken ?? accessToken,
      refreshToken: scoped.refreshToken ?? refreshToken,
    });
    await Promise.all([
      legacyStorage.deleteItemAsync(LEGACY_KEYS.accessToken),
      legacyStorage.deleteItemAsync(LEGACY_KEYS.refreshToken),
    ]);
    migratedTokens = true;
  }

  return { profile, migratedProfile, migratedTokens };
}

export const legacyMobileStorageKeys = LEGACY_KEYS;
