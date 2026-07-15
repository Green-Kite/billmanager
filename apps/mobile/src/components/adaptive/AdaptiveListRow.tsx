import React from 'react';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';

interface AdaptiveListRowProps {
  platform: AdaptivePlatform;
  title: string;
  subtitle?: string;
  leading: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  isLast?: boolean;
}

export default function AdaptiveListRow({
  platform,
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  accessibilityLabel,
  isLast = false,
}: AdaptiveListRowProps) {
  const theme = useAdaptiveTheme(platform);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: platform === 'ios' ? 62 : 68,
          paddingLeft: 14,
          paddingRight: 12,
          opacity: pressed ? 0.55 : 1,
        },
      ]}
    >
      <View style={styles.leading}>{leading}</View>
      <View
        style={[
          styles.body,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[typography.body, { color: theme.colors.text, fontWeight: '600' }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={2} style={[typography.caption, { color: theme.colors.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.trailing}>
          {trailing}
          {onPress ? <ChevronRight size={20} color={theme.colors.textMuted} strokeWidth={2.1} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  leading: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  body: {
    minWidth: 0,
    flex: 1,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copy: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
