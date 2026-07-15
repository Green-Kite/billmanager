import { describe, expect, it } from 'vitest';

import { adminStatusLabel, canManageRole } from './models';

describe('administration permissions', () => {
  it('keeps owners above administrators and users', () => {
    expect(canManageRole('owner', 'owner')).toBe(true);
    expect(canManageRole('admin', 'user')).toBe(true);
    expect(canManageRole('admin', 'admin')).toBe(false);
    expect(canManageRole('user', 'user')).toBe(false);
  });

  it('describes forced password changes explicitly', () => {
    expect(adminStatusLabel('pending-password-change')).toBe('Password change required');
  });
});
