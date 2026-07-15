import { describe, expect, it } from 'vitest';

import {
  inviteAcceptanceSchema,
  passwordSchema,
  registrationSchema,
  usernameSchema,
  validationErrors,
} from './validation';

describe('authentication validation', () => {
  it('matches the server username rules', () => {
    expect(usernameSchema.safeParse('alex_42').success).toBe(true);
    expect(usernameSchema.safeParse('_alex').success).toBe(false);
    expect(usernameSchema.safeParse('ab').success).toBe(false);
  });

  it('requires the server password strength rules', () => {
    expect(passwordSchema.safeParse('Strongpass1').success).toBe(true);
    expect(passwordSchema.safeParse('weakpass').success).toBe(false);
    expect(passwordSchema.safeParse('NOLOWERCASE1').success).toBe(false);
  });

  it('reports confirmation errors on the confirmation field', () => {
    const errors = validationErrors(registrationSchema, {
      username: 'alex',
      email: 'alex@example.com',
      password: 'Strongpass1',
      confirmPassword: 'Strongpass2',
    });

    expect(errors.confirmPassword).toBe('Passwords do not match');
  });

  it('validates invitation credentials with the same rules as registration', () => {
    const result = inviteAcceptanceSchema.safeParse({
      username: 'family_member',
      password: 'Strongpass1',
      confirmPassword: 'Strongpass1',
    });

    expect(result.success).toBe(true);
  });
});
