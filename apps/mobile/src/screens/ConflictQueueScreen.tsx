import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMobileRuntime } from '../context/MobileRuntimeContext';
import { useTheme } from '../context/ThemeContext';
import { formatDate } from '../i18n/format';
import { useTranslation } from 'react-i18next';

function entityName(value: unknown, fallback: string): string {
  if (value && typeof value === 'object' && 'name' in value && typeof value.name === 'string') return value.name;
  return fallback;
}

export default function ConflictQueueScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { conflicts, online, syncing, lastSyncedAt, error, syncNow, resolveConflict } = useMobileRuntime();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor: conflicts.length > 0 ? `${colors.warning}18` : `${colors.success}18` }]}>
            <MaterialCommunityIcons name={conflicts.length > 0 ? 'source-branch-sync' : 'cloud-check-outline'} color={conflicts.length > 0 ? colors.warning : colors.success} size={30} />
          </View>
          <View style={styles.headingCopy}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{t('mobileParity.conflicts.screenTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {online ? (syncing ? t('mobileParity.conflicts.synchronizing') : t('mobileParity.conflicts.connected')) : t('mobileParity.conflicts.offlineDetail')}
            </Text>
          </View>
        </View>

        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mobileParity.conflicts.syncA11y')}
          accessibilityState={{ disabled: syncing, busy: syncing }}
          disabled={syncing}
          onPress={() => void syncNow().catch(() => undefined)}
          style={({ pressed }) => [styles.syncButton, { backgroundColor: colors.primary, opacity: pressed || syncing ? 0.7 : 1 }]}
        >
          <MaterialCommunityIcons name="sync" color="#FFFFFF" size={21} />
          <Text style={styles.syncLabel}>{syncing ? t('mobileParity.conflicts.syncing') : t('mobileParity.conflicts.syncNow')}</Text>
        </Pressable>

        <Text style={[styles.syncMeta, { color: colors.textMuted }]}>
          {lastSyncedAt ? t('mobileParity.conflicts.lastSync', { date: formatDate(lastSyncedAt, { dateStyle: 'medium', timeStyle: 'short' }) }) : t('mobileParity.conflicts.neverSynced')}
        </Text>

        {conflicts.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="check-circle-outline" color={colors.success} size={38} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('mobileParity.conflicts.noDecisions')}</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>{t('mobileParity.conflicts.retryQueued')}</Text>
          </View>
        ) : conflicts.map((conflict) => {
          const name = entityName(conflict.local, `${conflict.entity.replace('_', ' ')} ${conflict.entityId ?? ''}`);
          return (
            <View key={conflict.mutationId} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
              <View style={styles.cardHeading}>
                <View style={styles.cardCopy}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{name}</Text>
                  <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{t('mobileParity.conflicts.changedAfterEdit', { entity: conflict.entity.replace('_', ' ') })}</Text>
                </View>
                <View style={[styles.reasonBadge, { backgroundColor: `${colors.warning}18` }]}>
                  <Text style={[styles.reasonLabel, { color: colors.warning }]}>
                    {t(conflict.reason === 'deleted' ? 'mobileParity.conflicts.reasonDeleted' : conflict.reason === 'permission_changed' ? 'mobileParity.conflicts.reasonPermission' : 'mobileParity.conflicts.reasonModified')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.serverTime, { color: colors.textSecondary }]}>{t('mobileParity.conflicts.serverUpdated', { date: formatDate(conflict.serverUpdatedAt, { dateStyle: 'medium', timeStyle: 'short' }) })}</Text>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('mobileParity.conflicts.useServerA11y', { name })}
                  onPress={() => Alert.alert(t('mobileParity.conflicts.useServerTitle'), t('mobileParity.conflicts.useServerBody'), [
                    { text: t('mobileParity.common.cancel'), style: 'cancel' },
                    { text: t('mobileParity.conflicts.useServer'), style: 'destructive', onPress: () => void resolveConflict(conflict.mutationId, 'use_server') },
                  ])}
                  style={({ pressed }) => [styles.serverButton, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
                >
                  <Text style={[styles.serverLabel, { color: colors.text }]}>{t('mobileParity.conflicts.useServer')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('mobileParity.conflicts.keepMineA11y', { name })}
                  onPress={() => void resolveConflict(conflict.mutationId, 'keep_local')}
                  style={({ pressed }) => [styles.keepButton, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 }]}
                >
                  <Text style={styles.keepLabel}>{t('mobileParity.conflicts.keepMine')}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, gap: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { minWidth: 0, flex: 1, gap: 3 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 14, lineHeight: 20 },
  syncButton: { minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  syncLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  syncMeta: { marginTop: -8, textAlign: 'center', fontSize: 12, lineHeight: 17 },
  empty: { minHeight: 240, borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 9 },
  emptyTitle: { fontSize: 19, fontWeight: '700' },
  emptyBody: { maxWidth: 360, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardCopy: { minWidth: 0, flex: 1, gap: 3 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardMeta: { fontSize: 13, lineHeight: 18 },
  reasonBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  reasonLabel: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  serverTime: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  serverButton: { minHeight: 48, flex: 1, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  serverLabel: { textAlign: 'center', fontSize: 14, fontWeight: '600' },
  keepButton: { minHeight: 48, flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  keepLabel: { color: '#FFFFFF', textAlign: 'center', fontSize: 14, fontWeight: '700' },
});
