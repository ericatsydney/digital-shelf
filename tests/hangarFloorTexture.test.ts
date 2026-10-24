import { describe, expect, it } from 'vitest';
import { createHangarFloorTexture, getHangarFloorLayout } from '../src/scene/hangarFloorTexture';

describe('hangar floor texture', () => {
  it('lays out repeatable panels with stains, rust streaks and scuffs inside the canvas', () => {
    const layout = getHangarFloorLayout(1024, 1584);
    expect(layout).toEqual(getHangarFloorLayout(1024, 1584));
    expect(layout.columns).toBeGreaterThanOrEqual(5);
    expect(layout.rows).toBeGreaterThanOrEqual(8);
    expect(layout.stains.length).toBeGreaterThanOrEqual(30);
    expect(layout.rustStreaks.length).toBeGreaterThanOrEqual(10);
    expect(layout.scuffs.length).toBeGreaterThanOrEqual(40);
    const inside = (x: number, y: number) => x >= 0 && x <= 1024 && y >= 0 && y <= 1584;
    expect(layout.stains.every((stain) => inside(stain.x, stain.y))).toBe(true);
    expect(layout.rustStreaks.every((streak) => inside(streak.x, streak.y))).toBe(true);
    const seamStains = layout.stains.filter((stain) => stain.onSeam);
    expect(seamStains.length).toBeGreaterThan(layout.stains.length * 0.3);
  });

  it('returns null without a canvas 2D context so the floor keeps its flat colour', () => {
    expect(createHangarFloorTexture({ getContext: () => null } as unknown as HTMLCanvasElement)).toBeNull();
  });
});
