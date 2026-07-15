import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { OAuthBrowserResult } from './types';

WebBrowser.maybeCompleteAuthSession();

export interface OAuthBrowserAdapter {
  createRedirectUri(): string;
  authorize(
    authorizationUrl: string,
    expectedState: string,
    redirectUri?: string,
  ): Promise<OAuthBrowserResult>;
}

export function parseOAuthRedirect(
  redirectUrl: string,
  expectedState: string,
): OAuthBrowserResult {
  try {
    const parsed = new URL(redirectUrl);
    const error = parsed.searchParams.get('error');
    if (error) {
      return {
        status: 'error',
        message: parsed.searchParams.get('error_description') ?? 'Authorization was not completed.',
      };
    }

    const code = parsed.searchParams.get('code');
    const state = parsed.searchParams.get('state');
    const provider = parsed.searchParams.get('provider') ?? undefined;
    if (!code || !state) {
      return { status: 'error', message: 'The authorization response was incomplete.' };
    }
    if (state !== expectedState) {
      return { status: 'error', message: 'The authorization response could not be verified.' };
    }
    return { status: 'success', code, state, provider };
  } catch {
    return { status: 'error', message: 'The authorization response was invalid.' };
  }
}

export const expoOAuthBrowserAdapter: OAuthBrowserAdapter = {
  createRedirectUri: () => Linking.createURL('auth/callback'),
  authorize: async (authorizationUrl, expectedState, redirectUri) => {
    const returnUrl = redirectUri ?? Linking.createURL('auth/callback');
    const result = await WebBrowser.openAuthSessionAsync(authorizationUrl, returnUrl);
    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { status: 'cancelled' };
    }
    if (result.type !== 'success' || !result.url) {
      return { status: 'error', message: 'Authorization did not return to BillManager.' };
    }
    return parseOAuthRedirect(result.url, expectedState);
  },
};
