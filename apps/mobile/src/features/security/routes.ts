import type { SecurityRouteDefinition } from './types';

export const securityRouteDefinitions = [
  { name: 'SecurityOverview', path: 'settings/security' },
  { name: 'LinkedAccounts', path: 'settings/security/linked-accounts', capability: 'oauth' },
  { name: 'TwoFactorSettings', path: 'settings/security/two-factor' },
  { name: 'EmailTwoFactorSetup', path: 'settings/security/two-factor/email', capability: 'emailOtp' },
  { name: 'PasskeyManagement', path: 'settings/security/passkeys', capability: 'passkeys' },
  { name: 'RecoveryCodes', path: 'settings/security/recovery-codes' },
  { name: 'DisableTwoFactor', path: 'settings/security/disable-two-factor' },
  { name: 'DeleteAccount', path: 'settings/security/delete-account', ownerOnly: true },
] as const satisfies readonly SecurityRouteDefinition[];

export type SecurityRouteName = (typeof securityRouteDefinitions)[number]['name'];
