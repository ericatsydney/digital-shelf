import { describe, expect, it } from 'vitest';
import { getForestLayout, getHangarFence, getHangarLayout, getHangarSkeleton } from '../src/scene/environmentLayout';

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

  it('tucks the crate stack into the rear-right corner of the bay', () => {
    const { crates, width, rearZ } = getHangarLayout();
    for (const crate of crates) {
      expect(crate.position[0] + crate.size[0] / 2).toBeLessThanOrEqual(width / 2);
      expect(crate.position[0]).toBeGreaterThan(16);
      expect(crate.position[2]).toBeLessThan(rearZ + 8);
      expect(crate.position[2] - crate.size[2] / 2).toBeGreaterThan(rearZ);
    }
  });

  it('frames the walls with an upright bottom bar, a wide corridor deck and three thin posts per wall', () => {
    const bay = getHangarLayout();
    const boxes = getHangarSkeleton();
    const dims = (box: { size: number[] }) => [...box.size].sort((x, y) => x - y);
    const long = (box: { size: number[] }) => dims(box)[2];
    const walls = [
      { name: 'left', boxes: boxes.filter((box) => box.position[0] < -25), depth: (box: { size: number[] }) => box.size[0] },
      { name: 'right', boxes: boxes.filter((box) => box.position[0] > 25), depth: (box: { size: number[] }) => box.size[0] },
      { name: 'back', boxes: boxes.filter((box) => Math.abs(box.position[0]) <= 25 && box.position[2] < bay.rearZ + 6), depth: (box: { size: number[] }) => box.size[2] },
    ];
    for (const wall of walls) {
      const horizontals = wall.boxes.filter((box) => long(box) > bay.height);
      const posts = wall.boxes.filter((box) => box.size[1] === long(box) && long(box) <= bay.height);
      expect(horizontals.length).toBe(2);
      expect(posts).toHaveLength(3);
      const [bottom, deck] = [...horizontals].sort((a, b) => a.position[1] - b.position[1]);
      expect(bottom.position[1] - bay.floorY).toBeLessThan(2); // bottom bar sits on the floor
      expect(bottom.size[1]).toBeGreaterThan(wall.depth(bottom)); // turned upright: taller than it is deep
      expect(deck.position[1]).toBeGreaterThan(bay.floorY + bay.height * 0.35);
      expect(deck.position[1]).toBeLessThan(bay.floorY + bay.height * 0.65);
      expect(wall.depth(deck)).toBeGreaterThanOrEqual(3.5); // wide enough to walk along
      expect(deck.size[1]).toBeLessThanOrEqual(1); // a flat deck
      for (const post of posts) expect(wall.depth(post)).toBeLessThan(1);
    }
    for (const box of boxes) {
      const [first, second] = dims(box);
      expect(second - first).toBeGreaterThanOrEqual(0.4); // never a square cross-section
      expect(first).toBeGreaterThanOrEqual(0.6);
      expect(Math.abs(box.position[0]) + box.size[0] / 2).toBeLessThanOrEqual(bay.width / 2);
      expect(box.position[2] - box.size[2] / 2).toBeGreaterThan(bay.rearZ);
    }
    expect(getHangarSkeleton()).toEqual(boxes);
  });

  it('joins the horizontal bars of the left, back and right walls into one continuous ring at each level', () => {
    const boxes = getHangarSkeleton();
    const horizontals = boxes.filter((box) => Math.max(...box.size) > 29);
    const levels = [...new Set(horizontals.map((box) => box.position[1]))];
    expect(levels).toHaveLength(2);
    for (const y of levels) {
      const ring = horizontals.filter((box) => box.position[1] === y);
      const back = ring.find((box) => Math.abs(box.position[0]) < 1)!;
      const sides = ring.filter((box) => Math.abs(box.position[0]) > 25);
      expect(sides).toHaveLength(2);
      for (const side of sides) {
        expect(back.size[0] / 2).toBeGreaterThanOrEqual(Math.abs(side.position[0]) - side.size[0] / 2 - 1e-6);
        expect(side.position[2] - side.size[2] / 2).toBeLessThanOrEqual(back.position[2] + back.size[2] / 2);
      }
    }
  });

  it('fences the outer edge of the corridor deck on all three walls with two rails and regular posts', () => {
    const bay = getHangarLayout();
    const deck = getHangarSkeleton().filter((box) => Math.max(...box.size) > 29 && box.position[1] > bay.floorY + 5);
    const deckTop = deck[0].position[1] + deck[0].size[1] / 2;
    const fence = getHangarFence();
    const rails = fence.filter((box) => Math.max(...box.size) > 10);
    const posts = fence.filter((box) => Math.max(...box.size) <= 10);
    expect(rails).toHaveLength(6); // top and middle rail on the left, back and right edges
    expect(new Set(rails.map((rail) => rail.position[1])).size).toBe(2);
    for (const rail of rails) {
      expect(rail.position[1]).toBeGreaterThan(deckTop + 0.3);
      expect(rail.position[1]).toBeLessThan(deckTop + 1.6);
      expect(Math.min(...rail.size)).toBeLessThanOrEqual(0.3); // a slim rail
    }
    expect(posts.length).toBeGreaterThanOrEqual(15);
    for (const post of posts) {
      expect(post.size[1]).toBeGreaterThan(0.9);
      expect(post.position[1] - post.size[1] / 2).toBeCloseTo(deckTop, 1); // posts stand on the deck
      expect(Math.abs(post.position[0]) + post.size[0] / 2).toBeLessThanOrEqual(bay.width / 2);
    }
    expect(posts.some((post) => post.position[0] < -20)).toBe(true);
    expect(posts.some((post) => post.position[0] > 20)).toBe(true);
    expect(posts.some((post) => Math.abs(post.position[0]) < 20 && post.position[2] < bay.rearZ + 8)).toBe(true);
    expect(getHangarFence()).toEqual(fence);
  });

  it('lines the ceiling beams up with the vertical bars on both side walls', () => {
    const bay = getHangarLayout();
    const sideZs = getHangarSkeleton()
      .filter((box) => Math.abs(box.position[0]) > 25 && box.size[1] > box.size[0] && box.size[1] > box.size[2] && box.size[1] < bay.height)
      .map((box) => box.position[2]);
    for (const side of [-1, 1]) {
      const zs = getHangarSkeleton()
        .filter((box) => Math.sign(box.position[0]) === side && Math.abs(box.position[0]) > 25 && box.size[1] > box.size[0] && box.size[1] > box.size[2] && box.size[1] < bay.height)
        .map((box) => box.position[2])
        .sort((a, b) => a - b);
      expect([...bay.beamZs].sort((a, b) => a - b)).toEqual(zs);
    }
    expect(sideZs.length).toBe(6);
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
