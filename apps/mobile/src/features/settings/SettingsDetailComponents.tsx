import { Check } from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import AdaptiveSurface from '../../components/adaptive/AdaptiveSurface';
import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveLayout } from '../../design/useAdaptiveLayout';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';

export function SettingsDetailPage({
  platform,
  intro,
  children,
}: {
  platform: AdaptivePlatform;
  intro: string;
  children: React.ReactNode;
}) {
  const theme = useAdaptiveTheme(platform);
  const layout = useAdaptiveLayout();

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.page,
        {
          paddingHorizontal: layout.horizontalPadding,
          paddingBottom: 48,
        },
      ]}
    >
      <View style={[styles.content, { maxWidth: theme.contentMaxWidth }]}>
        <Text style={[typography.body, styles.intro, { color: theme.colors.textSecondary }]}>
          {intro}
        </Text>
        {children}
      </View>
    </ScrollView>
  );
}

export function SettingsSection({
  platform,
  title,
  children,
}: {
  platform: AdaptivePlatform;
  title: string;
  children: React.ReactNode;
}) {
  const theme = useAdaptiveTheme(platform);
  return (
    <View style={styles.section}>
      <Text
        accessibilityRole="header"
        style={[
          platform === 'ios' ? styles.iosSectionTitle : typography.section,
          { color: platform === 'ios' ? theme.colors.textMuted : theme.colors.text },
        ]}
      >
        {platform === 'ios' ? title.toUpperCase() : title}
      </Text>
      <AdaptiveSurface>{children}</AdaptiveSurface>
    </View>
  );
}

export function SettingsChoiceRow({
  platform,
  title,
  subtitle,
  selected,
  onPress,
  isLast = false,
}: {
  platform: AdaptivePlatform;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
}) {
  const theme = useAdaptiveTheme(platform);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title + ', ' + subtitle}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: platform === 'ios' ? 64 : 72,
          opacity: pressed ? 0.58 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.rowBody,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.copy}>
          <Text style={[typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
            {title}
          </Text>
          <Text style={[typography.caption, { color: theme.colors.textMuted }]}>
            {subtitle}
          </Text>
        </View>
        <View
          style={[
            styles.selection,
            {
              borderColor: selected ? theme.colors.primary : theme.colors.border,
              backgroundColor: selected ? theme.colors.primary : 'transparent',
            },
          ]}
        >
          {selected ? <Check size={16} color={theme.colors.onPrimary} strokeWidth={3} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function SettingsInfoRow({
  platform,
  label,
  value,
  isLast = false,
}: {
  platform: AdaptivePlatform;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const theme = useAdaptiveTheme(platform);
  return (
    <View style={[styles.row, { minHeight: platform === 'ios' ? 54 : 60 }]}>
      <View
        style={[
          styles.rowBody,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[typography.body, { color: theme.colors.text }]}>{label}</Text>
        <Text
          selectable
          numberOfLines={2}
          style={[typography.callout, styles.infoValue, { color: theme.colors.textMuted }]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export function SettingsSwitchRow({
  platform,
  title,
  subtitle,
  value,
  disabled,
  onValueChange,
}: {
  platform: AdaptivePlatform;
  title: string;
  subtitle: string;
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const theme = useAdaptiveTheme(platform);
  return (
    <View style={[styles.row, { minHeight: platform === 'ios' ? 72 : 80 }]}>
      <View style={styles.rowBody}>
        <View style={styles.copy}>
          <Text style={[typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
            {title}
          </Text>
          <Text style={[typography.caption, { color: theme.colors.textMuted }]}>
            {subtitle}
          </Text>
        </View>
        <Switch
          accessibilityLabel={title}
          accessibilityState={{ disabled, checked: value }}
          disabled={disabled}
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primary,
          }}
          thumbColor={platform === 'android' ? theme.colors.surface : undefined}
          ios_backgroundColor={theme.colors.border}
        />
      </View>
    </View>
  );
}

export function SettingsAction({
  platform,
  label,
  onPress,
  kind = 'primary',
  disabled = false,
}: {
  platform: AdaptivePlatform;
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  const theme = useAdaptiveTheme(platform);
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          minHeight: theme.minimumHitSize,
          borderRadius: platform === 'ios' ? 12 : theme.radius.pill,
          backgroundColor: primary ? theme.colors.primary : 'transparent',
          borderColor: theme.colors.primary,
          opacity: disabled ? 0.45 : pressed ? 0.68 : 1,
        },
      ]}
    >
      <Text
        style={[
          typography.callout,
          {
            color: primary ? theme.colors.onPrimary : theme.colors.primary,
            fontWeight: '700',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SettingsBulletList({
  platform,
  items,
}: {
  platform: AdaptivePlatform;
  items: readonly string[];
}) {
  const theme = useAdaptiveTheme(platform);
  return (
    <View style={styles.bulletList}>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <Text style={[typography.body, { color: theme.colors.primary }]}>•</Text>
          <Text style={[typography.callout, styles.bulletCopy, { color: theme.colors.textSecondary }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 18 },
  content: { width: '100%', alignSelf: 'center', gap: 22 },
  intro: { maxWidth: 680 },
  section: { gap: 8 },
  iosSectionTitle: {
    marginLeft: 14,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  row: { width: '100%', paddingLeft: 16, paddingRight: 14 },
  rowBody: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  copy: { minWidth: 0, flex: 1, gap: 2 },
  selection: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoValue: { minWidth: 0, flex: 1, textAlign: 'right' },
  action: {
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletList: { gap: 10, padding: 16 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  bulletCopy: { minWidth: 0, flex: 1 },
});
