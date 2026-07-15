function numericParts(version: string): number[] {
  const normalized = version.trim().replace(/^v/i, '').split(/[+-]/, 1)[0];
  return normalized.split('.').map((part) => {
    const parsed = Number.parseInt(part, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  });
}

export function compareVersions(left: string, right: string): number {
  const leftParts = numericParts(left);
  const rightParts = numericParts(right);
  const length = Math.max(leftParts.length, rightParts.length, 3);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}

export function requiresMobileUpgrade(
  currentVersion: string,
  minimumVersion: string | null | undefined,
): boolean {
  return Boolean(minimumVersion && compareVersions(currentVersion, minimumVersion) < 0);
}
