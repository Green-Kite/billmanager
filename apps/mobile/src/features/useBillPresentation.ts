import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';
import { useMobileRuntime } from '../context/MobileRuntimeContext';
import { formatDate } from '../i18n/format';
import type { Bill } from '../types';
import { previewBills, type PreviewBill, type PreviewBillIcon } from './previewData';

function iconForBill(bill: Bill): PreviewBillIcon {
  const value = `${bill.icon} ${bill.name} ${bill.category ?? ''}`.toLowerCase();
  if (/electric|power|energy|bolt/.test(value)) return 'electric';
  if (/netflix|stream|video|film|tv/.test(value)) return 'streaming';
  if (/salary|paycheck|income|deposit/.test(value)) return 'salary';
  if (/music|spotify/.test(value)) return 'music';
  if (/insurance|shield/.test(value)) return 'insurance';
  return 'internet';
}

function cadenceLabel(value: string | null | undefined, t: TFunction): string {
  if (!value) return t('mobileCore.common.recurring');
  const normalized = value.toLowerCase().replace(/[\s-]+/g, '_');
  const resourceKey: string | undefined = ({
    daily: 'daily',
    weekly: 'weekly',
    bi_weekly: 'biweekly',
    biweekly: 'biweekly',
    monthly: 'monthly',
    quarterly: 'quarterly',
    semi_annual: 'semiannual',
    semiannual: 'semiannual',
    yearly: 'yearly',
    annually: 'annually',
    custom: 'custom',
    specific_weekdays: 'specificWeekdays',
  } as Record<string, string | undefined>)[normalized];
  const fallback = value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
  return resourceKey
    ? t(`mobileCore.cadence.${resourceKey}`, { defaultValue: fallback })
    : fallback;
}

function dueLabel(nextDue: string, t: TFunction): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${nextDue}T00:00:00`);
  if (Number.isNaN(due.getTime())) return nextDue;
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return t('mobileCore.common.overdueDays', { count: Math.abs(days) });
  if (days === 0) return t('mobileCore.common.dueToday');
  if (days === 1) return t('mobileCore.common.dueTomorrow');
  return formatDate(due);
}

export function toPreviewBill(bill: Bill, t: TFunction): PreviewBill {
  return {
    id: String(bill.id),
    name: bill.name,
    amount: bill.amount ?? bill.avg_amount ?? 0,
    dueLabel: dueLabel(bill.next_due, t),
    dueDate: bill.next_due,
    cadence: cadenceLabel(bill.frequency_type || bill.frequency, t),
    tone: bill.type === 'deposit' ? 'income' : 'expense',
    icon: iconForBill(bill),
    category: bill.category ?? t('mobileCore.common.uncategorized'),
    account: bill.account ?? t('mobileCore.common.noAccount'),
    source: bill,
  };
}

export function useBillPresentation() {
  const runtime = useMobileRuntime();
  const { currentDatabase, databases, selectDatabase } = useAuth();
  const { t, i18n } = useTranslation();
  const designPreview = process.env.EXPO_PUBLIC_DESIGN_PREVIEW === '1';
  const language = i18n.resolvedLanguage;
  const bills = useMemo(
    () => designPreview
      ? previewBills.map((bill) => ({
        ...bill,
        dueLabel: bill.dueDate ? dueLabel(bill.dueDate, t) : bill.dueLabel,
        cadence: cadenceLabel(bill.cadence, t),
      }))
      : runtime.bills.map((bill) => toPreviewBill(bill, t)),
    [designPreview, language, runtime.bills, t],
  );
  const groups = runtime.groups.length > 0 ? runtime.groups : databases;
  const allBucketsLabel = t('mobileCore.common.allBuckets');
  const groupOptions = useMemo(
    () => [...groups.map((group) => group.display_name), allBucketsLabel],
    [allBucketsLabel, groups],
  );
  const selectedGroup = designPreview
    ? "Brad's Bills"
    : currentDatabase === '_all_'
    ? allBucketsLabel
    : groups.find((group) => group.name === currentDatabase)?.display_name
      ?? groups[0]?.display_name
      ?? allBucketsLabel;

  const selectGroup = async (displayName: string) => {
    const databaseName = displayName === allBucketsLabel
      ? '_all_'
      : groups.find((group) => group.display_name === displayName)?.name;
    if (databaseName && databaseName !== currentDatabase) await selectDatabase(databaseName);
  };

  const totals = bills.reduce((result, bill) => {
    if (bill.tone === 'income') result.income += bill.amount;
    else result.expenses += bill.amount;
    return result;
  }, { income: 0, expenses: 0 });
  const forecast = [...bills]
    .sort((left, right) => (left.dueDate ?? '').localeCompare(right.dueDate ?? ''))
    .reduce<number[]>((points, bill) => {
      const previous = points[points.length - 1] ?? 0;
      points.push(previous + (bill.tone === 'income' ? bill.amount : -bill.amount));
      return points;
    }, [0]);
  if (forecast.length === 1) forecast.push(0);

  return {
    ...runtime,
    bills,
    groupOptions,
    selectedGroup,
    isAllBuckets: currentDatabase === '_all_',
    selectGroup,
    totals: {
      ...totals,
      net: totals.income - totals.expenses,
    },
    forecast,
    designPreview,
  };
}
