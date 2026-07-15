import { describe, expect, it } from 'vitest';

import {
  authenticatedSessionFromPayload,
  canUseCachedSession,
} from './authSession';

describe('authenticated mobile session snapshots', () => {
  it('normalizes the current /me envelope and preserves an All Buckets selection', () => {
    const snapshot = authenticatedSessionFromPayload({
      user: {
        id: 7,
        username: 'alice',
        email: 'alice@example.com',
        role: 'admin',
        is_account_owner: true,
        has_password: true,
      },
      databases: [{ id: 4, name: 'family', display_name: 'Family' }],
    }, '_all_', '2026-07-15T12:00:00.000Z');

    expect(snapshot).toEqual({
      user: expect.objectContaining({ id: 7, username: 'alice', role: 'admin' }),
      databases: [{ id: 4, name: 'family', display_name: 'Family' }],
      currentDatabase: '_all_',
      updatedAt: '2026-07-15T12:00:00.000Z',
    });
  });

  it('normalizes the legacy flat user response', () => {
    const snapshot = authenticatedSessionFromPayload({
      id: 8,
      username: 'bob',
      role: 'user',
      databases: [{ id: 9, name: 'personal', display_name: 'Personal' }],
      current_db: 'personal',
    }, null);

    expect(snapshot?.user.username).toBe('bob');
    expect(snapshot?.currentDatabase).toBe('personal');
  });

  it('permits cache fallback only when a token exists and authentication was not rejected', () => {
    expect(canUseCachedSession(true, undefined)).toBe(true);
    expect(canUseCachedSession(true, 503)).toBe(true);
    expect(canUseCachedSession(true, 401)).toBe(false);
    expect(canUseCachedSession(true, 403)).toBe(false);
    expect(canUseCachedSession(true, 200)).toBe(false);
    expect(canUseCachedSession(false, undefined)).toBe(false);
  });
});
