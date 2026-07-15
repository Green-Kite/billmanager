import React from 'react';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

import { useAdaptiveTheme } from '../design/useAdaptiveTheme';
import { MainTabsShared } from './MainTabs.shared';

export default function MainTabs() {
  const adaptive = useAdaptiveTheme('android');
  const base = adaptive.isDark ? MD3DarkTheme : MD3LightTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: adaptive.colors.primary,
      onPrimary: adaptive.colors.onPrimary,
      primaryContainer: adaptive.colors.primaryContainer,
      background: adaptive.colors.background,
      surface: adaptive.colors.surface,
      surfaceVariant: adaptive.colors.surfaceMuted,
      outline: adaptive.colors.border,
      error: adaptive.colors.danger,
    },
  };
  return (
    <PaperProvider theme={theme}>
      <MainTabsShared platform="android" />
    </PaperProvider>
  );
}
