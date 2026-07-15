import type { Payment } from '../../types';

export type FeatureLoadStatus = 'loading' | 'ready' | 'error' | 'permission-denied';

export type PaymentDirection = 'all' | 'expense' | 'deposit';
export type PaymentDateRange = 'all' | 'month' | 'quarter' | 'year' | 'custom';
export type PaymentSort = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'bill_asc' | 'bill_desc';
export type PaymentExportFormat = 'csv' | 'pdf' | 'print' | 'share';
export type PaymentFilterKind = 'date' | 'amount' | 'account' | 'category' | 'bucket';

export interface PaymentHistoryFilters {
  query: string;
  direction: PaymentDirection;
  dateRange: PaymentDateRange;
  dateLabel: string;
  dateFrom: string;
  dateTo: string;
  minAmount: number | null;
  maxAmount: number | null;
  accountId: string | null;
  accountLabel: string;
  categoryId: string | null;
  categoryLabel: string;
  bucketId: string | null;
  bucketLabel: string;
}

export interface PaymentHistoryItem {
  id: string;
  billId: string;
  billName: string;
  amount: number;
  direction: Exclude<PaymentDirection, 'all'>;
  paidAt: string;
  paidAtLabel: string;
  bucketName: string;
  accountName?: string;
  categoryName?: string;
  note?: string;
  pendingSync?: boolean;
  canModify: boolean;
  derivedPaymentLabel?: string;
}

export interface PaymentHistorySummary {
  paymentCount: number;
  income: number;
  expenses: number;
  net: number;
}

export interface PaymentHistoryViewModel {
  status: FeatureLoadStatus;
  errorMessage?: string;
  permissionMessage?: string;
  offline: boolean;
  lastUpdatedLabel?: string;
  currency: string;
  locale: string;
  filters: PaymentHistoryFilters;
  sort: PaymentSort;
  summary: PaymentHistorySummary;
  payments: PaymentHistoryItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  refreshing?: boolean;
}

export interface PaymentHistoryActions {
  onChangeFilters: (filters: PaymentHistoryFilters) => void;
  onChangeSort: (sort: PaymentSort) => void;
  onOpenSort: () => void;
  onOpenFilter: (kind: PaymentFilterKind) => void;
  onResetFilters: () => void;
  onExport: (format: PaymentExportFormat) => void;
  onEditPayment: (paymentId: string) => void;
  onDeletePayment: (paymentId: string) => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  onRetry: () => void;
}

export const emptyPaymentHistoryFilters: PaymentHistoryFilters = {
  query: '',
  direction: 'all',
  dateRange: 'all',
  dateLabel: 'Any date',
  dateFrom: '',
  dateTo: '',
  minAmount: null,
  maxAmount: null,
  accountId: null,
  accountLabel: 'All accounts',
  categoryId: null,
  categoryLabel: 'All categories',
  bucketId: null,
  bucketLabel: 'All buckets',
};

export function derivePaymentHistorySummary(
  payments: Pick<PaymentHistoryItem, 'amount' | 'direction'>[],
): PaymentHistorySummary {
  return payments.reduce<PaymentHistorySummary>((summary, payment) => {
    const amount = Math.abs(payment.amount);
    if (payment.direction === 'deposit') {
      summary.income += amount;
      summary.net += amount;
    } else {
      summary.expenses += amount;
      summary.net -= amount;
    }
    summary.paymentCount += 1;
    return summary;
  }, { paymentCount: 0, income: 0, expenses: 0, net: 0 });
}

export function paymentSortLabel(sort: PaymentSort): string {
  const labels: Record<PaymentSort, string> = {
    date_desc: 'Newest first',
    date_asc: 'Oldest first',
    amount_desc: 'Highest amount',
    amount_asc: 'Lowest amount',
    bill_asc: 'Bill name A–Z',
    bill_desc: 'Bill name Z–A',
  };
  return labels[sort];
}

function startOfPreset(range: PaymentDateRange, now: Date): string | null {
  if (range === 'all' || range === 'custom') return null;
  const months = range === 'month' ? 1 : range === 'quarter' ? 3 : 12;
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function filterAndSortPayments(
  items: PaymentHistoryItem[],
  filters: PaymentHistoryFilters,
  sort: PaymentSort,
  now = new Date(),
): PaymentHistoryItem[] {
  const query = filters.query.trim().toLocaleLowerCase();
  const presetStart = startOfPreset(filters.dateRange, now);
  const customFrom = filters.dateRange === 'custom' && validDate(filters.dateFrom)
    ? filters.dateFrom
    : null;
  const customTo = filters.dateRange === 'custom' && validDate(filters.dateTo)
    ? filters.dateTo
    : null;

  return items
    .filter((item) => {
      const amount = Math.abs(item.amount);
      const searchable = [item.billName, item.note, item.accountName, item.categoryName, item.bucketName]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return (
        (!query || searchable.includes(query))
        && (filters.direction === 'all' || item.direction === filters.direction)
        && (!presetStart || item.paidAt >= presetStart)
        && (!customFrom || item.paidAt >= customFrom)
        && (!customTo || item.paidAt <= customTo)
        && (filters.minAmount === null || amount >= filters.minAmount)
        && (filters.maxAmount === null || amount <= filters.maxAmount)
        && (!filters.accountId || item.accountName === filters.accountId)
        && (!filters.categoryId || item.categoryName === filters.categoryId)
        && (!filters.bucketId || item.bucketName === filters.bucketId)
      );
    })
    .sort((left, right) => {
      if (sort === 'date_desc') return right.paidAt.localeCompare(left.paidAt) || left.billName.localeCompare(right.billName);
      if (sort === 'date_asc') return left.paidAt.localeCompare(right.paidAt) || left.billName.localeCompare(right.billName);
      if (sort === 'amount_desc') return Math.abs(right.amount) - Math.abs(left.amount) || left.billName.localeCompare(right.billName);
      if (sort === 'amount_asc') return Math.abs(left.amount) - Math.abs(right.amount) || left.billName.localeCompare(right.billName);
      if (sort === 'bill_desc') return right.billName.localeCompare(left.billName);
      return left.billName.localeCompare(right.billName);
    });
}

export function hasActivePaymentFilters(filters: PaymentHistoryFilters): boolean {
  return filters.query.trim().length > 0
    || filters.direction !== 'all'
    || filters.dateRange !== 'all'
    || filters.minAmount !== null
    || filters.maxAmount !== null
    || Boolean(filters.accountId || filters.categoryId || filters.bucketId);
}

export function paymentCanBeModified(payment: Pick<Payment, 'is_share_payment' | 'is_received_payment'>): boolean {
  return payment.is_share_payment !== true && payment.is_received_payment !== true;
}
