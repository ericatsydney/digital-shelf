import { describe, expect, it } from 'vitest';
import { createWallTexture, getWallDamage } from '../src/scene/wallTexture';

describe('wall texture', () => {
  it('lays out repeatable, irregular damage patches inside the canvas', () => {
    const damage = getWallDamage(3, 4, 512);
    expect(damage).toEqual(getWallDamage(3, 4, 512));
    expect(damage.patches).toHaveLength(4);
    for (const patch of damage.patches) {
      expect(patch.outline.length).toBeGreaterThanOrEqual(7);
      expect(patch.radius).toBeLessThan(512 * 0.14);
      expect(patch.pocks.length).toBeGreaterThan(10);
    }
    expect(damage.streaks.length).toBeGreaterThan(10);
    expect(getWallDamage(4, 4, 512)).not.toEqual(damage);
  });

  it('returns null without a canvas 2D context so the wall keeps its flat colour', () => {
    expect(createWallTexture(1, 3, 1.5, { getContext: () => null } as unknown as HTMLCanvasElement)).toBeNull();
  });
});
