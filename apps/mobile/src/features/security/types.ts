export interface PasskeySummary {
  id: number;
  device_name: string;
  created_at: string | null;
  last_used_at: string | null;
}

export interface TwoFactorStatus {
  enabled: boolean;
  email_otp_enabled: boolean;
  passkey_enabled: boolean;
  passkeys: PasskeySummary[];
  has_recovery_codes: boolean;
}

export interface EmailTwoFactorSetup {
  message: string;
  setup_token: string;
}

export interface TwoFactorConfirmation {
  message: string;
  recovery_codes: string[] | null;
}

export interface PasskeyRegistrationOptions {
  options: Record<string, unknown>;
  registration_token: string;
}

export interface PasskeyRegistrationResult {
  message: string;
  credential_id: number;
  device_name: string;
  recovery_codes: string[] | null;
}

export interface PasskeyAuthenticationOptions {
  options: Record<string, unknown>;
}

export interface RecoveryCodesResult {
  recovery_codes: string[];
}

export interface SecurityRouteDefinition {
  name:
    | 'SecurityOverview'
    | 'LinkedAccounts'
    | 'TwoFactorSettings'
    | 'EmailTwoFactorSetup'
    | 'PasskeyManagement'
    | 'RecoveryCodes'
    | 'DisableTwoFactor'
    | 'DeleteAccount';
  path: string;
  capability?: 'oauth' | 'emailOtp' | 'passkeys';
  ownerOnly?: boolean;
}
