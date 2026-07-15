import type { FeatureLoadStatus } from '../payments/models';

export type AnalyticsRange = '6m' | '12m' | 'year';
export interface AnalyticsAnnualSummary {
  year: number;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
}

export interface AnalyticsYearOverYear {
  currentYear: number;
  previousYear: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
  netChange: number;
}

export interface AnalyticsBreakdownItem {
  id: string;
  label: string;
  amount: number;
  sharePercent: number;
  changePercent?: number;
  color?: string;
}

export interface AnalyticsMonthlyPoint {
  key: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

export interface AnalyticsYearPoint {
  year: number;
  income: number;
  expenses: number;
  net: number;
}

export interface AnalyticsCashFlowPoint {
  key: string;
  label: string;
  openingBalance: number;
  income: number;
  expenses: number;
  endingBalance: number;
  forecast: boolean;
}

export interface AnalyticsViewModel {
  status: FeatureLoadStatus;
  errorMessage?: string;
  permissionMessage?: string;
  offline: boolean;
  lastUpdatedLabel?: string;
  locale: string;
  currency: string;
  bucketLabel: string;
  range: AnalyticsRange;
  selectedYear: number;
  availableYears: number[];
  yearPickerVisible: boolean;
  annual: AnalyticsAnnualSummary;
  yearOverYear: AnalyticsYearOverYear;
  categories: AnalyticsBreakdownItem[];
  accounts: AnalyticsBreakdownItem[];
  monthly: AnalyticsMonthlyPoint[];
  yearly: AnalyticsYearPoint[];
  cashFlow: AnalyticsCashFlowPoint[];
  refreshing?: boolean;
}

export interface AnalyticsActions {
  onChangeRange: (range: AnalyticsRange) => void;
  onOpenYearPicker: () => void;
  onSelectYear: (year: number) => void;
  onCloseYearPicker: () => void;
  onRefresh: () => void;
  onRetry: () => void;
}

function money(value: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function describeAnnualAnalytics(model: Pick<AnalyticsViewModel, 'annual' | 'locale' | 'currency'>): string {
  const { annual, locale, currency } = model;
  return `${annual.year} annual summary. Income ${money(annual.income, locale, currency)}, expenses ${money(annual.expenses, locale, currency)}, net ${money(annual.net, locale, currency)}, savings rate ${annual.savingsRate.toFixed(1)} percent.`;
}

export function describeCashFlow(
  points: AnalyticsCashFlowPoint[],
  locale: string,
  currency: string,
): string {
  if (points.length === 0) return 'No cash-flow data is available.';
  const first = points[0];
  const last = points[points.length - 1];
  const forecastCount = points.filter((point) => point.forecast).length;
  return `Cash flow from ${first.label} to ${last.label}. Ending balance changes from ${money(first.endingBalance, locale, currency)} to ${money(last.endingBalance, locale, currency)}. ${forecastCount} forecast ${forecastCount === 1 ? 'period' : 'periods'}.`;
}
