import { describe, expect, it } from 'vitest';
import { addRubbleHeap, emptyRubble, rubbleChunkCount } from '../src/scene/rubbleHeap';
import { getCityRubble } from '../src/scene/RuinedCityBackdrop';

const groundY = -1.2;

describe('rubble heap', () => {
  const heap = { center: [6, 2] as [number, number], radius: 2.5, height: 1.6, stretch: 1.5, seed: 3 };
  const rubble = emptyRubble();
  addRubbleHeap(rubble, heap, groundY);
  const chunks = [...rubble.concrete, ...rubble.grey, ...rubble.plaster, ...rubble.slabs];

  it('piles up many angular chunks rather than one smooth lump', () => {
    expect(rubbleChunkCount(rubble)).toBeGreaterThan(80);
    for (const kind of ['concrete', 'grey', 'plaster', 'slabs', 'cores'] as const) {
      expect(rubble[kind].length).toBeGreaterThan(0);
    }
  });

  it('keeps chunks inside the heap footprint and no taller than the heap', () => {
    for (const chunk of chunks) {
      const dx = chunk.position[0] - heap.center[0];
      const dz = (chunk.position[2] - heap.center[1]) / heap.stretch;
      expect(Math.hypot(dx, dz)).toBeLessThanOrEqual(heap.radius + 0.01);
      expect(chunk.position[1]).toBeLessThanOrEqual(groundY + heap.height + 0.01);
      expect(chunk.position[1]).toBeGreaterThanOrEqual(groundY - 0.3);
    }
  });

  it('is highest near the middle and tapers to the edges', () => {
    const inner = chunks.filter((chunk) => Math.hypot(chunk.position[0] - 6, (chunk.position[2] - 2) / 1.5) < 0.8);
    const outer = chunks.filter((chunk) => Math.hypot(chunk.position[0] - 6, (chunk.position[2] - 2) / 1.5) > 2);
    const mean = (list: typeof chunks) => list.reduce((sum, chunk) => sum + chunk.position[1], 0) / list.length;
    expect(mean(inner)).toBeGreaterThan(mean(outer) + 0.4);
  });

  it('is deterministic', () => {
    const again = emptyRubble();
    addRubbleHeap(again, heap, groundY);
    expect(again).toEqual(rubble);
  });
});

describe('city rubble', () => {
  const rubble = getCityRubble();
  const chunks = [...rubble.concrete, ...rubble.grey, ...rubble.plaster, ...rubble.slabs];

  it('spills facade heaps off the pavement into the roadway', () => {
    const roadwayHalf = 19.8 / 2;
    expect(chunks.some((chunk) => Math.abs(chunk.position[0]) < roadwayHalf - 0.5)).toBe(true);
    expect(chunks.some((chunk) => Math.abs(chunk.position[0]) > roadwayHalf + 2)).toBe(true);
  });

  it('stays clear of the hero model standing area', () => {
    for (const chunk of [...chunks, ...rubble.cores]) {
      expect(Math.abs(chunk.position[0]) < 3.5 && Math.abs(chunk.position[2]) < 3.5).toBe(false);
    }
  });

  it('stays within a mobile-friendly instance budget', () => {
    expect(rubbleChunkCount(rubble)).toBeLessThan(7000);
  });
});
