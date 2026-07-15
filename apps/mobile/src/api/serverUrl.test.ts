import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: vi.fn(async (_algorithm: string, value: string) => {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(value).digest('hex');
  }),
}));

import { normalizeServerUrl, profileForUrl, ServerUrlError } from './serverUrl';
import { legacyProfileIdForBaseUrl } from '../domain/serverProfile';

describe('server URL policy', () => {
  it('normalizes an origin to the API v2 base path', () => {
    expect(normalizeServerUrl(' https://bills.example.com/ ')).toBe(
      'https://bills.example.com/api/v2',
    );
  });

  it('does not duplicate an existing API path', () => {
    expect(normalizeServerUrl('https://bills.example.com/base/api/v2/')).toBe(
      'https://bills.example.com/base/api/v2',
    );
  });

  it('rejects cleartext servers for release builds', () => {
    expect(() => normalizeServerUrl('http://bills.lan')).toThrowError(ServerUrlError);
    expect(() => normalizeServerUrl('http://bills.lan')).toThrow(
      'Release builds require HTTPS',
    );
  });

  it('allows cleartext only when the development policy opts in', () => {
    expect(normalizeServerUrl('http://10.0.2.2:5001', { allowInsecure: true })).toBe(
      'http://10.0.2.2:5001/api/v2',
    );
  });

  it('derives stable, isolated profile ids', async () => {
    const first = await profileForUrl('https://one.example.com');
    const repeated = await profileForUrl('https://one.example.com/');
    const second = await profileForUrl('https://two.example.com');
    expect(first.id).toBe(repeated.id);
    expect(first.id).not.toBe(second.id);
    expect(first.id).toMatch(/^server-v2-[0-9a-f]{64}$/);
  });

  it('separates URLs that collide under the legacy 32-bit profile hash', async () => {
    const victimUrl = 'https://victim.example/api/v2';
    const attackerUrl = 'https://attacker.example/9YJEx5/api/v2';

    expect(legacyProfileIdForBaseUrl(victimUrl)).toBe('server-ce45fdba');
    expect(legacyProfileIdForBaseUrl(attackerUrl)).toBe('server-ce45fdba');

    const [victim, attacker] = await Promise.all([
      profileForUrl(victimUrl),
      profileForUrl(attackerUrl),
    ]);
    expect(victim.id).not.toBe(attacker.id);
  });
});
