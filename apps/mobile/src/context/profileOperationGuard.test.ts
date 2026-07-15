import { describe, expect, it } from 'vitest';

import { ProfileOperationGuard } from './profileOperationGuard';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe('ProfileOperationGuard', () => {
  it('rejects a deferred A verification after selection moves to B', async () => {
    const guard = new ProfileOperationGuard('profile-a');
    const response = deferred<string>();
    const verification = guard.begin('verify', 'profile-a');
    const applyVerification = response.promise.then((profileId) => (
      guard.isCurrent(verification, profileId)
    ));

    const selection = guard.begin('switch', 'profile-b');
    response.resolve('profile-a');

    await expect(applyVerification).resolves.toBe(false);
    expect(guard.isCurrent(selection, 'profile-b')).toBe(true);
  });

  it('does not let an older candidate retarget after a newer choice starts', () => {
    const guard = new ProfileOperationGuard('profile-a');
    const candidate = guard.begin('add', null);
    const selection = guard.begin('switch', 'profile-b');

    expect(guard.retarget(candidate, 'profile-c')).toBeNull();
    expect(guard.isCurrent(selection, 'profile-b')).toBe(true);
  });

  it('invalidates captured refresh work when a profile operation begins', () => {
    const guard = new ProfileOperationGuard('profile-a');
    const refresh = guard.capture();

    guard.begin('switch', 'profile-b');

    expect(guard.isCurrent(refresh, 'profile-a')).toBe(false);
  });
});
