import type { ThemeMode } from './ThemeContext';

export function resolveDarkMode(
  themeMode: ThemeMode,
  systemColorScheme: 'light' | 'dark' | 'unspecified' | null | undefined,
): boolean {
  return themeMode === 'dark'
    || (themeMode === 'system' && systemColorScheme === 'dark');
}
