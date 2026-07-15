import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import Storage from 'expo-sqlite/kv-store';

const APP_LOCK_ENABLED_KEY = 'billmanager:app-lock-enabled';
const APP_LOCK_CREDENTIAL_MARKER_KEY = 'billmanager:app-lock-credential-marker';
const APP_LOCK_SECURE_SENTINEL_KEY = 'billmanager.app-lock.biometric-sentinel';
const APP_LOCK_SENTINEL = 'billmanager-biometric-enrollment-v1';

export type AppUnlockResult =
  | { success: true }
  | { success: false; reason: 'unavailable' | 'not-enrolled' | 'enrollment-changed' | 'cancelled' | 'failed' };

export async function isAppLockEnabled(): Promise<boolean> {
  return (await Storage.getItem(APP_LOCK_ENABLED_KEY)) === 'true';
}

export async function getBiometricAvailability(): Promise<{
  available: boolean;
  enrolled: boolean;
  types: LocalAuthentication.AuthenticationType[];
}> {
  const [available, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  return { available, enrolled, types };
}

export async function setAppLockEnabled(enabled: boolean): Promise<AppUnlockResult> {
  if (enabled) {
    const result = await authenticateLocally('Confirm biometrics to enable app lock');
    if (!result.success) return result;
    const credentialResult = await storeEnrollmentBoundCredential();
    if (!credentialResult.success) return credentialResult;
  } else {
    await Promise.all([
      SecureStore.deleteItemAsync(APP_LOCK_SECURE_SENTINEL_KEY),
      Storage.removeItem(APP_LOCK_CREDENTIAL_MARKER_KEY),
    ]);
  }
  await Storage.setItem(APP_LOCK_ENABLED_KEY, String(enabled));
  return { success: true };
}

export async function unlockApp(promptMessage = 'Unlock BillManager'): Promise<AppUnlockResult> {
  const hasEnrollmentCredential = (await Storage.getItem(APP_LOCK_CREDENTIAL_MARKER_KEY)) === 'true';
  if (hasEnrollmentCredential) {
    try {
      const sentinel = await SecureStore.getItemAsync(APP_LOCK_SECURE_SENTINEL_KEY, {
        requireAuthentication: true,
        authenticationPrompt: promptMessage,
      });
      return sentinel === APP_LOCK_SENTINEL
        ? { success: true }
        : { success: false, reason: 'enrollment-changed' };
    } catch (error) {
      return { success: false, reason: isCancellationError(error) ? 'cancelled' : 'failed' };
    }
  }

  // Upgrade an app lock created before the enrollment-bound credential existed.
  const result = await authenticateLocally(promptMessage);
  if (result.success) await storeEnrollmentBoundCredential();
  return result;
}

export async function resetAppLockAfterPasswordReauthentication(): Promise<AppUnlockResult> {
  const availability = await getBiometricAvailability();
  if (!availability.available) return { success: false, reason: 'unavailable' };
  if (!availability.enrolled) return { success: false, reason: 'not-enrolled' };
  return storeEnrollmentBoundCredential();
}

async function storeEnrollmentBoundCredential(): Promise<AppUnlockResult> {
  try {
    await SecureStore.setItemAsync(APP_LOCK_SECURE_SENTINEL_KEY, APP_LOCK_SENTINEL, {
      requireAuthentication: true,
      authenticationPrompt: 'Protect BillManager with biometrics',
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await Storage.setItem(APP_LOCK_CREDENTIAL_MARKER_KEY, 'true');
    return { success: true };
  } catch (error) {
    return { success: false, reason: isCancellationError(error) ? 'cancelled' : 'failed' };
  }
}

async function authenticateLocally(promptMessage: string): Promise<AppUnlockResult> {
  const availability = await getBiometricAvailability();
  if (!availability.available) return { success: false, reason: 'unavailable' };
  if (!availability.enrolled) return { success: false, reason: 'not-enrolled' };
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancel',
    fallbackLabel: 'Use device passcode',
    disableDeviceFallback: false,
  });

  if (result.success) return { success: true };
  if (result.error === 'user_cancel' || result.error === 'app_cancel' || result.error === 'system_cancel') {
    return { success: false, reason: 'cancelled' };
  }
  return { success: false, reason: 'failed' };
}

function isCancellationError(error: unknown): boolean {
  return error instanceof Error && /cancel|canceled|cancelled|user.*auth/i.test(error.message);
}
