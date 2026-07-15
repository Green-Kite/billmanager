import { describe, expect, it } from 'vitest';

import { describeAnnualAnalytics, describeCashFlow } from './models';

describe('analytics accessibility summaries', () => {
  it('describes the annual values in one readable sentence', () => {
    const summary = describeAnnualAnalytics({
      locale: 'en-US',
      currency: 'USD',
      annual: { year: 2026, income: 1200, expenses: 900, net: 300, savingsRate: 25 },
    });
    expect(summary).toContain('2026 annual summary');
    expect(summary).toContain('$300.00');
    expect(summary).toContain('25.0 percent');
  });

  it('identifies forecast periods in cash-flow data', () => {
    const summary = describeCashFlow([
      { key: 'jul', label: 'July', openingBalance: 0, income: 100, expenses: 50, endingBalance: 50, forecast: false },
      { key: 'aug', label: 'August', openingBalance: 50, income: 100, expenses: 80, endingBalance: 70, forecast: true },
    ], 'en-US', 'USD');
    expect(summary).toContain('July to August');
    expect(summary).toContain('1 forecast period');
  });
});
