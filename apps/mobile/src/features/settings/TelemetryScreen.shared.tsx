import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';
import {
  resolveTelemetryStatus,
  type TelemetryNoticeState,
} from './settingsModel';
import {
  SettingsAction,
  SettingsBulletList,
  SettingsDetailPage,
  SettingsSection,
  SettingsSwitchRow,
} from './SettingsDetailComponents';

export function TelemetryScreenView({ platform }: { platform: AdaptivePlatform }) {
  const { t } = useTranslation();
  const theme = useAdaptiveTheme(platform);
  const { user } = useAuth();
  const [notice, setNotice] = useState<TelemetryNoticeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isOwner = Boolean(user?.is_account_owner);
  const status = resolveTelemetryStatus(notice, isOwner);
  const serverDisabled = notice?.telemetry_enabled === false;

  const loadPreference = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getTelemetryNotice();
      if (!response.success || !response.data) {
        throw new Error(response.error || t('mobileSettings.telemetry.error'));
      }
      setNotice(response.data);
    } catch (reason) {
      setNotice(null);
      setError(reason instanceof Error ? reason.message : t('mobileSettings.telemetry.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPreference();
  }, [loadPreference]);

  const updatePreference = async (enabled: boolean) => {
    if (!isOwner || saving || serverDisabled) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = enabled
        ? await api.acceptTelemetry()
        : await api.optOutTelemetry();
      if (!response.success) {
        throw new Error(response.error || t('mobileSettings.telemetry.error'));
      }
      setNotice({
        show_notice: false,
        opted_out: !enabled,
        telemetry_enabled: true,
      });
      setMessage(t('mobileSettings.telemetry.saved'));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('mobileSettings.telemetry.error'));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const statusCopy = useMemo(() => {
    if (serverDisabled) {
      return {
        title: t('mobileSettings.telemetry.disabled'),
        detail: t('mobileSettings.telemetry.globallyDisabled'),
      };
    }
    return {
      title: t('mobileSettings.telemetry.' + status),
      detail: t('mobileSettings.telemetry.' + status + 'Detail'),
    };
  }, [serverDisabled, status, t]);

  const switchValue = status === 'enabled'
    || (status === 'undecided' && notice?.telemetry_enabled !== false);
  const switchDisabled = loading
    || saving
    || !isOwner
    || status === 'unavailable'
    || serverDisabled;
  const collected = t('mobileSettings.telemetry.collected', {
    returnObjects: true,
  }) as unknown as readonly string[];
  const never = t('mobileSettings.telemetry.never', {
    returnObjects: true,
  }) as unknown as readonly string[];

  return (
    <SettingsDetailPage platform={platform} intro={t('mobileSettings.telemetry.intro')}>
      <SettingsSection platform={platform} title={t('mobileSettings.telemetry.preference')}>
        {loading ? (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={t('common.loading')}
            style={styles.loading}
          >
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <SettingsSwitchRow
            platform={platform}
            title={statusCopy.title}
            subtitle={statusCopy.detail}
            value={switchValue}
            disabled={switchDisabled}
            onValueChange={(value) => void updatePreference(value)}
          />
        )}
      </SettingsSection>

      {status === 'undecided' && !loading ? (
        <View style={styles.actions}>
          <SettingsAction
            platform={platform}
            label={t('mobileSettings.telemetry.keepEnabled')}
            disabled={saving}
            onPress={() => void updatePreference(true)}
          />
          <SettingsAction
            platform={platform}
            kind="secondary"
            label={t('mobileSettings.telemetry.optOut')}
            disabled={saving}
            onPress={() => void updatePreference(false)}
          />
        </View>
      ) : null}

      {error ? (
        <View
          accessibilityRole="alert"
          style={[styles.banner, { backgroundColor: theme.colors.accentContainer }]}
        >
          <Text style={[typography.callout, { color: theme.colors.text }]}>{error}</Text>
          <SettingsAction
            platform={platform}
            kind="secondary"
            label={t('mobileSettings.telemetry.retry')}
            onPress={() => void loadPreference()}
          />
        </View>
      ) : null}
      {message ? (
        <Text accessibilityRole="alert" style={[typography.callout, { color: theme.colors.success }]}>
          {message}
        </Text>
      ) : null}

      <SettingsSection platform={platform} title={t('mobileSettings.telemetry.collectedTitle')}>
        <SettingsBulletList platform={platform} items={collected} />
      </SettingsSection>
      <SettingsSection platform={platform} title={t('mobileSettings.telemetry.neverTitle')}>
        <SettingsBulletList platform={platform} items={never} />
      </SettingsSection>
      <SettingsAction
        platform={platform}
        kind="secondary"
        label={t('mobileSettings.telemetry.documentation')}
        onPress={() => void Linking.openURL(
          'https://github.com/brdweb/billmanager/blob/main/TELEMETRY.md',
        )}
      />
    </SettingsDetailPage>
  );
}

const styles = StyleSheet.create({
  loading: { minHeight: 80, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: 10 },
  banner: { padding: 14, borderRadius: 14, gap: 12 },
});
