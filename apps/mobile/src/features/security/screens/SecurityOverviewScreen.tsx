import React from 'react';
import { useTranslation } from 'react-i18next';

import type { ServerCapabilities } from '../../../domain/serverProfile';
import {
  AuthScaffold,
  ListAction,
  Section,
  StatusNotice,
} from '../../auth/components/AuthSurface';

export interface SecurityOverviewScreenProps {
  capabilities: ServerCapabilities | null;
  isAccountOwner: boolean;
  biometricEnabled?: boolean;
  onBiometricLock?: () => void;
  onLinkedAccounts?: () => void;
  onTwoFactor?: () => void;
  onDeleteAccount?: () => void;
}

export function SecurityOverviewScreen({
  capabilities,
  isAccountOwner,
  biometricEnabled = false,
  onBiometricLock,
  onLinkedAccounts,
  onTwoFactor,
  onDeleteAccount,
}: SecurityOverviewScreenProps) {
  const { t } = useTranslation();
  const oauthAvailable = (capabilities?.oauthProviders.length ?? 0) > 0;
  const twoFactorAvailable = Boolean(capabilities?.emailOtp || capabilities?.passkeys);

  return (
    <AuthScaffold
      title={t('mobileSecurity.overview.title')}
      subtitle={t('mobileSecurity.overview.subtitle')}
      testID="security-overview-screen"
    >
      <Section title={t('mobileSecurity.overview.device')}>
        {onBiometricLock ? (
          <ListAction
            title={t('mobileSecurity.overview.biometric')}
            detail={biometricEnabled ? t('mobileSecurity.common.on') : t('mobileSecurity.common.off')}
            onPress={onBiometricLock}
          />
        ) : (
          <StatusNotice kind="info" message={t('mobileSecurity.overview.biometricManaged')} />
        )}
      </Section>
      <Section title={t('mobileSecurity.overview.signIn')}>
        {onTwoFactor ? (
          <ListAction
            title={t('mobileSecurity.overview.twoFactor')}
            detail={twoFactorAvailable ? t('mobileSecurity.overview.methods') : t('mobileSecurity.overview.serverDisabled')}
            disabled={!twoFactorAvailable}
            onPress={onTwoFactor}
          />
        ) : null}
        {onLinkedAccounts ? (
          <ListAction
            title={t('mobileSecurity.overview.linkedAccounts')}
            detail={oauthAvailable ? t('mobileSecurity.overview.providers') : t('mobileSecurity.overview.noProviders')}
            disabled={!oauthAvailable}
            onPress={onLinkedAccounts}
          />
        ) : null}
      </Section>
      {isAccountOwner && onDeleteAccount ? (
        <Section
          title={t('mobileSecurity.overview.accountData')}
          description={t('mobileSecurity.overview.accountDataDescription')}
        >
          <ListAction title={t('mobileSecurity.overview.deleteAccount')} destructive onPress={onDeleteAccount} />
        </Section>
      ) : null}
    </AuthScaffold>
  );
}
