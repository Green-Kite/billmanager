import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useServerProfiles } from '../context/ServerProfileContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function ServerProfilesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    profiles,
    activeProfile,
    verifying,
    error,
    addProfile,
    switchProfile,
    verifyActiveProfile,
  } = useServerProfiles();
  const [showAdd, setShowAdd] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const saveProfile = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await addProfile({ displayName, baseUrl });
      setShowAdd(false);
      setDisplayName('');
      setBaseUrl('https://');
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : t('mobileParity.profiles.verifyFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{t('mobileParity.profiles.serversTitle')}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{t('mobileParity.profiles.subtitle')}</Text>
        </View>

        {error ? (
          <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: `${colors.warning}18` }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.warning} />
            <Text style={[styles.bannerText, { color: colors.text }]}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {profiles.map((profile, index) => {
            const selected = profile.id === activeProfile.id;
            return (
              <Pressable
                key={profile.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t('mobileParity.profiles.deploymentA11y', { name: profile.displayName, mode: t(profile.deploymentMode === 'saas' ? 'mobileSettings.home.cloud' : profile.deploymentMode === 'development' ? 'mobileSettings.home.development' : 'mobileSettings.home.selfHosted') })}
                onPress={() => {
                  if (!selected) {
                    Alert.alert(t('mobileParity.profiles.switchTitle'), t('mobileParity.profiles.switchBody'), [
                      { text: t('mobileParity.common.cancel'), style: 'cancel' },
                      { text: t('mobileParity.profiles.switch'), onPress: () => void switchProfile(profile.id) },
                    ]);
                  }
                }}
                style={({ pressed }) => [
                  styles.profileRow,
                  index < profiles.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  pressed && { opacity: 0.62 },
                ]}
              >
                <View style={[styles.serverIcon, { backgroundColor: selected ? `${colors.primary}18` : colors.card }]}>
                  <MaterialCommunityIcons name={profile.deploymentMode === 'saas' ? 'cloud-outline' : 'server'} color={selected ? colors.primary : colors.textMuted} size={24} />
                </View>
                <View style={styles.profileCopy}>
                  <Text style={[styles.profileName, { color: colors.text }]}>{profile.displayName}</Text>
                  <Text numberOfLines={1} style={[styles.profileUrl, { color: colors.textMuted }]}>{profile.baseUrl}</Text>
                  <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>
                    {profile.lastVerifiedAt ? t('mobileParity.profiles.verifiedServer', { version: profile.capabilities?.serverVersion ?? t('mobileParity.common.unknown') }) : t('mobileParity.profiles.verificationRequired')}
                  </Text>
                </View>
                {selected ? <MaterialCommunityIcons name="check-circle" color={colors.primary} size={24} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: verifying, disabled: verifying }}
          disabled={verifying}
          onPress={() => void verifyActiveProfile().catch(() => undefined)}
          style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.primary, opacity: pressed || verifying ? 0.65 : 1 }]}
        >
          {verifying ? <ActivityIndicator color={colors.primary} /> : <MaterialCommunityIcons name="shield-check-outline" color={colors.primary} size={21} />}
          <Text style={[styles.secondaryLabel, { color: colors.primary }]}>{verifying ? t('mobileParity.profiles.verifying') : t('mobileParity.profiles.verifyActive')}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mobileParity.profiles.add')}
          onPress={() => setShowAdd(true)}
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          <MaterialCommunityIcons name="plus" color="#FFFFFF" size={22} />
          <Text style={styles.primaryLabel}>{t('mobileParity.profiles.addTitle')}</Text>
        </Pressable>

        <Text style={[styles.footnote, { color: colors.textMuted }]}>{t('mobileParity.profiles.httpsNotice')} {t('mobileParity.profiles.developmentNotice')}</Text>
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable accessibilityRole="button" onPress={() => setShowAdd(false)} hitSlop={10}>
              <Text style={[styles.headerAction, { color: colors.primary }]}>{t('mobileParity.common.cancel')}</Text>
            </Pressable>
            <Text accessibilityRole="header" style={[styles.modalTitle, { color: colors.text }]}>{t('mobileParity.profiles.addTitle')}</Text>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving, busy: saving }} disabled={saving} onPress={() => void saveProfile()} hitSlop={10}>
              <Text style={[styles.headerAction, { color: colors.primary, opacity: saving ? 0.5 : 1 }]}>{saving ? t('mobileParity.profiles.checking') : t('mobileParity.profiles.addShort')}</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('mobileParity.profiles.displayName')}</Text>
            <TextInput
              accessibilityLabel={t('mobileParity.profiles.displayNameA11y')}
              autoCapitalize="words"
              placeholder={t('mobileParity.profiles.displayNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('mobileParity.profiles.url')}</Text>
            <TextInput
              accessibilityLabel={t('mobileParity.profiles.urlA11y')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://bills.example.com"
              placeholderTextColor={colors.textMuted}
              value={baseUrl}
              onChangeText={setBaseUrl}
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            />
            {formError ? <Text accessibilityRole="alert" style={[styles.formError, { color: colors.danger }]}>{formError}</Text> : null}
            <Text style={[styles.footnote, { color: colors.textMuted }]}>{t('mobileParity.profiles.validationNotice')}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 16 },
  intro: { gap: 6, marginBottom: 4 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23 },
  banner: { padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bannerText: { minWidth: 0, flex: 1, fontSize: 14, lineHeight: 20 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, overflow: 'hidden' },
  profileRow: { minHeight: 90, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  serverIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  profileCopy: { minWidth: 0, flex: 1, gap: 2 },
  profileName: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  profileUrl: { fontSize: 13, lineHeight: 18 },
  profileMeta: { fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 54, borderRadius: 17, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: { minHeight: 52, borderWidth: 1, borderRadius: 17, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryLabel: { fontSize: 16, fontWeight: '700' },
  footnote: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  modal: { flex: 1 },
  modalHeader: { minHeight: 58, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  headerAction: { minWidth: 58, fontSize: 16, fontWeight: '600' },
  form: { padding: 20, gap: 10 },
  label: { marginTop: 8, fontSize: 13, fontWeight: '600' },
  input: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14, fontSize: 16 },
  formError: { fontSize: 14, lineHeight: 20 },
});
