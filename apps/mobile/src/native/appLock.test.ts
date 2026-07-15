import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  storageGet: vi.fn(),
  storageSet: vi.fn(),
  storageRemove: vi.fn(),
  secureGet: vi.fn(),
  secureSet: vi.fn(),
  secureDelete: vi.fn(),
  hasHardware: vi.fn(),
  isEnrolled: vi.fn(),
  supportedTypes: vi.fn(),
  authenticate: vi.fn(),
}));

vi.mock('expo-sqlite/kv-store', () => ({
  default: {
    getItem: mocks.storageGet,
    setItem: mocks.storageSet,
    removeItem: mocks.storageRemove,
  },
}));
vi.mock('expo-secure-store', () => ({
  getItemAsync: mocks.secureGet,
  setItemAsync: mocks.secureSet,
  deleteItemAsync: mocks.secureDelete,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked',
}));
vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: mocks.hasHardware,
  isEnrolledAsync: mocks.isEnrolled,
  supportedAuthenticationTypesAsync: mocks.supportedTypes,
  authenticateAsync: mocks.authenticate,
}));

import {
  resetAppLockAfterPasswordReauthentication,
  unlockApp,
} from './appLock';

describe('enrollment-bound app lock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasHardware.mockResolvedValue(true);
    mocks.isEnrolled.mockResolvedValue(true);
    mocks.supportedTypes.mockResolvedValue([1]);
  });

  it('requires password reauthentication when the enrollment-bound key is invalidated', async () => {
    mocks.storageGet.mockResolvedValue('true');
    mocks.secureGet.mockResolvedValue(null);

    await expect(unlockApp()).resolves.toEqual({ success: false, reason: 'enrollment-changed' });
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });

  it('unlocks when SecureStore authenticates and returns the enrollment sentinel', async () => {
    mocks.storageGet.mockResolvedValue('true');
    mocks.secureGet.mockResolvedValue('billmanager-biometric-enrollment-v1');

    await expect(unlockApp()).resolves.toEqual({ success: true });
    expect(mocks.secureGet).toHaveBeenCalledWith(
      'billmanager.app-lock.biometric-sentinel',
      expect.objectContaining({ requireAuthentication: true }),
    );
  });

  it('binds the replacement enrollment after password verification', async () => {
    mocks.secureSet.mockResolvedValue(undefined);
    mocks.storageSet.mockResolvedValue(undefined);

    await expect(resetAppLockAfterPasswordReauthentication()).resolves.toEqual({ success: true });
    expect(mocks.secureSet).toHaveBeenCalledWith(
      'billmanager.app-lock.biometric-sentinel',
      'billmanager-biometric-enrollment-v1',
      expect.objectContaining({ requireAuthentication: true }),
    );
    expect(mocks.storageSet).toHaveBeenCalledWith('billmanager:app-lock-credential-marker', 'true');
  });
});
