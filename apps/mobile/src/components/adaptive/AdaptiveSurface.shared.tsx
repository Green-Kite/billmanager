import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AdaptivePlatform } from '../../design/tokens';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';

export interface AdaptiveSurfaceProps {
  children: React.ReactNode;
  platform: AdaptivePlatform;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function AdaptiveSurfaceShared({
  children,
  platform,
  style,
  accessibilityLabel,
}: AdaptiveSurfaceProps) {
  const theme = useAdaptiveTheme(platform);

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.medium,
        },
        platform === 'android' ? styles.android : styles.ios,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  android: {
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  ios: {
    shadowColor: 'transparent',
  },
});
