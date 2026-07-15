import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import { AdaptivePlatform } from '../../design/tokens';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';
import { getFormattingConfig } from '../../i18n/format';

interface MoneyTextProps {
  platform: AdaptivePlatform;
  amount: number;
  signed?: boolean;
  tone?: 'default' | 'income' | 'expense';
  style?: StyleProp<TextStyle>;
}

export default function MoneyText({
  platform,
  amount,
  signed = false,
  tone = 'default',
  style,
}: MoneyTextProps) {
  const theme = useAdaptiveTheme(platform);
  const formatting = getFormattingConfig();
  const formatted = new Intl.NumberFormat(formatting.locale, {
    style: 'currency',
    currency: formatting.currency,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(amount);

  const color = tone === 'income'
    ? theme.colors.success
    : tone === 'expense'
      ? theme.colors.accent
      : theme.colors.text;

  return <Text style={[{ color, fontVariant: ['tabular-nums'] }, style]}>{formatted}</Text>;
}
