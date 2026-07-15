import { describe, expect, it } from 'vitest';

import { authSecurityResources } from './authSecurityResources';

function resourceShape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(() => 'string');
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, resourceShape(nested)]),
    );
  }
  return typeof value;
}

function interpolationShape(value: unknown): unknown {
  if (typeof value === 'string') {
    return [...value.matchAll(/{{\s*([^},\s]+)[^}]*}}/g)]
      .map((match) => match[1])
      .sort();
  }
  if (!value || typeof value !== 'object') return [];
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, interpolationShape(nested)]),
  );
}

describe('mobile authentication and security translations', () => {
  it('keeps English and German resource shapes in sync', () => {
    expect(resourceShape(authSecurityResources.de))
      .toEqual(resourceShape(authSecurityResources.en));
  });

  it('keeps interpolation variables aligned between languages', () => {
    expect(interpolationShape(authSecurityResources.de))
      .toEqual(interpolationShape(authSecurityResources.en));
  });
});
