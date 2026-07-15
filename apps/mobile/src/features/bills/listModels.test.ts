import { describe, expect, it } from 'vitest';

import type { Bill } from '../../types';
import {
  billBucketLabel,
  billMoveChanges,
  emptyBillListFilters,
  filterAndSortBills,
} from './listModels';

const bills = [
  {
    id: 1,
    name: 'Rent',
    amount: 1200,
    next_due: '2026-08-01',
    account: 'Checking',
    category: 'Housing',
    database_id: 3,
  },
  {
    id: 2,
    name: 'Internet',
    amount: 70,
    next_due: '2026-07-20',
    account: 'Credit Card',
    category: 'Utilities',
    database_name: 'Household',
  },
  {
    id: 3,
    name: 'Salary',
    amount: 4000,
    next_due: '2026-07-31',
    account: 'Checking',
    category: 'Income',
  },
] as Bill[];

describe('bill list filtering and sorting', () => {
  it('combines inclusive due-date, account, and category filters', () => {
    expect(filterAndSortBills(bills, '', {
      dueFrom: '2026-07-01',
      dueTo: '2026-07-31',
      account: 'Checking',
      category: 'Income',
    }, 'due_asc').map((bill) => bill.name)).toEqual(['Salary']);
  });

  it('searches category and bucket attribution and applies explicit descending sorts', () => {
    expect(filterAndSortBills(bills, 'household', emptyBillListFilters, 'name_desc')
      .map((bill) => bill.name)).toEqual(['Internet']);
    expect(filterAndSortBills(bills, '', emptyBillListFilters, 'name_desc')
      .map((bill) => bill.name)).toEqual(['Salary', 'Rent', 'Internet']);
    expect(filterAndSortBills(bills, '', emptyBillListFilters, 'amount_desc')
      .map((bill) => bill.name)).toEqual(['Salary', 'Rent', 'Internet']);
  });

  it('resolves All Buckets attribution and preserves an explicit move destination', () => {
    expect(billBucketLabel(bills[0], [{ id: 3, name: 'family', display_name: 'Family' }]))
      .toBe('Family');
    expect(billBucketLabel(bills[1], [])).toBe('Household');
    expect(billMoveChanges(9)).toEqual({ database_id: 9 });
    expect(billBucketLabel(
      { ...bills[1], database_id: 9, database_name: 'Old bucket' },
      [{ id: 9, name: 'new', display_name: 'New bucket' }],
    )).toBe('New bucket');
  });
});
