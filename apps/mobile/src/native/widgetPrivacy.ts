import Storage from 'expo-sqlite/kv-store';

const WIDGET_AMOUNTS_KEY = 'billmanager:widget-show-amounts';

export async function getWidgetAmountsVisible(): Promise<boolean> {
  return (await Storage.getItem(WIDGET_AMOUNTS_KEY)) === 'true';
}

export async function setWidgetAmountsVisible(visible: boolean): Promise<void> {
  await Storage.setItem(WIDGET_AMOUNTS_KEY, String(visible));
}
