import { useMemo } from 'react';

import { useTheme } from '../context/ThemeContext';
import { AdaptivePlatform, createAdaptiveTheme } from './tokens';

export function useAdaptiveTheme(platform?: AdaptivePlatform) {
  const { isDark } = useTheme();
  return useMemo(() => createAdaptiveTheme(isDark, platform), [isDark, platform]);
}
