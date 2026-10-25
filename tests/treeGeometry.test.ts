import { describe, expect, it } from 'vitest';
import { getForestLayout } from '../src/scene/environmentLayout';
import { buildTreeGeometry } from '../src/scene/treeGeometry';

const { trees, horizon } = getForestLayout();

describe('buildTreeGeometry', () => {
  it('is deterministic per tree', () => {
    const a = buildTreeGeometry(trees[3]).getAttribute('position');
    const b = buildTreeGeometry(trees[3]).getAttribute('position');
    expect(Array.from(a.array)).toEqual(Array.from(b.array));
  });

  it('carries colour, leaf and phase attributes of equal length', () => {
    const geometry = buildTreeGeometry(trees[0]);
    const count = geometry.getAttribute('position').count;
    for (const name of ['color', 'aLeaf', 'aPhase']) expect(geometry.getAttribute(name).count).toBe(count);
  });

  it('stands on y = 0, stays within the tree height, and has trunk and leaf vertices', () => {
    for (const tree of [...trees, ...horizon]) {
      const geometry = buildTreeGeometry(tree);
      geometry.computeBoundingBox();
      expect(geometry.boundingBox!.min.y).toBeGreaterThanOrEqual(-0.01);
      expect(geometry.boundingBox!.max.y).toBeLessThanOrEqual(tree.height * 1.3);
      const leaf = Array.from(geometry.getAttribute('aLeaf').array);
      expect(leaf).toContain(0);
      expect(leaf).toContain(1);
    }
  });

  it('builds clustered canopies, not a single blob, and varies colour', () => {
    const geometry = buildTreeGeometry(trees[0]);
    expect(geometry.getAttribute('position').count).toBeGreaterThan(1000);
    const colors = new Set<string>();
    const color = geometry.getAttribute('color');
    for (let i = 0; i < color.count; i += 7) colors.add(`${color.getX(i).toFixed(2)},${color.getY(i).toFixed(2)}`);
    expect(colors.size).toBeGreaterThan(4);
  });
});
