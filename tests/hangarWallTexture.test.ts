import { describe, expect, it } from 'vitest';
import { createHangarWallTexture, getHangarWallLayout } from '../src/scene/hangarWallTexture';

describe('hangar wall texture', () => {
  it('lays out only big flat plates inside the canvas: no stains and no painted bars (the steel is 3D)', () => {
    const layout = getHangarWallLayout(3, 1024, 512);
    expect(layout).toEqual(getHangarWallLayout(3, 1024, 512));
    expect(getHangarWallLayout(4, 1024, 512)).not.toEqual(layout);
    expect(layout.panels.length).toBeGreaterThanOrEqual(6);
    expect(layout.panels.length).toBeLessThanOrEqual(12);
    for (const removed of ['pillars', 'ledges', 'grit', 'grime', 'pipes', 'catwalks', 'containers', 'lamps', 'trusses', 'flange']) {
      expect(layout).not.toHaveProperty(removed);
    }
    expect(layout.panels.every((panel) => panel.x >= 0 && panel.x + panel.width <= 1024 && panel.y >= 0 && panel.y + panel.height <= 512)).toBe(true);
  });

  it('returns null without a canvas 2D context so the wall keeps its flat colour', () => {
    expect(createHangarWallTexture(1, 2, { getContext: () => null } as unknown as HTMLCanvasElement)).toBeNull();
  });
});
