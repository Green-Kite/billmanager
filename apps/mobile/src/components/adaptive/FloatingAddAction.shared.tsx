import React from 'react';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AdaptivePlatform } from '../../design/tokens';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';

interface FloatingAddActionSharedProps {
  platform: AdaptivePlatform;
  onPress: () => void;
  label?: string;
}

export function FloatingAddActionShared({
  platform,
  onPress,
  label,
}: FloatingAddActionSharedProps) {
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();

  if (platform === 'ios') return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? t('mobileCore.common.addBill')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.primary,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <Plus size={30} color={theme.colors.onPrimary} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
