import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  getBiometricAvailability,
  isAppLockEnabled,
  resetAppLockAfterPasswordReauthentication,
  setAppLockEnabled,
  unlockApp,
  type AppUnlockResult,
} from '../native/appLock';

interface AppLockContextValue {
  enabled: boolean;
  locked: boolean;
  loading: boolean;
  biometricsAvailable: boolean;
  biometricsEnrolled: boolean;
  reauthenticationRequired: boolean;
  enable: () => Promise<AppUnlockResult>;
  disable: () => Promise<void>;
  unlock: () => Promise<AppUnlockResult>;
  completePasswordReauthentication: () => Promise<AppUnlockResult>;
  lock: () => void;
}

const AppLockContext = createContext<AppLockContextValue | null>(null);
const RELOCK_AFTER_MS = 30_000;

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reauthenticationRequired, setReauthenticationRequired] = useState(false);
  const [availability, setAvailability] = useState({ available: false, enrolled: false });
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([isAppLockEnabled(), getBiometricAvailability()]).then(
      ([storedEnabled, biometricAvailability]) => {
        if (!active) return;
        setEnabled(storedEnabled);
        setLocked(storedEnabled);
        setAvailability({
          available: biometricAvailability.available,
          enrolled: biometricAvailability.enrolled,
        });
        setLoading(false);
      },
      () => {
        if (active) setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
        return;
      }
      if (
        nextState === 'active' &&
        enabled &&
        backgroundedAt.current != null &&
        Date.now() - backgroundedAt.current >= RELOCK_AFTER_MS
      ) {
        setLocked(true);
      }
      if (nextState === 'active') backgroundedAt.current = null;
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [enabled]);

  const enable = useCallback(async () => {
    const result = await setAppLockEnabled(true);
    if (result.success) {
      setEnabled(true);
      setLocked(false);
      setReauthenticationRequired(false);
    }
    return result;
  }, []);

  const disable = useCallback(async () => {
    await setAppLockEnabled(false);
    setEnabled(false);
    setLocked(false);
    setReauthenticationRequired(false);
  }, []);

  const unlock = useCallback(async () => {
    const result = await unlockApp();
    if (result.success) {
      setLocked(false);
      setReauthenticationRequired(false);
    } else if (result.reason === 'enrollment-changed') {
      setReauthenticationRequired(true);
    }
    return result;
  }, []);

  const completePasswordReauthentication = useCallback(async () => {
    const result = await resetAppLockAfterPasswordReauthentication();
    if (result.success) {
      setLocked(false);
      setReauthenticationRequired(false);
    }
    return result;
  }, []);

  const value = useMemo<AppLockContextValue>(
    () => ({
      enabled,
      locked,
      loading,
      biometricsAvailable: availability.available,
      biometricsEnrolled: availability.enrolled,
      reauthenticationRequired,
      enable,
      disable,
      unlock,
      completePasswordReauthentication,
      lock: () => setLocked(enabled),
    }),
    [availability, completePasswordReauthentication, disable, enable, enabled, loading, locked, reauthenticationRequired, unlock],
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock(): AppLockContextValue {
  const context = useContext(AppLockContext);
  if (!context) throw new Error('useAppLock must be used inside AppLockProvider');
  return context;
}
