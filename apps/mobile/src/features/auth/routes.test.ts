import { describe, expect, it } from 'vitest';

import { securityRouteDefinitions } from '../security/routes';
import { authRouteDefinitions } from './routes';

describe('mobile authentication and security routes', () => {
  it('keeps route names and deep-link paths unique', () => {
    const routes = [...authRouteDefinitions, ...securityRouteDefinitions];
    expect(new Set(routes.map((route) => route.name)).size).toBe(routes.length);
    expect(new Set(routes.map((route) => route.path)).size).toBe(routes.length);
  });

  it('keeps token-bearing entry points public without embedding tokens in paths', () => {
    const publicNames = new Set(
      authRouteDefinitions.filter((route) => route.access === 'public').map((route) => route.name),
    );
    const tokenEntryRoutes = [
      'VerifyEmail',
      'ResetPassword',
      'AcceptInvite',
      'AcceptShareInvite',
      'OAuthCallback',
    ] as const;
    tokenEntryRoutes.forEach((name) => expect(publicNames.has(name)).toBe(true));
    expect(authRouteDefinitions.every((route) => !route.path.includes(':token'))).toBe(true);
  });
});
