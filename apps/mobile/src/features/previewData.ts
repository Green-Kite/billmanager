export type PreviewBillTone = 'expense' | 'income';
export type PreviewBillIcon = 'electric' | 'streaming' | 'salary' | 'music' | 'insurance' | 'internet';

export interface PreviewBill {
  id: string;
  name: string;
  amount: number;
  dueLabel: string;
  cadence: string;
  tone: PreviewBillTone;
  icon: PreviewBillIcon;
  category: string;
  account: string;
  dueDate?: string;
  source?: import('../types').Bill;
}

export const previewBills: PreviewBill[] = [
  {
    id: 'electric',
    name: 'Electric',
    amount: 142.18,
    dueLabel: 'Due today',
    dueDate: '2026-07-15',
    cadence: 'Monthly',
    tone: 'expense',
    icon: 'electric',
    category: 'Utilities',
    account: 'Checking',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    amount: 15.99,
    dueLabel: 'Jul 17',
    dueDate: '2026-07-17',
    cadence: 'Monthly',
    tone: 'expense',
    icon: 'streaming',
    category: 'Entertainment',
    account: 'Rewards card',
  },
  {
    id: 'salary',
    name: 'Salary',
    amount: 2250,
    dueLabel: 'Jul 18',
    dueDate: '2026-07-18',
    cadence: 'Bi-weekly',
    tone: 'income',
    icon: 'salary',
    category: 'Income',
    account: 'Checking',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    amount: 10.99,
    dueLabel: 'Jul 19',
    dueDate: '2026-07-19',
    cadence: 'Monthly',
    tone: 'expense',
    icon: 'music',
    category: 'Entertainment',
    account: 'Rewards card',
  },
  {
    id: 'insurance',
    name: 'Car insurance',
    amount: 128.5,
    dueLabel: 'Jul 21',
    dueDate: '2026-07-21',
    cadence: 'Monthly',
    tone: 'expense',
    icon: 'insurance',
    category: 'Insurance',
    account: 'Checking',
  },
  {
    id: 'internet',
    name: 'Home internet',
    amount: 69.99,
    dueLabel: 'Jul 24',
    dueDate: '2026-07-24',
    cadence: 'Monthly',
    tone: 'expense',
    icon: 'internet',
    category: 'Utilities',
    account: 'Checking',
  },
];
