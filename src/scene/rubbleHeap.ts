import type { Part } from './Instanced';

/** A cone of debris: `stretch` elongates it along the street (z). */
export type Heap = { center: [number, number]; radius: number; height: number; stretch?: number; seed: number };

/** Chunks grouped by colour so each group is one instanced draw call; `cores` are the faceted bodies the chunks rest on. */
export type RubbleChunks = { cores: Part[]; concrete: Part[]; grey: Part[]; plaster: Part[]; slabs: Part[] };

export const emptyRubble = (): RubbleChunks => ({ cores: [], concrete: [], grey: [], plaster: [], slabs: [] });

export const rubbleChunkCount = (rubble: RubbleChunks) =>
  rubble.cores.length + rubble.concrete.length + rubble.grey.length + rubble.plaster.length + rubble.slabs.length;

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

/** Piles angular concrete, grey block, white plaster and broken slab pieces into a heap that peaks in the middle. */
export function addRubbleHeap(target: RubbleChunks, heap: Heap, groundY: number) {
  const { center: [cx, cz], radius, height, seed } = heap;
  const stretch = heap.stretch ?? 1;
  const random = (offset: number) => seeded(seed * 1013 + offset);

  target.cores.push({
    position: [cx, groundY, cz],
    // Kept just under the chunk surface so it fills gaps without showing as one smooth face.
    scale: [radius * 1.45, height * 1.5, radius * stretch * 1.45],
    rotation: [0, random(1) * Math.PI, 0],
  });

  const count = Math.round(28 + radius * radius * 16);
  for (let chunk = 0; chunk < count; chunk += 1) {
    const r = radius * Math.sqrt(random(chunk * 7 + 2));
    const angle = random(chunk * 7 + 3) * Math.PI * 2;
    const edge = r / radius;
    const surface = height * (1 - edge ** 1.4);
    const size = (0.1 + random(chunk * 7 + 4) ** 2 * 0.5) * (1 - 0.35 * edge);
    const position: Part['position'] = [
      cx + Math.cos(angle) * r,
      groundY + Math.max(0, surface - size * 0.3 * random(chunk * 7 + 5)),
      cz + Math.sin(angle) * r * stretch,
    ];
    const kind = random(chunk * 7 + 6);
    const turn = random(chunk * 7 + 8);
    if (kind > 0.88) {
      target.slabs.push({
        position,
        scale: [size * 2.2, size * 0.25, size * 1.6],
        rotation: [(turn - 0.5) * 1.2, turn * 6, (random(chunk * 7 + 9) - 0.5) * 1.2],
      });
      continue;
    }
    const part: Part = {
      position,
      scale: [size * (0.8 + turn * 0.6), size * (0.55 + random(chunk * 7 + 9) * 0.5), size * (0.8 + random(chunk * 7 + 10) * 0.6)],
      rotation: [turn * 6, random(chunk * 7 + 11) * 6, random(chunk * 7 + 12) * 6],
    };
    if (kind < 0.45) target.concrete.push(part);
    else if (kind < 0.75) target.grey.push(part);
    else target.plaster.push(part);
  }
}
