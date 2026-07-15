import { describe, expect, it, vi } from 'vitest';

import {
  activateForegroundNativeSurfaceScope,
  updateForegroundNativeSurfaces,
} from './foregroundNativeSurfaces';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('foreground native surface leases', () => {
  it.each([
    {
      name: 'profile switch',
      next: { serverProfileId: 'server-b', databaseId: 'family' },
    },
    {
      name: 'database switch',
      next: { serverProfileId: 'server-a', databaseId: 'business' },
    },
  ])('drops a widget update after a $name during reminder scheduling', async ({ next }) => {
    const oldScope = { serverProfileId: 'server-a', databaseId: 'family' };
    const oldLease = activateForegroundNativeSurfaceScope(oldScope);
    const scheduling = deferred();
    const writeWidget = vi.fn();
    const update = updateForegroundNativeSurfaces({
      lease: oldLease,
      scope: oldScope,
      scheduleReminders: () => scheduling.promise,
      writeWidget,
    });

    const nextLease = activateForegroundNativeSurfaceScope(next);
    scheduling.resolve();

    await expect(update).resolves.toBe(false);
    expect(writeWidget).not.toHaveBeenCalled();
    oldLease.release();
    nextLease.release();
  });

  it('invalidates in-flight work when the provider unmounts', async () => {
    const scope = { serverProfileId: 'server-a', databaseId: 'family' };
    const lease = activateForegroundNativeSurfaceScope(scope);
    const scheduling = deferred();
    const writeWidget = vi.fn();
    const update = updateForegroundNativeSurfaces({
      lease,
      scope,
      scheduleReminders: () => scheduling.promise,
      writeWidget,
    });

    lease.release();
    scheduling.resolve();

    await expect(update).resolves.toBe(false);
    expect(writeWidget).not.toHaveBeenCalled();
  });

  it('invalidates an old provider even when the replacement mounts the same scope', async () => {
    const scope = { serverProfileId: 'server-a', databaseId: 'family' };
    const oldLease = activateForegroundNativeSurfaceScope(scope);
    const scheduling = deferred();
    const oldWrite = vi.fn();
    const oldUpdate = updateForegroundNativeSurfaces({
      lease: oldLease,
      scope,
      scheduleReminders: () => scheduling.promise,
      writeWidget: oldWrite,
    });

    oldLease.release();
    const replacementLease = activateForegroundNativeSurfaceScope(scope);
    scheduling.resolve();

    await expect(oldUpdate).resolves.toBe(false);
    expect(oldWrite).not.toHaveBeenCalled();
    replacementLease.release();
  });

  it('serializes an already-started native write ahead of the replacement snapshot', async () => {
    const oldScope = { serverProfileId: 'server-a', databaseId: 'family' };
    const nextScope = { serverProfileId: 'server-b', databaseId: 'family' };
    const oldLease = activateForegroundNativeSurfaceScope(oldScope);
    const nativeWrite = deferred();
    const oldStarted = deferred();
    const committed: string[] = [];
    const oldUpdate = updateForegroundNativeSurfaces({
      lease: oldLease,
      scope: oldScope,
      writeWidget: async () => {
        oldStarted.resolve();
        await nativeWrite.promise;
        committed.push('old');
      },
    });

    // Let the old write enter the serialized native call before switching.
    await oldStarted.promise;
    const nextLease = activateForegroundNativeSurfaceScope(nextScope);
    const nextUpdate = updateForegroundNativeSurfaces({
      lease: nextLease,
      scope: nextScope,
      writeWidget: () => {
        committed.push('next');
      },
    });
    nativeWrite.resolve();

    await Promise.all([oldUpdate, nextUpdate]);
    expect(committed).toEqual(['old', 'next']);
    expect(committed.at(-1)).toBe('next');
    oldLease.release();
    nextLease.release();
  });
});
