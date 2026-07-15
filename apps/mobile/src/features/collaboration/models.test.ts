import { describe, expect, it } from 'vitest';

import { describeSplit } from './models';

describe('sharing split descriptions', () => {
  it('describes equal, percentage, and fixed splits', () => {
    expect(describeSplit('equal', 3)).toBe('Split equally between 3 people');
    expect(describeSplit('percentage', 2, 40)).toBe('40.0 percent share');
    expect(describeSplit('fixed', 2, undefined, 25, 'en-US', 'USD')).toBe('$25.00 fixed share');
  });
});
