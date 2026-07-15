import { useWindowDimensions } from 'react-native';

export interface AdaptiveLayout {
  width: number;
  height: number;
  isTablet: boolean;
  isWideTablet: boolean;
  horizontalPadding: number;
  columnGap: number;
  contentWidth: number;
}

export function useAdaptiveLayout(): AdaptiveLayout {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 720;
  const isWideTablet = width >= 1024;
  const horizontalPadding = isTablet ? 28 : 16;
  const columnGap = isTablet ? 20 : 12;

  return {
    width,
    height,
    isTablet,
    isWideTablet,
    horizontalPadding,
    columnGap,
    contentWidth: Math.min(width - (horizontalPadding * 2), 1180),
  };
}
