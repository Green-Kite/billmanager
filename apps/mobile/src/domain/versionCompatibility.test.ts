import { describe, expect, it } from 'vitest';

import { compareVersions, requiresMobileUpgrade } from './versionCompatibility';

describe('mobile version compatibility', () => {
  it('compares release versions numerically', () => {
    expect(compareVersions('1.10.0', '1.9.9')).toBe(1);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('v0.9.9', '1.0.0')).toBe(-1);
  });

  it('requires an upgrade only when the advertised minimum is newer', () => {
    expect(requiresMobileUpgrade('1.0.0', '1.0.1')).toBe(true);
    expect(requiresMobileUpgrade('1.0.0', '1.0.0')).toBe(false);
    expect(requiresMobileUpgrade('1.0.0', null)).toBe(false);
  });
});
