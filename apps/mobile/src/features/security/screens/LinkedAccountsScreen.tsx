import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { api as defaultApi, BillManagerApi } from '../../../api/client';
import type { ServerCapabilities } from '../../../domain/serverProfile';
import type { OAuthAccount } from '../../auth/types';
import {
  ActionButton,
  AuthScaffold,
  CapabilityUnavailable,
  ListAction,
  LoadingState,
  Section,
  StatusNotice,
} from '../../auth/components/AuthSurface';

export interface LinkedAccountsScreenProps {
  client?: BillManagerApi;
  capabilities?: ServerCapabilities | null;
  onLinkAccount?: () => void;
}

export function LinkedAccountsScreen({
  client = defaultApi,
  capabilities: override,
  onLinkAccount,
}: LinkedAccountsScreenProps) {
  const { t } = useTranslation();
  const capabilities = override === undefined ? client.getActiveProfile().capabilities : override;
  const [accounts, setAccounts] = useState<OAuthAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const response = await client.getLinkedAccounts();
    setLoading(false);
    if (response.success && response.data) {
      setAccounts(response.data);
      setNotice(null);
    } else {
      setNotice({ kind: 'error', message: response.error ?? t('mobileSecurity.linked.loadFailed') });
    }
  };

  useEffect(() => {
    if ((capabilities?.oauthProviders.length ?? 0) === 0) return;
    void load();
  }, [capabilities?.oauthProviders.length]);

  if ((capabilities?.oauthProviders.length ?? 0) === 0) {
    return (
      <CapabilityUnavailable
        title={t('mobileSecurity.linked.title')}
        message={t('mobileSecurity.linked.unavailable')}
      />
    );
  }

  const unlink = (account: OAuthAccount) => {
    Alert.alert(
      t('mobileSecurity.linked.unlinkTitle', { provider: account.provider }),
      t('mobileSecurity.linked.unlinkWarning'),
      [
        { text: t('mobileSecurity.common.cancel'), style: 'cancel' },
        {
          text: t('mobileSecurity.linked.unlink'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyProvider(account.provider);
              const response = await client.unlinkOAuthAccount(account.provider);
              setBusyProvider(null);
              if (!response.success) {
                setNotice({ kind: 'error', message: response.error ?? t('mobileSecurity.linked.unlinkFailed') });
                return;
              }
              setAccounts((current) => current.filter((item) => item.id !== account.id));
              setNotice({
                kind: 'success',
                message: response.data?.message ?? t('mobileSecurity.linked.unlinked', { provider: account.provider }),
              });
            })();
          },
        },
      ],
    );
  };

  return (
    <AuthScaffold
      title={t('mobileSecurity.linked.title')}
      subtitle={t('mobileSecurity.linked.subtitle')}
      testID="security-linked-accounts-screen"
    >
      {loading ? <LoadingState label={t('mobileSecurity.linked.loading')} /> : null}
      {notice ? <StatusNotice kind={notice.kind} message={notice.message} /> : null}
      {!loading ? (
        <Section title={t('mobileSecurity.linked.connected')}>
          {accounts.length === 0 ? (
            <StatusNotice kind="info" message={t('mobileSecurity.linked.empty')} />
          ) : accounts.map((account) => (
            <ListAction
              key={account.id}
              title={account.provider}
              detail={account.provider_email ?? t('mobileSecurity.linked.emailMissing')}
              destructive
              disabled={busyProvider !== null}
              onPress={() => unlink(account)}
            />
          ))}
        </Section>
      ) : null}
      {onLinkAccount ? (
        <ActionButton label={t('mobileSecurity.linked.add')} onPress={onLinkAccount} disabled={busyProvider !== null} />
      ) : null}
      <ActionButton label={t('mobileSecurity.common.refresh')} variant="plain" loading={loading} onPress={() => void load()} />
    </AuthScaffold>
  );
}
