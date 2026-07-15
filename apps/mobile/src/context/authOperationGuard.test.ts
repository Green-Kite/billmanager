import { describe, expect, it } from 'vitest';

import {
  AuthOperationGuard,
  runtimeScopeIsAligned,
  SerializedAuthSessionWrites,
} from './authOperationGuard';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe('AuthOperationGuard', () => {
  it('invalidates delayed authenticated work synchronously on logout', async () => {
    const guard = new AuthOperationGuard();
    const response = deferred<{ username: string }>();
    const operation = guard.captureAuth('server-a');
    const apply = response.promise.then(() => (
      guard.isAuthCurrent(operation, 'server-a')
    ));

    guard.invalidateAuthentication('server-a');
    response.resolve({ username: 'alice' });

    await expect(apply).resolves.toBe(false);
  });

  it('lets a delayed refresh update profile fields without owning a newer database', async () => {
    const guard = new AuthOperationGuard();
    const response = deferred<{ databases: string[] }>();
    const refreshScope = { serverProfileId: 'server-a', databaseId: 'database-a' };
    const authOperation = guard.captureAuth('server-a');
    const databaseOperation = guard.captureDatabase(refreshScope);
    const apply = response.promise.then(() => ({
      mayUpdateUserAndList: guard.isAuthCurrent(authOperation, 'server-a'),
      mayUpdateDatabase: guard.isDatabaseCurrent(databaseOperation, {
        serverProfileId: 'server-a',
        databaseId: 'database-b',
      }),
    }));

    const selectB = guard.beginDatabaseSelection('server-a', 'database-b');
    response.resolve({ databases: ['database-a', 'database-b'] });

    await expect(apply).resolves.toEqual({
      mayUpdateUserAndList: true,
      mayUpdateDatabase: false,
    });
    expect(guard.isDatabaseCurrent(selectB, {
      serverProfileId: 'server-a',
      databaseId: 'database-b',
    })).toBe(true);
  });

  it('orders a newer database write after an already-running snapshot write', async () => {
    const writes = new SerializedAuthSessionWrites();
    const firstWrite = deferred<void>();
    let persistedDatabase = 'initial';
    const saveOldSnapshot = writes.run(async () => {
      await firstWrite.promise;
      persistedDatabase = 'database-a';
    });
    const saveNewSelection = writes.run(async () => {
      persistedDatabase = 'database-b';
    });

    firstWrite.resolve();
    await Promise.all([saveOldSnapshot, saveNewSelection]);

    expect(persistedDatabase).toBe('database-b');
  });

  it('requires both profile and database equality before runtime activation', () => {
    const contextScope = { serverProfileId: 'server-a', databaseId: 'database-a' };

    expect(runtimeScopeIsAligned(contextScope, contextScope)).toBe(true);
    expect(runtimeScopeIsAligned(contextScope, {
      serverProfileId: 'server-a',
      databaseId: 'database-b',
    })).toBe(false);
    expect(runtimeScopeIsAligned(contextScope, {
      serverProfileId: 'server-b',
      databaseId: 'database-a',
    })).toBe(false);
  });
});
