import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api as defaultApi, BillManagerApi } from '../../../api/client';
import type { ServerCapabilities } from '../../../domain/serverProfile';
import {
  ActionButton,
  AuthScaffold,
  CapabilityUnavailable,
  ListAction,
  LoadingState,
  Section,
  StatusNotice,
} from '../../auth/components/AuthSurface';
import type { TwoFactorStatus } from '../types';

export interface TwoFactorSettingsScreenProps {
  client?: BillManagerApi;
  capabilities?: ServerCapabilities | null;
  onSetupEmail?: () => void;
  onManagePasskeys?: () => void;
  onRecoveryCodes?: () => void;
  onDisable?: () => void;
}

export function TwoFactorSettingsScreen({
  client = defaultApi,
  capabilities: override,
  onSetupEmail,
  onManagePasskeys,
  onRecoveryCodes,
  onDisable,
}: TwoFactorSettingsScreenProps) {
  const { t } = useTranslation();
  const capabilities = override === undefined ? client.getActiveProfile().capabilities : override;
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supported = Boolean(capabilities?.emailOtp || capabilities?.passkeys);
  const load = async () => {
    setLoading(true);
    const response = await client.getTwoFactorStatus();
    setLoading(false);
    if (response.success && response.data) {
      setStatus(response.data);
      setError(null);
    } else {
      setError(response.error ?? t('mobileSecurity.twoFactorSettings.loadFailed'));
    }
  };

  useEffect(() => {
    if (supported) void load();
  }, [supported]);

  if (!supported) {
    return (
      <CapabilityUnavailable
        title={t('mobileSecurity.twoFactorSettings.title')}
        message={t('mobileSecurity.twoFactorSettings.unavailable')}
      />
    );
  }

  return (
    <AuthScaffold
      title={t('mobileSecurity.twoFactorSettings.title')}
      subtitle={status?.enabled
        ? t('mobileSecurity.twoFactorSettings.enabledSubtitle')
        : t('mobileSecurity.twoFactorSettings.disabledSubtitle')}
      testID="security-two-factor-settings-screen"
    >
      {loading ? <LoadingState label={t('mobileSecurity.twoFactorSettings.loading')} /> : null}
      {error ? <StatusNotice kind="error" message={error} /> : null}
      {status ? (
        <>
          <StatusNotice
            kind={status.enabled ? 'success' : 'info'}
            message={status.enabled
              ? t('mobileSecurity.twoFactorSettings.enabledNotice')
              : t('mobileSecurity.twoFactorSettings.disabledNotice')}
          />
          <Section title={t('mobileSecurity.twoFactorSettings.methods')}>
            {capabilities?.emailOtp && onSetupEmail ? (
              <ListAction
                title={t('mobileSecurity.twoFactorSettings.emailCodes')}
                detail={status.email_otp_enabled ? t('mobileSecurity.common.enabled') : t('mobileSecurity.common.notEnabled')}
                onPress={onSetupEmail}
              />
            ) : null}
            {capabilities?.passkeys && onManagePasskeys ? (
              <ListAction
                title={t('mobileSecurity.twoFactorSettings.passkeys')}
                detail={status.passkey_enabled
                  ? t('mobileSecurity.twoFactorSettings.registered', { count: status.passkeys.length })
                  : t('mobileSecurity.common.notEnabled')}
                onPress={onManagePasskeys}
              />
            ) : null}
            {status.enabled && onRecoveryCodes ? (
              <ListAction
                title={t('mobileSecurity.twoFactorSettings.recoveryCodes')}
                detail={status.has_recovery_codes
                  ? t('mobileSecurity.twoFactorSettings.available')
                  : t('mobileSecurity.twoFactorSettings.generate')}
                onPress={onRecoveryCodes}
              />
            ) : null}
          </Section>
          {status.enabled && onDisable ? (
            <Section title={t('mobileSecurity.twoFactorSettings.turnOff')}>
              <ListAction title={t('mobileSecurity.twoFactorSettings.disableAll')} destructive onPress={onDisable} />
            </Section>
          ) : null}
        </>
      ) : null}
      <ActionButton label={t('mobileSecurity.common.refresh')} variant="plain" loading={loading} onPress={() => void load()} />
    </AuthScaffold>
  );
}
