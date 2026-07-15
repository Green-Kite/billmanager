import React from 'react';
import { Bell, ChevronDown, Plus } from 'lucide-react-native';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveLayout } from '../../design/useAdaptiveLayout';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';

export interface AdaptiveHeaderProps {
  platform: AdaptivePlatform;
  title: string;
  groupName?: string;
  notificationCount?: number;
  onPressGroup?: () => void;
  onPressNotifications?: () => void;
  onPressAdd?: () => void;
  showBrand?: boolean;
}

export function AdaptiveHeaderShared({
  platform,
  title,
  groupName,
  notificationCount = 0,
  onPressGroup,
  onPressNotifications,
  onPressAdd,
  showBrand = false,
}: AdaptiveHeaderProps) {
  const insets = useSafeAreaInsets();
  const layout = useAdaptiveLayout();
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();
  const isAndroid = platform === 'android';
  const foreground = isAndroid ? '#FFFFFF' : theme.colors.text;
  const backgroundColor = isAndroid ? '#006B4F' : theme.colors.background;

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor,
          paddingTop: insets.top + (isAndroid ? 6 : 0),
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            maxWidth: theme.contentMaxWidth,
            paddingHorizontal: layout.horizontalPadding,
            minHeight: isAndroid ? 72 : 58,
          },
        ]}
      >
        <View style={styles.titleGroup}>
          {showBrand ? (
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              accessible
              accessibilityLabel={t('mobileCore.common.billManagerLogo')}
            />
          ) : null}
          <Text
            numberOfLines={1}
            accessibilityRole="header"
            style={[
              isAndroid ? typography.section : typography.title,
              styles.title,
              { color: foreground },
            ]}
          >
            {title}
          </Text>
        </View>

        <View style={styles.actions}>
          {groupName && onPressGroup ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('mobileCore.common.currentGroup', { group: groupName })}
              hitSlop={8}
              onPress={onPressGroup}
              style={({ pressed }) => [
                styles.groupButton,
                {
                  minHeight: theme.minimumHitSize,
                  borderColor: isAndroid ? '#79DBA9' : theme.colors.border,
                  backgroundColor: pressed
                    ? (isAndroid ? 'rgba(255,255,255,0.16)' : theme.colors.surfaceMuted)
                    : 'transparent',
                },
              ]}
            >
              <Text numberOfLines={1} style={[styles.groupText, { color: foreground }]}>
                {groupName}
              </Text>
              <ChevronDown size={20} color={foreground} strokeWidth={2.4} />
            </Pressable>
          ) : null}

          {onPressAdd && !isAndroid ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('mobileCore.common.addBill')}
              hitSlop={8}
              onPress={onPressAdd}
              style={({ pressed }) => [
                styles.iconButton,
                { minWidth: theme.minimumHitSize, minHeight: theme.minimumHitSize, opacity: pressed ? 0.55 : 1 },
              ]}
            >
              <Plus size={24} color={theme.colors.primary} strokeWidth={2.4} />
            </Pressable>
          ) : null}

          {onPressNotifications ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('mobileCore.common.reminders', { count: notificationCount })}
              hitSlop={8}
              onPress={onPressNotifications}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  minWidth: theme.minimumHitSize,
                  minHeight: theme.minimumHitSize,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Bell size={23} color={foreground} strokeWidth={2.3} />
              {notificationCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
                  <Text style={styles.badgeText}>{Math.min(notificationCount, 9)}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleGroup: {
    minWidth: 0,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  title: {
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  groupButton: {
    maxWidth: 180,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  groupText: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  iconButton: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 3,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
});
