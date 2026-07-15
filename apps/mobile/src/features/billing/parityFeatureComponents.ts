import AdministrationScreen from '../administration/AdministrationScreen';
import AnalyticsScreen from '../analytics/AnalyticsScreen';
import CollaborationScreen from '../collaboration/CollaborationScreen';
import PaymentHistoryScreen from '../payments/PaymentHistoryScreen';
import SettlementsScreen from '../settlements/SettlementsScreen';
import BillingScreen from './BillingScreen';

/**
 * UI-only route index. Navigation adapters should inject each screen's model and
 * actions instead of allowing these components to fetch or mutate directly.
 */
export const mobileParityFeatureComponents = {
  PaymentHistory: PaymentHistoryScreen,
  Analytics: AnalyticsScreen,
  Settlements: SettlementsScreen,
  Collaboration: CollaborationScreen,
  Administration: AdministrationScreen,
  Billing: BillingScreen,
} as const;

export type MobileParityFeatureRouteName = keyof typeof mobileParityFeatureComponents;
