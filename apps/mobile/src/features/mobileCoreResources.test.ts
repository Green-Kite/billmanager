import { describe, expect, it } from 'vitest';

import { mobileCoreResources } from './mobileCoreResources';

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

function leafValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(leafValues);
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

describe('mobile core translations', () => {
  it('keeps English and German resource shapes in sync', () => {
    expect(resourceShape(mobileCoreResources.de))
      .toEqual(resourceShape(mobileCoreResources.en));
  });

  it('does not leave empty core labels in either language', () => {
    expect(leafValues(mobileCoreResources.en).every((value) => value.trim().length > 0)).toBe(true);
    expect(leafValues(mobileCoreResources.de).every((value) => value.trim().length > 0)).toBe(true);
  });

  it('keeps interpolation variables aligned between languages', () => {
    expect(interpolationShape(mobileCoreResources.de))
      .toEqual(interpolationShape(mobileCoreResources.en));
  });
});
