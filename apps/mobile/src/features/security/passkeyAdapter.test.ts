import { describe, expect, it } from 'vitest';

import {
  PasskeyUnavailableError,
  createNativePasskeyAdapter,
  passkeyAvailability,
  unsupportedPasskeyAdapter,
} from './passkeyAdapter';

describe('passkey adapter fallback', () => {
  it('explains when the server does not support passkeys', async () => {
    await expect(passkeyAvailability(unsupportedPasskeyAdapter, false)).resolves.toEqual({
      available: false,
      reason: 'Passkeys are not enabled on this server.',
    });
  });

  it('explains when the native adapter is absent', async () => {
    await expect(passkeyAvailability(unsupportedPasskeyAdapter, true)).resolves.toEqual({
      available: false,
      reason: 'This build does not include the native passkey credential adapter.',
    });
  });

  it('fails ceremonies with a typed error', async () => {
    await expect(unsupportedPasskeyAdapter.createCredential({})).rejects.toBeInstanceOf(
      PasskeyUnavailableError,
    );
  });

  it('serializes options and parses native credential responses', async () => {
    const calls: string[] = [];
    const adapter = createNativePasskeyAdapter(async () => ({
      isSupported: async () => true,
      createCredential: async (optionsJson) => {
        calls.push(optionsJson);
        return JSON.stringify({ id: 'created', type: 'public-key' });
      },
      getCredential: async (optionsJson) => {
        calls.push(optionsJson);
        return JSON.stringify({ id: 'asserted', type: 'public-key' });
      },
    }));

    await expect(adapter.isSupported()).resolves.toBe(true);
    await expect(adapter.createCredential({ challenge: 'abc' })).resolves.toMatchObject({ id: 'created' });
    await expect(adapter.getCredential({ challenge: 'xyz' })).resolves.toMatchObject({ id: 'asserted' });
    expect(calls.map((value) => JSON.parse(value))).toEqual([
      { challenge: 'abc' },
      { challenge: 'xyz' },
    ]);
  });

  it('keeps native module absence as a typed availability failure', async () => {
    const adapter = createNativePasskeyAdapter(async () => null);
    await expect(adapter.isSupported()).resolves.toBe(false);
    await expect(adapter.getCredential({})).rejects.toBeInstanceOf(PasskeyUnavailableError);
  });
});
