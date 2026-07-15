import { Platform } from 'react-native';

export interface BillManagerWidgetSnapshot {
  billId: number | null;
  nextUpLabel: string;
  title: string;
  dueLabel: string;
  amountLabel: string;
  remainingThisMonthLabel: string;
  showAmounts: boolean;
}

export async function updateWidgetSnapshot(snapshot: BillManagerWidgetSnapshot): Promise<void> {
  if (Platform.OS === 'ios') {
    const widget = (await import('../../widgets/BillManagerUpcoming')).default;
    widget.updateSnapshot(snapshot);
    return;
  }
  if (Platform.OS === 'android') {
    const module = (await import('../../modules/billmanager-widget/src/BillManagerWidgetModule')).default;
    await module.updateSnapshot(snapshot);
  }
}
