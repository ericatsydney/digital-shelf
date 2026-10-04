import { describe, expect, it } from 'vitest';
import { getForestLayout, getHangarLayout } from '../src/scene/environmentLayout';

describe('environment layouts', () => {
  it('keeps the forest repeatable, layered and outside the model clearing', () => {
    const layout = getForestLayout();
    expect(layout).toEqual(getForestLayout());
    expect(layout.trees.length).toBeGreaterThan(20);
    expect(new Set(layout.trees.map(tree => tree.layer)).size).toBe(3);
    expect(layout.trees.every(tree => Math.abs(tree.position[0]) - tree.radius >= 12)).toBe(true);
    expect(layout.rocks.every(rock => Math.abs(rock.position[0]) - rock.size[0] >= 12)).toBe(true);
    expect(Math.min(...layout.trees.map(tree => tree.position[2]))).toBeLessThan(-45);
  });

  it('surrounds the 18 metre model with a spacious, open-front maintenance bay', () => {
    const layout = getHangarLayout();
    expect(layout.width).toBeGreaterThan(48);
    expect(layout.height).toBeGreaterThan(24);
    expect(layout.rearZ).toBeLessThan(-30);
    expect(layout.beamZs.every(z => z < 12)).toBe(true);
    expect(layout.crates.every(crate => Math.abs(crate.position[0]) - crate.size[0] / 2 > 12)).toBe(true);
    expect(layout.floorY).toBe(-1.25);
  });
});
