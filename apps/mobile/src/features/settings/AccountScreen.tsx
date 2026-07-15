import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { api } from '../../api/client';
import AdaptiveSurface from '../../components/adaptive/AdaptiveSurface';
import { useAuth } from '../../context/AuthContext';
import { typography } from '../../design/tokens';
import { useAdaptiveLayout } from '../../design/useAdaptiveLayout';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';

export default function AccountScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const theme = useAdaptiveTheme();
  const layout = useAdaptiveLayout();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);

  const submitPassword = async () => {
    if (!currentPassword || !newPassword || !confirmation) {
      Alert.alert(t('mobileSettings.account.incompleteTitle'), t('mobileSettings.account.incompleteBody'));
      return;
    }
    if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      Alert.alert(t('mobileSettings.account.passwordRequirementsTitle'), t('mobileSettings.account.passwordRequirements'));
      return;
    }
    if (newPassword !== confirmation) {
      Alert.alert(t('mobileSettings.account.passwordMismatchTitle'), t('mobileSettings.account.passwordMismatch'));
      return;
    }

    setSaving(true);
    const response = await api.changePassword(currentPassword, newPassword);
    setSaving(false);
    if (!response.success) {
      Alert.alert(t('mobileSettings.account.changeFailed'), response.error ?? t('mobileSettings.account.tryAgain'));
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    Alert.alert(t('mobileSettings.account.changedTitle'), t('mobileSettings.account.changedBody'));
  };

  const confirmLogout = () => Alert.alert(
    t('mobileSettings.home.logOutTitle'),
    t('mobileSettings.home.logOutBody'),
    [
      { text: t('mobileSettings.home.cancel'), style: 'cancel' },
      { text: t('mobileSettings.home.logOut'), style: 'destructive', onPress: () => void logout() },
    ],
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, {
        paddingHorizontal: layout.horizontalPadding,
        maxWidth: theme.contentMaxWidth,
      }]}
    >
      <AdaptiveSurface style={styles.profileCard}>
        <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{t('mobileSettings.account.username')}</Text>
        <Text style={[typography.headline, { color: theme.colors.text }]}>{user?.username ?? '—'}</Text>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{t('mobileSettings.account.email')}</Text>
        <Text style={[typography.body, { color: theme.colors.text }]}>{user?.email ?? '—'}</Text>
        <Text style={[typography.caption, styles.role, { color: theme.colors.textMuted }]}>
          {user?.role === 'admin' ? t('mobileSettings.home.administrator') : t('mobileSettings.home.member')}
        </Text>
      </AdaptiveSurface>

      {user?.has_password === false ? (
        <AdaptiveSurface style={styles.formCard}>
          <Text style={[typography.section, { color: theme.colors.text }]}>{t('mobileSettings.account.linkedSignInTitle')}</Text>
          <Text style={[typography.body, { color: theme.colors.textMuted }]}>{t('mobileSettings.account.linkedSignInBody')}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('LinkedAccounts')}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.colors.primary, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>{t('mobileSettings.home.linkedAccounts')}</Text>
          </Pressable>
        </AdaptiveSurface>
      ) : (
        <AdaptiveSurface style={styles.formCard}>
          <Text style={[typography.section, { color: theme.colors.text }]}>{t('mobileSettings.account.changePassword')}</Text>
          <Text style={[typography.body, { color: theme.colors.textMuted }]}>{t('mobileSettings.account.passwordRequirements')}</Text>
          {[
            [t('mobileSettings.account.currentPassword'), currentPassword, setCurrentPassword],
            [t('mobileSettings.account.newPassword'), newPassword, setNewPassword],
            [t('mobileSettings.account.confirmPassword'), confirmation, setConfirmation],
          ].map(([label, value, setter]) => (
            <View key={label as string} style={styles.field}>
              <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{label as string}</Text>
              <TextInput
                accessibilityLabel={label as string}
                value={value as string}
                onChangeText={setter as (value: string) => void}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={label === t('mobileSettings.account.currentPassword') ? 'current-password' : 'new-password'}
                style={[styles.input, {
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                }]}
              />
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: saving, busy: saving }}
            disabled={saving}
            onPress={() => void submitPassword()}
            style={({ pressed }) => [styles.primaryButton, {
              backgroundColor: theme.colors.primary,
              opacity: saving ? 0.55 : pressed ? 0.7 : 1,
            }]}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
              {saving ? t('mobileSettings.account.saving') : t('mobileSettings.account.changePassword')}
            </Text>
          </Pressable>
        </AdaptiveSurface>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={confirmLogout}
        style={({ pressed }) => [styles.logoutButton, {
          borderColor: theme.colors.danger,
          opacity: pressed ? 0.65 : 1,
        }]}
      >
        <Text style={[styles.logoutText, { color: theme.colors.danger }]}>{t('mobileSettings.home.logOut')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', alignSelf: 'center', paddingTop: 20, paddingBottom: 44, gap: 18 },
  profileCard: { padding: 20, gap: 6 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 10 },
  role: { marginTop: 8 },
  formCard: { padding: 20, gap: 14 },
  field: { gap: 7 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 17 },
  primaryButton: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonText: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
  logoutButton: { minHeight: 50, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
});
