import React from 'react';
import { Check, Layers3, X } from 'lucide-react-native';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';
import AdaptiveSurface from './AdaptiveSurface';

interface BucketPickerProps {
  platform: AdaptivePlatform;
  visible: boolean;
  selected: string;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function BucketPicker({
  platform,
  visible,
  selected,
  options,
  onSelect,
  onClose,
}: BucketPickerProps) {
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();

  return (
    <Modal
      animationType={platform === 'ios' ? 'slide' : 'fade'}
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mobileCore.picker.closePicker')}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <AdaptiveSurface
          style={[
            styles.sheet,
            platform === 'ios' ? styles.iosSheet : styles.androidDialog,
            { backgroundColor: theme.colors.surfaceRaised },
          ]}
        >
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
              <Layers3 size={21} color={theme.colors.primary} />
            </View>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={[typography.section, { color: theme.colors.text }]}>
                {t('mobileCore.picker.title')}
              </Text>
              <Text style={[typography.caption, { color: theme.colors.textMuted }]}>
                {t('mobileCore.picker.description')}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('mobileCore.picker.close')}
              onPress={onClose}
              style={({ pressed }) => [
                styles.close,
                { minWidth: theme.minimumHitSize, minHeight: theme.minimumHitSize, opacity: pressed ? 0.55 : 1 },
              ]}
            >
              <X size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <View>
            {options.map((option, index) => {
              const isSelected = option === selected;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={option}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      minHeight: theme.minimumHitSize + 8,
                      borderBottomColor: theme.colors.border,
                      borderBottomWidth: index === options.length - 1 ? 0 : StyleSheet.hairlineWidth,
                      backgroundColor: pressed || isSelected ? theme.colors.surfaceMuted : 'transparent',
                    },
                  ]}
                >
                  <Text style={[typography.body, { color: theme.colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                    {option}
                  </Text>
                  {isSelected ? <Check size={21} color={theme.colors.primary} strokeWidth={2.6} /> : null}
                </Pressable>
              );
            })}
          </View>
        </AdaptiveSurface>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
  },
  androidDialog: {
    borderRadius: 28,
  },
  iosSheet: {
    alignSelf: 'stretch',
    marginTop: 'auto',
    marginHorizontal: -20,
    marginBottom: -20,
    maxWidth: undefined,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 14,
  },
  header: {
    minHeight: 78,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  close: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  option: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
  },
});
