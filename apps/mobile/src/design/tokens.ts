import { Platform } from 'react-native';

export type AdaptivePlatform = 'android' | 'ios';

export function defaultAdaptivePlatform(): AdaptivePlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (
    Platform.OS === 'web'
    && process.env.EXPO_PUBLIC_DESIGN_PREVIEW === '1'
    && process.env.EXPO_PUBLIC_DESIGN_PLATFORM === 'ios'
  ) return 'ios';
  return 'android';
}

export interface AdaptiveColors {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  accent: string;
  accentContainer: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
  chartGrid: string;
  tabBar: string;
}

export interface AdaptiveTheme {
  platform: AdaptivePlatform;
  isDark: boolean;
  colors: AdaptiveColors;
  radius: {
    small: number;
    medium: number;
    large: number;
    pill: number;
  };
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  minimumHitSize: number;
  contentMaxWidth: number;
}

const androidLight: AdaptiveColors = {
  background: '#FBFAF6',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceMuted: '#EFF5EF',
  primary: '#006C4C',
  primaryContainer: '#D7F6E4',
  onPrimary: '#FFFFFF',
  accent: '#F36C00',
  accentContainer: '#FFF0E2',
  text: '#1B1C1A',
  textSecondary: '#464A46',
  textMuted: '#6E746E',
  border: '#DDE3DC',
  success: '#008A58',
  danger: '#BA1A1A',
  chartGrid: '#CBD3CB',
  tabBar: '#FFFCF8',
};

const androidDark: AdaptiveColors = {
  background: '#0F1512',
  surface: '#161D19',
  surfaceRaised: '#1C2520',
  surfaceMuted: '#24322B',
  primary: '#73DDA9',
  primaryContainer: '#064E38',
  onPrimary: '#003824',
  accent: '#FFB77C',
  accentContainer: '#5D2B00',
  text: '#E2E8E2',
  textSecondary: '#C2CAC3',
  textMuted: '#9AA49C',
  border: '#38433C',
  success: '#73DDA9',
  danger: '#FFB4AB',
  chartGrid: '#4D5851',
  tabBar: '#151C18',
};

const iosLight: AdaptiveColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceMuted: '#E9F6EF',
  primary: '#00875A',
  primaryContainer: '#DDF6E9',
  onPrimary: '#FFFFFF',
  accent: '#F26A00',
  accentContainer: '#FFF0E2',
  text: '#111113',
  textSecondary: '#3C3C43',
  textMuted: '#6C6C70',
  border: '#D1D1D6',
  success: '#00875A',
  danger: '#FF3B30',
  chartGrid: '#C7C7CC',
  tabBar: 'rgba(249,249,249,0.96)',
};

const iosDark: AdaptiveColors = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceRaised: '#2C2C2E',
  surfaceMuted: '#16362A',
  primary: '#55D69A',
  primaryContainer: '#174C38',
  onPrimary: '#003824',
  accent: '#FF9F5A',
  accentContainer: '#4A2B12',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textMuted: '#AEAEB2',
  border: '#38383A',
  success: '#55D69A',
  danger: '#FF6961',
  chartGrid: '#48484A',
  tabBar: 'rgba(28,28,30,0.96)',
};

export const createAdaptiveTheme = (
  isDark: boolean,
  platform: AdaptivePlatform = defaultAdaptivePlatform(),
): AdaptiveTheme => ({
  platform,
  isDark,
  colors: platform === 'ios'
    ? (isDark ? iosDark : iosLight)
    : (isDark ? androidDark : androidLight),
  radius: {
    small: platform === 'ios' ? 8 : 10,
    medium: platform === 'ios' ? 12 : 16,
    large: platform === 'ios' ? 16 : 24,
    pill: 999,
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  minimumHitSize: platform === 'ios' ? 44 : 48,
  contentMaxWidth: 1180,
});

export const typography = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  section: { fontSize: 20, lineHeight: 25, fontWeight: '700' as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '500' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  amount: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const },
};
