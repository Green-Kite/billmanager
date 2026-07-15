import { describe, expect, it } from 'vitest';

import {
  derivePaymentHistorySummary,
  emptyPaymentHistoryFilters,
  filterAndSortPayments,
  hasActivePaymentFilters,
  paymentCanBeModified,
  paymentSortLabel,
  type PaymentHistoryItem,
} from './models';

describe('payment history models', () => {
  it('derives signed totals without trusting incoming amount signs', () => {
    expect(derivePaymentHistorySummary([
      { amount: -45, direction: 'expense' },
      { amount: 100, direction: 'deposit' },
      { amount: 25, direction: 'expense' },
    ])).toEqual({ paymentCount: 3, income: 100, expenses: 70, net: 30 });
  });

  it('provides an operator-readable sort label', () => {
    expect(paymentSortLabel('amount_desc')).toBe('Highest amount');
    expect(paymentSortLabel('bill_desc')).toBe('Bill name Z–A');
  });

  it('applies inclusive custom dates and minimum/maximum amounts', () => {
    const items = [
      { id: '1', billName: 'Rent', amount: 1200, paidAt: '2026-07-01', direction: 'expense' },
      { id: '2', billName: 'Internet', amount: 70, paidAt: '2026-07-15', direction: 'expense' },
      { id: '3', billName: 'Salary', amount: 4000, paidAt: '2026-08-01', direction: 'deposit' },
    ] as PaymentHistoryItem[];
    const filtered = filterAndSortPayments(items, {
      ...emptyPaymentHistoryFilters,
      dateRange: 'custom',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      minAmount: 100,
      maxAmount: 1500,
    }, 'date_desc');

    expect(filtered.map((payment) => payment.billName)).toEqual(['Rent']);
  });

  it('supports descending bill-name sort and protects derived shared payments', () => {
    const items = [
      { id: '1', billName: 'Alpha', amount: 1, paidAt: '2026-07-01', direction: 'expense' },
      { id: '2', billName: 'Zulu', amount: 2, paidAt: '2026-07-01', direction: 'expense' },
    ] as PaymentHistoryItem[];
    expect(filterAndSortPayments(items, emptyPaymentHistoryFilters, 'bill_desc')
      .map((payment) => payment.billName)).toEqual(['Zulu', 'Alpha']);
    expect(paymentCanBeModified({ is_share_payment: true })).toBe(false);
    expect(paymentCanBeModified({ is_received_payment: true })).toBe(false);
    expect(paymentCanBeModified({})).toBe(true);
  });

  it('recognizes a fully reset All filter state', () => {
    expect(hasActivePaymentFilters({ ...emptyPaymentHistoryFilters })).toBe(false);
    expect(hasActivePaymentFilters({ ...emptyPaymentHistoryFilters, accountId: 'Checking' })).toBe(true);
    expect(hasActivePaymentFilters({ ...emptyPaymentHistoryFilters, minAmount: 25 })).toBe(true);
  });
});
