import { describe, expect, it } from 'vitest';
import { formatLoadingLabel } from '../src/scene/HeroCanvas';

describe('formatLoadingLabel', () => {
  it('falls back to the plain label when progress is zero or unknown', () => {
    expect(formatLoadingLabel(0)).toBe('Loading unit…');
    expect(formatLoadingLabel(Number.NaN)).toBe('Loading unit…');
    expect(formatLoadingLabel(-5)).toBe('Loading unit…');
  });

  it('rounds and clamps the percentage', () => {
    expect(formatLoadingLabel(42.4)).toBe('Loading unit… 42%');
    expect(formatLoadingLabel(99.6)).toBe('Loading unit… 100%');
    expect(formatLoadingLabel(250)).toBe('Loading unit… 100%');
  });
});
