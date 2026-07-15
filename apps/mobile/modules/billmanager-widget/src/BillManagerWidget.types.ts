export interface BillManagerWidgetSnapshot {
  billId: number | null;
  nextUpLabel: string;
  title: string;
  dueLabel: string;
  amountLabel: string;
  remainingThisMonthLabel: string;
  showAmounts: boolean;
}
