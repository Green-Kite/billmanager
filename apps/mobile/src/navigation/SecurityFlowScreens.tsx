import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';

import { useAppLock } from '../context/AppLockContext';
import { useAuth } from '../context/AuthContext';
import { useServerProfiles } from '../context/ServerProfileContext';
import { OAuthProvidersScreen } from '../features/auth';
import {
  DeleteAccountScreen,
  DisableTwoFactorScreen,
  EmailTwoFactorSetupScreen,
  LinkedAccountsScreen,
  PasskeyManagementScreen,
  RecoveryCodesScreen,
  SecurityOverviewScreen,
  TwoFactorSettingsScreen,
} from '../features/security';
import type { SettingsStackParamList } from './types';

type Props<Route extends keyof SettingsStackParamList> = NativeStackScreenProps<SettingsStackParamList, Route>;

export function SecurityOverviewRoute({ navigation }: Props<'SecurityOverview'>) {
  const { activeProfile } = useServerProfiles();
  const { user } = useAuth();
  const appLock = useAppLock();
  return (
    <SecurityOverviewScreen
      capabilities={activeProfile.capabilities}
      isAccountOwner={Boolean(user?.is_account_owner)}
      biometricEnabled={appLock.enabled}
      onBiometricLock={() => navigation.navigate('AppSecurity')}
      onLinkedAccounts={() => navigation.navigate('LinkedAccounts')}
      onTwoFactor={() => navigation.navigate('TwoFactorSettings')}
      onDeleteAccount={() => navigation.navigate('DeleteAccount')}
    />
  );
}

export function LinkedAccountsRoute({ navigation }: Props<'LinkedAccounts'>) {
  const { activeProfile } = useServerProfiles();
  return <LinkedAccountsScreen capabilities={activeProfile.capabilities} onLinkAccount={() => navigation.navigate('OAuthLink')} />;
}

export function OAuthLinkRoute({ navigation }: Props<'OAuthLink'>) {
  const { activeProfile } = useServerProfiles();
  return (
    <OAuthProvidersScreen
      capabilities={activeProfile.capabilities}
      flow="link"
      onLinked={() => navigation.goBack()}
      onCancel={() => navigation.goBack()}
    />
  );
}

export function TwoFactorSettingsRoute({ navigation }: Props<'TwoFactorSettings'>) {
  const { activeProfile } = useServerProfiles();
  return (
    <TwoFactorSettingsScreen
      capabilities={activeProfile.capabilities}
      onSetupEmail={() => navigation.navigate('EmailTwoFactorSetup')}
      onManagePasskeys={() => navigation.navigate('PasskeyManagement')}
      onRecoveryCodes={() => navigation.navigate('RecoveryCodes')}
      onDisable={() => navigation.navigate('DisableTwoFactor')}
    />
  );
}

export function EmailTwoFactorSetupRoute() {
  const { activeProfile } = useServerProfiles();
  return <EmailTwoFactorSetupScreen capabilities={activeProfile.capabilities} onComplete={() => undefined} />;
}

export function PasskeyManagementRoute({ navigation }: Props<'PasskeyManagement'>) {
  const { activeProfile } = useServerProfiles();
  const { user } = useAuth();
  return (
    <PasskeyManagementScreen
      capabilities={activeProfile.capabilities}
      hasPassword={user?.has_password ?? true}
      onRecoveryCodes={() => navigation.navigate('RecoveryCodes')}
    />
  );
}

export function RecoveryCodesRoute() {
  return <RecoveryCodesScreen />;
}

export function DisableTwoFactorRoute({ navigation }: Props<'DisableTwoFactor'>) {
  const { user } = useAuth();
  return <DisableTwoFactorScreen hasPassword={user?.has_password ?? true} onDisabled={() => navigation.navigate('TwoFactorSettings')} />;
}

export function DeleteAccountRoute() {
  const { user, finalizeAccountDeletion } = useAuth();
  return (
    <DeleteAccountScreen
      isAccountOwner={Boolean(user?.is_account_owner)}
      hasPassword={user?.has_password ?? true}
      onDeleted={(scope) => void finalizeAccountDeletion(scope)}
    />
  );
}
