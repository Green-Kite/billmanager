import { registerWebModule, NativeModule } from 'expo';

// BillManagerWidgetModule is not available on the web platform.
class BillManagerWidgetModule extends NativeModule<{}> {}

export default registerWebModule(BillManagerWidgetModule, 'BillManagerWidgetModule');
