export * from './types';
export * from './routes';
export * from './passkeyAdapter';
export * from './screens/SecurityOverviewScreen';
export * from './screens/LinkedAccountsScreen';
export * from './screens/TwoFactorSettingsScreen';
export * from './screens/TwoFactorManagementScreens';
export * from './screens/DeleteAccountScreen';

import { LinkedAccountsScreen } from './screens/LinkedAccountsScreen';
import { SecurityOverviewScreen } from './screens/SecurityOverviewScreen';
import { TwoFactorSettingsScreen } from './screens/TwoFactorSettingsScreen';
import {
  DisableTwoFactorScreen,
  EmailTwoFactorSetupScreen,
  PasskeyManagementScreen,
  RecoveryCodesScreen,
} from './screens/TwoFactorManagementScreens';
import { DeleteAccountScreen } from './screens/DeleteAccountScreen';

export const securityScreens = {
  SecurityOverview: SecurityOverviewScreen,
  LinkedAccounts: LinkedAccountsScreen,
  TwoFactorSettings: TwoFactorSettingsScreen,
  EmailTwoFactorSetup: EmailTwoFactorSetupScreen,
  PasskeyManagement: PasskeyManagementScreen,
  RecoveryCodes: RecoveryCodesScreen,
  DisableTwoFactor: DisableTwoFactorScreen,
  DeleteAccount: DeleteAccountScreen,
} as const;
