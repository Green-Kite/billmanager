import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  platform: AdaptivePlatform;
  label: string;
  options: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SegmentedControl<T extends string>({
  platform,
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useAdaptiveTheme(platform);

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[
        styles.container,
        {
          backgroundColor: platform === 'ios' ? theme.colors.border : theme.colors.surfaceMuted,
          borderRadius: platform === 'ios' ? 9 : theme.radius.pill,
          padding: platform === 'ios' ? 2 : 4,
        },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              {
                minHeight: theme.minimumHitSize - 8,
                borderRadius: platform === 'ios' ? 7 : theme.radius.pill,
                backgroundColor: selected ? theme.colors.surface : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
              selected && platform === 'android' ? styles.androidSelected : null,
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: selected ? theme.colors.text : theme.colors.textSecondary,
                  fontWeight: selected ? '700' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
  },
  option: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidSelected: {
    elevation: 1,
  },
});
