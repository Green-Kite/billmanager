import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';

interface SectionHeaderProps {
  platform: AdaptivePlatform;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({
  platform,
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const theme = useAdaptiveTheme(platform);

  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={[typography.section, { color: theme.colors.text }]}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            { minHeight: theme.minimumHitSize, opacity: pressed ? 0.55 : 1 },
          ]}
        >
          <Text style={[typography.callout, { color: theme.colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  action: {
    justifyContent: 'center',
  },
});
