import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api as defaultApi, BillManagerApi } from '../../../api/client';
import {
  ActionButton,
  AuthScaffold,
  CapabilityUnavailable,
  LoadingState,
  StatusNotice,
} from '../components/AuthSurface';

export interface VerifyEmailScreenProps {
  client?: BillManagerApi;
  token: string;
  supported?: boolean;
  onComplete?: () => void;
  onRequestNewLink?: () => void;
}

export function VerifyEmailScreen({
  client = defaultApi,
  token,
  supported = true,
  onComplete,
  onRequestNewLink,
}: VerifyEmailScreenProps) {
  const { t } = useTranslation();
  const started = useRef(false);
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'success'; message: string }
    | { status: 'error'; message: string }
  >({ status: 'loading' });

  useEffect(() => {
    if (!supported || !token || started.current) return;
    started.current = true;
    let active = true;
    void client.verifyEmail(token).then((response) => {
      if (!active) return;
      if (response.success) {
        setState({
          status: 'success',
          message: response.data?.message ?? t('mobileAuth.verification.success'),
        });
      } else {
        setState({ status: 'error', message: response.error ?? t('mobileAuth.verification.invalid') });
      }
    });
    return () => {
      active = false;
    };
  }, [client, supported, token]);

  if (!supported) {
    return (
      <CapabilityUnavailable
        title={t('mobileAuth.verification.unavailableTitle')}
        message={t('mobileAuth.verification.unavailable')}
      />
    );
  }

  if (!token) {
    return (
      <AuthScaffold title={t('mobileAuth.verification.missingTitle')}>
        <StatusNotice kind="error" message={t('mobileAuth.verification.missing')} />
        {onRequestNewLink ? (
          <ActionButton label={t('mobileAuth.common.requestNewLink')} onPress={onRequestNewLink} />
        ) : null}
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold title={t('mobileAuth.verification.title')} subtitle={t('mobileAuth.verification.subtitle')}>
      {state.status === 'loading' ? <LoadingState label={t('mobileAuth.verification.verifying')} /> : null}
      {state.status === 'success' ? (
        <>
          <StatusNotice kind="success" message={state.message} />
          {onComplete ? <ActionButton label={t('mobileAuth.verification.continue')} onPress={onComplete} /> : null}
        </>
      ) : null}
      {state.status === 'error' ? (
        <>
          <StatusNotice kind="error" message={state.message} />
          {onRequestNewLink ? (
            <ActionButton label={t('mobileAuth.common.requestNewLink')} onPress={onRequestNewLink} />
          ) : null}
        </>
      ) : null}
    </AuthScaffold>
  );
}
