import type { AuthRouteDefinition } from './types';

export const authRouteDefinitions = [
  { name: 'Login', path: 'login', access: 'public' },
  { name: 'Register', path: 'register', access: 'public', capability: 'registration' },
  { name: 'VerifyEmail', path: 'verify-email', access: 'public' },
  { name: 'ResendVerification', path: 'resend-verification', access: 'public' },
  { name: 'ForgotPassword', path: 'forgot-password', access: 'public' },
  { name: 'ResetPassword', path: 'reset-password', access: 'public' },
  { name: 'ForcedPasswordChange', path: 'change-password', access: 'public' },
  { name: 'AcceptInvite', path: 'accept-invite', access: 'public' },
  { name: 'AcceptShareInvite', path: 'accept-share-invite', access: 'public', capability: 'sharing' },
  { name: 'OAuthProviders', path: 'auth/providers', access: 'public', capability: 'oauth' },
  { name: 'OAuthCallback', path: 'auth/callback', access: 'public', capability: 'oauth' },
  { name: 'TwoFactorChallenge', path: 'auth/two-factor', access: 'public' },
] as const satisfies readonly AuthRouteDefinition[];

export type AuthRouteName = (typeof authRouteDefinitions)[number]['name'];
