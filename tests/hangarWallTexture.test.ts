import { describe, expect, it } from 'vitest';
import { createHangarWallTexture, getHangarWallLayout } from '../src/scene/hangarWallTexture';

describe('hangar wall texture', () => {
  it('lays out a repeatable industrial wall inside the canvas', () => {
    const layout = getHangarWallLayout(3, 1024, 512);
    expect(layout).toEqual(getHangarWallLayout(3, 1024, 512));
    expect(getHangarWallLayout(4, 1024, 512)).not.toEqual(layout);
    expect(layout.panels.length).toBeGreaterThan(60);
    expect(layout.trusses.length).toBeGreaterThanOrEqual(3);
    expect(layout.catwalks.length).toBeGreaterThanOrEqual(2);
    expect(layout.containers.length).toBeGreaterThanOrEqual(3);
    expect(layout.lamps.length).toBeGreaterThanOrEqual(5);
    const inside = (x: number, y: number) => x >= 0 && x <= 1024 && y >= 0 && y <= 512;
    expect(layout.lamps.every((lamp) => inside(lamp.x, lamp.y))).toBe(true);
    expect(layout.catwalks.every((walk) => inside(walk.x, walk.y))).toBe(true);
  });

  it('returns null without a canvas 2D context so the wall keeps its flat colour', () => {
    expect(createHangarWallTexture(1, 2, { getContext: () => null } as unknown as HTMLCanvasElement)).toBeNull();
  });
});
