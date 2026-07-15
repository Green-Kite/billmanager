import * as Haptics from 'expo-haptics';
import React from 'react';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme, type ThemeMode } from '../../context/ThemeContext';
import { AdaptivePlatform } from '../../design/tokens';
import {
  SettingsChoiceRow,
  SettingsDetailPage,
  SettingsInfoRow,
  SettingsSection,
} from './SettingsDetailComponents';

export function AppearanceScreenView({ platform }: { platform: AdaptivePlatform }) {
  const { t } = useTranslation();
  const deviceScheme = useColorScheme();
  const { themeMode, setThemeMode } = useTheme();

  const chooseMode = async (mode: ThemeMode) => {
    if (mode === themeMode) return;
    await setThemeMode(mode);
    void Haptics.selectionAsync();
  };

  return (
    <SettingsDetailPage platform={platform} intro={t('mobileSettings.appearance.intro')}>
      <SettingsSection platform={platform} title={t('mobileSettings.appearance.mode')}>
        <SettingsChoiceRow
          platform={platform}
          title={t('mobileSettings.appearance.light')}
          subtitle={t('mobileSettings.appearance.lightDetail')}
          selected={themeMode === 'light'}
          onPress={() => void chooseMode('light')}
        />
        <SettingsChoiceRow
          platform={platform}
          title={t('mobileSettings.appearance.dark')}
          subtitle={t('mobileSettings.appearance.darkDetail')}
          selected={themeMode === 'dark'}
          onPress={() => void chooseMode('dark')}
        />
        <SettingsChoiceRow
          platform={platform}
          title={t('mobileSettings.appearance.system')}
          subtitle={t('mobileSettings.appearance.systemDetail')}
          selected={themeMode === 'system'}
          onPress={() => void chooseMode('system')}
          isLast
        />
      </SettingsSection>

      <SettingsSection platform={platform} title={t('mobileSettings.appearance.activeSystem')}>
        <SettingsInfoRow
          platform={platform}
          label={t('mobileSettings.appearance.system')}
          value={deviceScheme === 'dark'
            ? t('mobileSettings.appearance.systemDark')
            : t('mobileSettings.appearance.systemLight')}
          isLast
        />
      </SettingsSection>
    </SettingsDetailPage>
  );
}
