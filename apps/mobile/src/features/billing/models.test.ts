import { describe, expect, it } from 'vitest';

import { planPriceLabel, subscriptionStateLabel, usagePercent } from './models';

describe('billing presentation models', () => {
  it('bounds usage percentages and leaves unlimited usage unbounded', () => {
    expect(usagePercent({ used: 12, limit: 10 })).toBe(100);
    expect(usagePercent({ used: 2, limit: 10 })).toBe(20);
    expect(usagePercent({ used: 50, limit: null })).toBeNull();
  });

  it('formats plan and deployment states', () => {
    expect(planPriceLabel({ amount: 9, currency: 'USD', interval: 'month' })).toBe('$9.00/month');
    expect(subscriptionStateLabel('unlimited')).toBe('Self-hosted unlimited');
  });
});
