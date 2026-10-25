import { describe, expect, it } from 'vitest';
import { getForestLayout } from '../src/scene/environmentLayout';
import { existsSync, readFileSync } from 'node:fs';
import { FOREST_GROUND_SIZE, getForestGroundLayout, GROUND_BOUNDS, paintForestGround } from '../src/scene/forestGroundTexture';

const { trees } = getForestLayout();
const W = 1024;
const H = 1152;
const toPixel = (x: number, z: number) => [((x - GROUND_BOUNDS.minX) / (GROUND_BOUNDS.maxX - GROUND_BOUNDS.minX)) * W, ((z - GROUND_BOUNDS.minZ) / (GROUND_BOUNDS.maxZ - GROUND_BOUNDS.minZ)) * H];

describe('forest ground texture', () => {
  it('is deterministic with varied patches inside the canvas', () => {
    const layout = getForestGroundLayout(trees, W, H);
    expect(layout).toEqual(getForestGroundLayout(trees, W, H));
    expect(layout.patches.length).toBeGreaterThan(60);
    expect(new Set(layout.patches.map((patch) => patch.color)).size).toBeGreaterThanOrEqual(4);
    expect(layout.patches.every((patch) => patch.x >= 0 && patch.x <= W && patch.y >= 0 && patch.y <= H)).toBe(true);
  });

  it('casts one soft shadow per tree, displaced away from the light toward -x and -z', () => {
    const layout = getForestGroundLayout(trees, W, H);
    expect(layout.shadows).toHaveLength(trees.length);
    layout.shadows.forEach((shadow, i) => {
      const [baseX, baseY] = toPixel(trees[i].position[0], trees[i].position[2]);
      expect(shadow.x).toBeLessThan(baseX);
      expect(shadow.y).toBeLessThan(baseY);
      expect(shadow.radiusX).toBeGreaterThan(trees[i].radius);
      expect(shadow.alpha).toBeGreaterThan(0.2);
    });
  });

  it('puts leaf-litter rings at every tree base', () => {
    const layout = getForestGroundLayout(trees, W, H);
    expect(layout.litter).toHaveLength(trees.length);
  });

  it('reports failure without a canvas 2D context', () => {
    expect(paintForestGround({ getContext: () => null } as unknown as HTMLCanvasElement)).toBe(false);
  });

  it('ships a baked ground image of the expected size', () => {
    const path = 'public/textures/forest-ground.png';
    expect(existsSync(path)).toBe(true);
    const png = readFileSync(path);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(FOREST_GROUND_SIZE.width);
    expect(png.readUInt32BE(20)).toBe(FOREST_GROUND_SIZE.height);
  });
});
