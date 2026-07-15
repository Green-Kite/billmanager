import type { Bill, DatabaseInfo } from '../../types';

export type BillSort =
  | 'due_asc'
  | 'due_desc'
  | 'name_asc'
  | 'name_desc'
  | 'amount_desc'
  | 'amount_asc';

export interface BillListFilters {
  dueFrom: string;
  dueTo: string;
  account: string | null;
  category: string | null;
}

export const emptyBillListFilters: BillListFilters = {
  dueFrom: '',
  dueTo: '',
  account: null,
  category: null,
};

export const billSortLabels: Record<BillSort, string> = {
  due_asc: 'Due soonest',
  due_desc: 'Due latest',
  name_asc: 'Name A–Z',
  name_desc: 'Name Z–A',
  amount_desc: 'Highest amount',
  amount_asc: 'Lowest amount',
};

function validIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function billAmount(bill: Bill): number {
  return Math.abs(bill.amount ?? bill.avg_amount ?? 0);
}

export function filterAndSortBills(
  bills: Bill[],
  query: string,
  filters: BillListFilters,
  sort: BillSort,
): Bill[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const dueFrom = validIsoDate(filters.dueFrom) ? filters.dueFrom : null;
  const dueTo = validIsoDate(filters.dueTo) ? filters.dueTo : null;

  return bills
    .filter((bill) => {
      const searchable = [bill.name, bill.account, bill.category, bill.notes, bill.database_name]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase();
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery))
        && (!dueFrom || bill.next_due >= dueFrom)
        && (!dueTo || bill.next_due <= dueTo)
        && (!filters.account || bill.account === filters.account)
        && (!filters.category || bill.category === filters.category)
      );
    })
    .sort((left, right) => {
      if (sort === 'due_asc') return left.next_due.localeCompare(right.next_due) || left.name.localeCompare(right.name);
      if (sort === 'due_desc') return right.next_due.localeCompare(left.next_due) || left.name.localeCompare(right.name);
      if (sort === 'name_asc') return left.name.localeCompare(right.name);
      if (sort === 'name_desc') return right.name.localeCompare(left.name);
      if (sort === 'amount_desc') return billAmount(right) - billAmount(left) || left.name.localeCompare(right.name);
      return billAmount(left) - billAmount(right) || left.name.localeCompare(right.name);
    });
}

export function billBucketLabel(bill: Bill, databases: DatabaseInfo[]): string | null {
  if (bill.database_id !== undefined) {
    const selected = databases.find((database) => database.id === bill.database_id)?.display_name;
    if (selected) return selected;
  }
  return bill.database_name?.trim() || null;
}

export function countBillListFilters(filters: BillListFilters): number {
  return Number(Boolean(filters.dueFrom || filters.dueTo))
    + Number(Boolean(filters.account))
    + Number(Boolean(filters.category));
}

export function billMoveChanges(targetDatabaseId: number): Pick<Bill, 'database_id'> {
  return { database_id: targetDatabaseId };
}
