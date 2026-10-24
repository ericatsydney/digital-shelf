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

  it('gives forest trees round or flat-topped canopies in bright greens', () => {
    const { trees } = getForestLayout();
    expect(new Set(trees.map(tree => tree.canopy))).toEqual(new Set(['round', 'flat']));
    expect(trees.every(tree => /^#[0-9a-f]{6}$/i.test(tree.color))).toBe(true);
    expect(trees.every(tree => tree.color !== '#294936' && tree.color !== '#203e32')).toBe(true);
  });

  it('keeps only a few crates, clear of the platform', () => {
    const { crates } = getHangarLayout();
    expect(crates).toHaveLength(3);
    expect(crates.every((crate) => Math.hypot(crate.position[0], crate.position[2]) - crate.size[0] > 10)).toBe(true);
    const [first, ...others] = crates;
    expect(others.every((crate) => Math.hypot(crate.position[0] - first.position[0], crate.position[2] - first.position[2]) < 6)).toBe(true);
    expect(Math.max(...crates.map((crate) => crate.position[1]))).toBeGreaterThan(Math.min(...crates.map((crate) => crate.position[1])) + 2);
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
