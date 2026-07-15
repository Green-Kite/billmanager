import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { api as defaultApi, BillManagerApi } from '../../../api/client';
import type { AuthSessionScope } from '../../auth';
import {
  ActionButton,
  AuthScaffold,
  CapabilityUnavailable,
  FormField,
  StatusNotice,
} from '../../auth/components/AuthSurface';

const deleteAccountSchema = z.object({
  confirmationPhrase: z.literal('DELETE', { message: 'Type DELETE exactly' }),
  password: z.string(),
});

export interface DeleteAccountScreenProps {
  client?: BillManagerApi;
  isAccountOwner: boolean;
  hasPassword: boolean;
  onDeleted?: (scope: AuthSessionScope) => void;
}

export function DeleteAccountScreen({
  client = defaultApi,
  isAccountOwner,
  hasPassword,
  onDeleted,
}: DeleteAccountScreenProps) {
  const { t } = useTranslation();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ confirmationPhrase: string; password: string }>({
    defaultValues: { confirmationPhrase: '', password: '' },
  });

  if (!isAccountOwner) {
    return (
      <CapabilityUnavailable
        title={t('mobileSecurity.deleteAccount.title')}
        message={t('mobileSecurity.deleteAccount.unavailable')}
      />
    );
  }

  const submit = form.handleSubmit((values) => {
    const parsed = deleteAccountSchema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === 'confirmationPhrase' || field === 'password') {
          form.setError(field, {
            message: field === 'confirmationPhrase'
              ? t('mobileSecurity.deleteAccount.typeDeleteError')
              : issue.message,
          });
        }
      });
      return;
    }
    if (hasPassword && !parsed.data.password) {
      form.setError('password', { message: t('mobileSecurity.deleteAccount.passwordRequired') });
      return;
    }
    Alert.alert(
      t('mobileSecurity.deleteAccount.confirmTitle'),
      t('mobileSecurity.deleteAccount.confirmWarning'),
      [
        { text: t('mobileSecurity.common.cancel'), style: 'cancel' },
        {
          text: t('mobileSecurity.deleteAccount.deletePermanently'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setWorking(true);
              setError(null);
              const response = await client.deleteAccount(
                hasPassword ? { password: parsed.data.password } : { confirm: true },
              );
              setWorking(false);
              if (!response.success) {
                setError(response.error ?? t('mobileSecurity.deleteAccount.failed'));
                return;
              }
              onDeleted?.(response.scope);
            })();
          },
        },
      ],
    );
  });

  return (
    <AuthScaffold
      title={t('mobileSecurity.deleteAccount.title')}
      subtitle={t('mobileSecurity.deleteAccount.subtitle')}
      testID="security-delete-account-screen"
    >
      <StatusNotice
        kind="error"
        title={t('mobileSecurity.deleteAccount.irreversibleTitle')}
        message={t('mobileSecurity.deleteAccount.irreversible')}
      />
      {error ? <StatusNotice kind="error" message={error} /> : null}
      <Controller
        control={form.control}
        name="confirmationPhrase"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField
            label={t('mobileSecurity.deleteAccount.typeDelete')}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={form.formState.errors.confirmationPhrase?.message}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        )}
      />
      {hasPassword ? (
        <Controller
          control={form.control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField
              label={t('mobileSecurity.common.password')}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={form.formState.errors.password?.message}
              secureTextEntry
              autoComplete="current-password"
            />
          )}
        />
      ) : null}
      <ActionButton label={t('mobileSecurity.deleteAccount.action')} variant="danger" loading={working} onPress={submit} />
    </AuthScaffold>
  );
}
