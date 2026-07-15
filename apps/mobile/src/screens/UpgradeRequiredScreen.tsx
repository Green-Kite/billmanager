import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useServerProfiles } from '../context/ServerProfileContext';
import { useTheme } from '../context/ThemeContext';
import ServerProfilesScreen from './ServerProfilesScreen';
import { useTranslation } from 'react-i18next';

export default function UpgradeRequiredScreen() {
  const { t } = useTranslation();
  const { activeProfile, compatibility, verifying, verifyActiveProfile } = useServerProfiles();
  const { colors } = useTheme();
  const [showServers, setShowServers] = useState(false);
  const contractIssue = compatibility?.kind === 'mobile_contract';

  if (showServers) {
    return (
      <View style={[styles.profilePicker, { backgroundColor: colors.background }]}>
        <View style={[styles.profilePickerHeader, { borderBottomColor: colors.border }]}>
          <Pressable accessibilityRole="button" onPress={() => setShowServers(false)} hitSlop={10}>
            <Text style={[styles.profilePickerBack, { color: colors.primary }]}>{t('mobileParity.billDetail.back')}</Text>
          </Pressable>
          <Text style={[styles.profilePickerTitle, { color: colors.text }]}>{t('mobileParity.upgrade.serverConnections')}</Text>
          <View style={styles.profilePickerSpacer} />
        </View>
        <ServerProfilesScreen />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.icon, { backgroundColor: `${colors.warning}18` }]}>
        <MaterialCommunityIcons name="cellphone-arrow-down" color={colors.warning} size={42} />
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {contractIssue ? t('mobileParity.upgrade.title') : t('mobileParity.upgrade.updateTitle')}
      </Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {contractIssue
          ? t('mobileParity.upgrade.body')
          : t('mobileParity.upgrade.versionBody', {
              profile: activeProfile.displayName,
              minimum: compatibility?.minimumVersion,
              current: compatibility?.currentVersion,
            })}
      </Text>
      <Text style={[styles.detail, { color: colors.textMuted }]}>
        {contractIssue
          ? t(compatibility?.contractAction === 'update_app'
              ? 'mobileParity.upgrade.versionDetail'
              : 'mobileParity.upgrade.help')
          : t('mobileParity.upgrade.versionDetail')}
      </Text>
      {contractIssue && compatibility?.contractVersion !== null ? (
        <Text style={[styles.contractVersion, { color: colors.textMuted }]}>
          {t('mobileParity.upgrade.mobileContract')}: {compatibility?.contractVersion ?? '—'} · {t('mobileParity.upgrade.requiredContract')}: {compatibility?.supportedContractVersion}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('mobileParity.upgrade.verifyA11y')}
        accessibilityState={{ busy: verifying, disabled: verifying }}
        disabled={verifying}
        onPress={() => void verifyActiveProfile().catch(() => undefined)}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary, opacity: pressed || verifying ? 0.7 : 1 },
        ]}
      >
        <Text style={styles.buttonLabel}>{verifying ? t('mobileParity.upgrade.checking') : t('mobileParity.upgrade.verify')}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('mobileParity.upgrade.anotherServerA11y')}
        onPress={() => setShowServers(true)}
        style={({ pressed }) => [
          styles.secondaryButton,
          { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[styles.secondaryButtonLabel, { color: colors.primary }]}>{t('mobileParity.upgrade.anotherServer')}</Text>
      </Pressable>
      <Text style={[styles.serverVersion, { color: colors.textMuted }]}>
        {t('mobileParity.upgrade.server', { version: compatibility?.serverVersion })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  icon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    maxWidth: 420,
    marginTop: 14,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
  },
  detail: {
    maxWidth: 420,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    minWidth: 190,
    minHeight: 52,
    marginTop: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    minWidth: 190,
    minHeight: 52,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  serverVersion: {
    marginTop: 18,
    fontSize: 12,
  },
  contractVersion: {
    marginTop: 10,
    fontSize: 13,
    textAlign: 'center',
  },
  profilePicker: { flex: 1 },
  profilePickerHeader: {
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profilePickerBack: { minWidth: 64, fontSize: 16, fontWeight: '600' },
  profilePickerTitle: { fontSize: 17, fontWeight: '700' },
  profilePickerSpacer: { width: 64 },
});
