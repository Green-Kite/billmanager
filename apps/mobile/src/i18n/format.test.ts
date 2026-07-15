import { beforeEach, describe, expect, it } from 'vitest';

import {
  configureFormatting,
  formatCurrency,
  formatDate,
  getFormattingConfig,
} from './format';

describe('mobile formatting', () => {
  beforeEach(() => configureFormatting('en-US', 'USD', 'en'));

  it('uses deployment currency without a currency whitelist', () => {
    configureFormatting('en-GB', 'GBP', 'en');
    expect(formatCurrency(12.5)).toContain('12.50');
    expect(getFormattingConfig().currency).toBe('GBP');
  });

  it('combines the UI language with the deployment region', () => {
    configureFormatting('en-US', 'USD', 'de');
    expect(getFormattingConfig().locale).toBe('de-US');
  });

  it('falls back safely for invalid configuration', () => {
    configureFormatting('not-a-locale', 'not-a-currency', 'en');
    expect(getFormattingConfig()).toEqual({
      locale: 'en-US',
      currency: 'USD',
      language: 'en',
    });
  });

  it('formats valid dates and leaves invalid dates blank', () => {
    expect(formatDate('2026-07-15')).toBe('Jul 15');
    expect(formatDate('not-a-date')).toBe('');
  });
});
