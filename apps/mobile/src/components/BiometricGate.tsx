import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { api } from '../api/client';
import { useAppLock } from '../context/AppLockContext';
import { useAuth } from '../context/AuthContext';

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const appLock = useAppLock();
  const { loading, locked, unlock } = appLock;
  const { user, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [password, setPassword] = useState('');
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === 'dark';

  if (loading) return null;
  if (!locked) return <>{children}</>;

  const onUnlock = async () => {
    setWorking(true);
    setError(null);
    const result = await unlock();
    setWorking(false);
    if (!result.success && result.reason !== 'cancelled') {
      setError(
        result.reason === 'enrollment-changed'
          ? t('mobileSecurity.biometric.enrollmentChanged')
          : result.reason === 'not-enrolled'
          ? t('mobileSecurity.biometric.notEnrolled')
          : t('mobileSecurity.biometric.verificationFailed'),
      );
    }
  };

  const onPasswordReauthenticate = async () => {
    if (!password) {
      setError(t('mobileSecurity.biometric.passwordRequired'));
      return;
    }
    setWorking(true);
    setError(null);
    const response = await api.reauthenticate(password);
    if (!response.success) {
      setWorking(false);
      setError(response.error ?? t('mobileSecurity.biometric.passwordFailed'));
      return;
    }
    const reset = await appLock.completePasswordReauthentication();
    setWorking(false);
    setPassword('');
    if (!reset.success) setError(t('mobileSecurity.biometric.setupBiometrics'));
  };

  const onPasswordlessSignOut = async () => {
    setWorking(true);
    await appLock.disable();
    await logout();
    setWorking(false);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 32,
          backgroundColor: dark ? '#0B1411' : '#F6FAF7',
        },
      ]}
      accessibilityViewIsModal
    >
      <View style={styles.copy}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} accessibilityIgnoresInvertColors />
        <Text style={[styles.title, { color: dark ? '#F5FBF7' : '#14231D' }]}>{t('mobileSecurity.biometric.title')}</Text>
        <Text style={[styles.body, { color: dark ? '#AABAB2' : '#5B6C64' }]}>{t('mobileSecurity.biometric.subtitle')}</Text>
        {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}
        {appLock.reauthenticationRequired && user?.has_password !== false ? (
          <TextInput
            accessibilityLabel={t('mobileSecurity.biometric.passwordLabel')}
            autoCapitalize="none"
            autoComplete="current-password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={() => void onPasswordReauthenticate()}
            placeholder={t('mobileSecurity.biometric.passwordLabel')}
            placeholderTextColor={dark ? '#7F9188' : '#718179'}
            style={[styles.passwordInput, {
              color: dark ? '#F5FBF7' : '#14231D',
              backgroundColor: dark ? '#14231D' : '#FFFFFF',
              borderColor: dark ? '#33473E' : '#CAD7D0',
            }]}
          />
        ) : null}
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={appLock.reauthenticationRequired
            ? t('mobileSecurity.biometric.verifyAccountPassword')
            : t('mobileSecurity.biometric.unlockApp')}
          accessibilityState={{ disabled: working, busy: working }}
          disabled={working}
          onPress={() => void (appLock.reauthenticationRequired
            ? user?.has_password === false ? onPasswordlessSignOut() : onPasswordReauthenticate()
            : onUnlock())}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, working && styles.buttonDisabled]}
        >
          <MaterialCommunityIcons name={appLock.reauthenticationRequired ? 'shield-key-outline' : 'fingerprint'} color="#FFFFFF" size={26} />
          <Text style={styles.buttonLabel}>
            {working
              ? t('mobileSecurity.biometric.verifying')
              : appLock.reauthenticationRequired
                ? user?.has_password === false
                  ? t('mobileSecurity.biometric.signOut')
                  : t('mobileSecurity.biometric.verifyPassword')
                : t('mobileSecurity.biometric.unlock')}
          </Text>
        </Pressable>
        {appLock.reauthenticationRequired ? (
          <Text style={[styles.reauthHelp, { color: dark ? '#AABAB2' : '#5B6C64' }]}>{t('mobileSecurity.biometric.reauthHelp')}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  copy: {
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 18,
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    maxWidth: 320,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  error: {
    marginTop: 8,
    color: '#C53B34',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  passwordInput: {
    width: '100%',
    maxWidth: 360,
    minHeight: 52,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 17,
  },
  actions: {
    gap: 10,
  },
  button: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#00875A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonPressed: {
    backgroundColor: '#006E49',
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  reauthHelp: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
