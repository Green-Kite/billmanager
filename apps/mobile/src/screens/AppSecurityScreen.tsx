import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useAppLock } from '../context/AppLockContext';
import { useServerProfiles } from '../context/ServerProfileContext';
import { useMobileRuntime } from '../context/MobileRuntimeContext';
import { useTheme } from '../context/ThemeContext';
import { requestLocalNotificationPermission } from '../native/localNotifications';
import { useTranslation } from 'react-i18next';

export default function AppSecurityScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { activeProfile } = useServerProfiles();
  const appLock = useAppLock();
  const runtime = useMobileRuntime();
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const toggleLock = async (enabled: boolean) => {
    if (enabled) {
      const result = await appLock.enable();
      if (!result.success && result.reason !== 'cancelled') {
        Alert.alert(t('mobileParity.deviceSecurity.unavailableTitle'), t('mobileParity.deviceSecurity.unavailableBody'));
      }
    } else {
      await appLock.disable();
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{t('mobileParity.deviceSecurity.screenTitle')}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{t('mobileParity.deviceSecurity.screenIntro')}</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}>
              <MaterialCommunityIcons name="fingerprint" color={colors.primary} size={25} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{t('mobileParity.deviceSecurity.biometricLock')}</Text>
              <Text style={[styles.rowBody, { color: colors.textMuted }]}>{t('mobileParity.deviceSecurity.biometricBackground')}</Text>
            </View>
            <Switch
              accessibilityLabel={t('mobileParity.deviceSecurity.biometricLock')}
              value={appLock.enabled}
              disabled={appLock.loading}
              onValueChange={(value) => void toggleLock(value)}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable
            accessibilityRole="button"
            onPress={() => void requestLocalNotificationPermission().then((granted) => setNotificationStatus(granted ? 'granted' : 'denied'))}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.62 }]}
          >
            <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}>
              <MaterialCommunityIcons name="bell-check-outline" color={colors.primary} size={24} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{t('mobileParity.deviceSecurity.reminderPermission')}</Text>
              <Text style={[styles.rowBody, { color: colors.textMuted }]}>
                {notificationStatus === 'granted' ? t('mobileParity.deviceSecurity.reminderAllowed') : notificationStatus === 'denied' ? t('mobileParity.deviceSecurity.reminderDenied') : t('mobileParity.deviceSecurity.reminderReview')}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" color={colors.textMuted} size={23} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}>
              <MaterialCommunityIcons name="widgets-outline" color={colors.primary} size={24} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{t('mobileParity.deviceSecurity.widgetAmounts')}</Text>
              <Text style={[styles.rowBody, { color: colors.textMuted }]}>{t('mobileParity.deviceSecurity.widgetDetail')}</Text>
            </View>
            <Switch
              accessibilityLabel={t('mobileParity.deviceSecurity.widgetAmountsA11y')}
              value={runtime.widgetAmountsVisible}
              onValueChange={(value) => void runtime.setWidgetAmountsVisible(value)}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </View>

        <View style={[styles.info, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="database-lock-outline" color={colors.primary} size={23} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t('mobileParity.deviceSecurity.encryptedStorage')}</Text>
        </View>

        <View style={[styles.info, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name={activeProfile.capabilities?.passkeys ? 'key-variant' : 'key-remove'} color={activeProfile.capabilities?.passkeys ? colors.primary : colors.textMuted} size={23} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {activeProfile.capabilities?.passkeys ? t('mobileParity.deviceSecurity.passkeysSupported') : t('mobileParity.deviceSecurity.passkeysUnsupported')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 16 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, overflow: 'hidden' },
  row: { minHeight: 84, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { minWidth: 0, flex: 1, gap: 3 },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  rowBody: { fontSize: 13, lineHeight: 18 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 70 },
  info: { padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoText: { minWidth: 0, flex: 1, fontSize: 14, lineHeight: 21 },
});
