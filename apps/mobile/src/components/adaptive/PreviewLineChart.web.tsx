import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
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
    const points = series.map((value, index) => ({
      x: left + (index / Math.max(1, series.length - 1)) * (right - left),
      y: bottom - ((value - minimum) / span) * (bottom - top),
    }));
    const last = points[points.length - 1];
    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    const fillData = `M ${points[0].x} ${bottom} L ${points[0].x} ${points[0].y} ${points
      .slice(1)
      .map((point) => `L ${point.x} ${point.y}`)
      .join(' ')} L ${last.x} ${bottom} Z`;
    return {
      pathData,
      fillData,
      last,
      lowest: points[series.indexOf(minimum)],
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
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Defs>
          <LinearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity={0.2} />
            <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={drawing.fillData} fill="url(#balance-fill)" />
        <Path
          d={drawing.pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={drawing.lowest.x} cy={drawing.lowest.y} r={4.5} fill={theme.colors.accent} />
        <Circle cx={drawing.last.x} cy={drawing.last.y} r={4.5} fill={lineColor} />
      </Svg>
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
