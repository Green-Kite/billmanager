import { Canvas, Circle, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle as SvgCircle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path as SvgPath,
  Stop,
} from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AdaptivePlatform, typography } from '../../design/tokens';
import { useAdaptiveTheme } from '../../design/useAdaptiveTheme';
import { formatCurrency } from '../../i18n/format';

interface PreviewLineChartProps {
  platform: AdaptivePlatform;
  width: number;
  compact?: boolean;
  values?: number[];
}

const previewProjection = [720, 790, 735, 810, 770, 700, 675, 620, 410, 280, 505, 644];

export default function PreviewLineChart({
  platform,
  width,
  compact = false,
  values,
}: PreviewLineChartProps) {
  const theme = useAdaptiveTheme(platform);
  const { t } = useTranslation();
  const chartWidth = Math.max(260, width);
  const chartHeight = compact ? 112 : 136;
  const series = values && values.length > 1
    ? values
    : process.env.EXPO_PUBLIC_DESIGN_PREVIEW === '1'
      ? previewProjection
      : [0, 0];

  const drawing = useMemo(() => {
    const left = 10;
    const right = chartWidth - 10;
    const top = 10;
    const bottom = chartHeight - 12;
    const minimum = Math.min(...series);
    const maximum = Math.max(...series);
    const span = Math.max(1, maximum - minimum);
    const point = (value: number, index: number) => ({
      x: left + (index / Math.max(1, series.length - 1)) * (right - left),
      y: bottom - ((value - minimum) / span) * (bottom - top),
    });
    const points = series.map(point);
    const last = point(series[series.length - 1], series.length - 1);
    const pathData = points
      .map((current, index) => `${index === 0 ? 'M' : 'L'} ${current.x} ${current.y}`)
      .join(' ');
    const fillData = `M ${points[0].x} ${bottom} L ${points[0].x} ${points[0].y} ${points
      .slice(1)
      .map((current) => `L ${current.x} ${current.y}`)
      .join(' ')} L ${last.x} ${bottom} Z`;
    const nativePath = Platform.OS === 'web' ? null : Skia.Path.MakeFromSVGString(pathData);
    const nativeFill = Platform.OS === 'web' ? null : Skia.Path.MakeFromSVGString(fillData);
    const lowestIndex = series.indexOf(minimum);
    return {
      pathData,
      fillData,
      nativePath,
      nativeFill,
      last,
      lowest: point(minimum, lowestIndex),
      minimum,
      maximum,
    };
  }, [chartHeight, chartWidth, series]);

  const lineColor = platform === 'ios' ? '#00875A' : '#006C4C';
  const summary = t('mobileCore.chart.summary', {
    start: formatCurrency(series[0]),
    minimum: formatCurrency(drawing.minimum),
    maximum: formatCurrency(drawing.maximum),
    end: formatCurrency(series[series.length - 1]),
  });

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={summary}
      style={styles.container}
    >
      {Platform.OS === 'web' ? (
        <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Defs>
            <SvgLinearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity={0.2} />
              <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          <SvgPath d={drawing.fillData} fill="url(#balance-fill)" />
          <SvgPath
            d={drawing.pathData}
            fill="none"
            stroke={lineColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <SvgCircle cx={drawing.lowest.x} cy={drawing.lowest.y} r={4.5} fill={theme.colors.accent} />
          <SvgCircle cx={drawing.last.x} cy={drawing.last.y} r={4.5} fill={lineColor} />
        </Svg>
      ) : drawing.nativePath && drawing.nativeFill ? (
        <Canvas style={{ width: chartWidth, height: chartHeight }}>
          <Path path={drawing.nativeFill}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, chartHeight)}
              colors={[`${lineColor}32`, `${lineColor}00`]}
            />
          </Path>
          <Path path={drawing.nativePath} color={lineColor} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" />
          <Circle cx={drawing.lowest.x} cy={drawing.lowest.y} r={4.5} color={theme.colors.accent} />
          <Circle cx={drawing.last.x} cy={drawing.last.y} r={4.5} color={lineColor} />
        </Canvas>
      ) : null}
      {!compact ? (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
            <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{t('mobileCore.chart.projectedBalance')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
            <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{t('mobileCore.chart.lowestPoint')}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    paddingTop: 8,
  },
  legend: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});
