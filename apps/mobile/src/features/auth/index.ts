export * from './types';
export * from './routes';
export * from './oauthBrowser';
export * from './validation';
export * from './components/AuthSurface';
export * from './screens/CredentialScreens';
export * from './screens/VerificationScreens';
export * from './screens/InviteScreens';
export * from './screens/OAuthScreens';
export * from './screens/TwoFactorChallengeScreen';

import {
  ForcedPasswordChangeScreen,
  ForgotPasswordScreen,
  LoginFlowScreen,
  RegisterScreen,
  ResendVerificationScreen,
  ResetPasswordScreen,
} from './screens/CredentialScreens';
import { TeamInviteAcceptanceScreen, ShareInviteAcceptanceScreen } from './screens/InviteScreens';
import { OAuthCallbackScreen, OAuthProvidersScreen } from './screens/OAuthScreens';
import { TwoFactorChallengeScreen } from './screens/TwoFactorChallengeScreen';
import { VerifyEmailScreen } from './screens/VerificationScreens';

export const authScreens = {
  Login: LoginFlowScreen,
  Register: RegisterScreen,
  VerifyEmail: VerifyEmailScreen,
  ResendVerification: ResendVerificationScreen,
  ForgotPassword: ForgotPasswordScreen,
  ResetPassword: ResetPasswordScreen,
  ForcedPasswordChange: ForcedPasswordChangeScreen,
  AcceptInvite: TeamInviteAcceptanceScreen,
  AcceptShareInvite: ShareInviteAcceptanceScreen,
  OAuthProviders: OAuthProvidersScreen,
  OAuthCallback: OAuthCallbackScreen,
  TwoFactorChallenge: TwoFactorChallengeScreen,
} as const;
