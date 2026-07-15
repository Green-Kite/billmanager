import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-linking', () => ({ createURL: vi.fn(() => 'billmanager://auth/callback') }));
vi.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: vi.fn(),
  openAuthSessionAsync: vi.fn(),
}));

import { parseOAuthRedirect } from './oauthBrowser';

describe('OAuth redirect parsing', () => {
  it('returns a verified authorization code', () => {
    expect(parseOAuthRedirect(
      'billmanager://auth/callback?code=abc&state=expected&provider=google',
      'expected',
    )).toEqual({
      status: 'success',
      code: 'abc',
      state: 'expected',
      provider: 'google',
    });
  });

  it('rejects a mismatched state token', () => {
    expect(parseOAuthRedirect(
      'billmanager://auth/callback?code=abc&state=wrong',
      'expected',
    )).toEqual({
      status: 'error',
      message: 'The authorization response could not be verified.',
    });
  });

  it('preserves a provider error without exposing tokens', () => {
    expect(parseOAuthRedirect(
      'billmanager://auth/callback?error=access_denied&error_description=Cancelled',
      'expected',
    )).toEqual({ status: 'error', message: 'Cancelled' });
  });
});
