import { describe, expect, it } from 'vitest';
import { createSkyTexture, getCloudStreaks } from '../src/scene/skyTexture';

describe('sky texture', () => {
  it('lays out a repeatable set of cloud streaks inside the canvas', () => {
    const streaks = getCloudStreaks(1024, 512);
    expect(streaks).toEqual(getCloudStreaks(1024, 512));
    expect(streaks.length).toBeGreaterThan(30);
    expect(streaks.every((s) => s.x >= 0 && s.x <= 1024 && s.y >= 0 && s.y <= 512 && s.width > 0 && s.height > 0)).toBe(true);
  });

  it('returns null without a canvas 2D context so callers can fall back to a flat colour', () => {
    expect(createSkyTexture({ getContext: () => null } as unknown as HTMLCanvasElement)).toBeNull();
  });
});
