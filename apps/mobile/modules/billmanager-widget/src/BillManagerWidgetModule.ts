import { NativeModule, requireNativeModule } from 'expo';

import type { BillManagerWidgetSnapshot } from './BillManagerWidget.types';

declare class BillManagerWidgetModule extends NativeModule<Record<string, never>> {
  updateSnapshot(snapshot: BillManagerWidgetSnapshot): Promise<void>;
}

export default requireNativeModule<BillManagerWidgetModule>('BillManagerWidget');
