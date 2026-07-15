import { describe, expect, it } from 'vitest';

import { resolveDarkMode } from './themeMode';

describe('resolveDarkMode', () => {
  it('honors explicit light and dark choices', () => {
    expect(resolveDarkMode('light', 'dark')).toBe(false);
    expect(resolveDarkMode('dark', 'light')).toBe(true);
  });

  it('tracks the current device appearance in system mode', () => {
    expect(resolveDarkMode('system', 'dark')).toBe(true);
    expect(resolveDarkMode('system', 'light')).toBe(false);
    expect(resolveDarkMode('system', null)).toBe(false);
  });
});
