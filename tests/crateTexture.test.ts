import { describe, expect, it } from 'vitest';
import { createCrateTexture, getCrateMarks } from '../src/scene/crateTexture';

describe('crate texture', () => {
  it('lays out repeatable scuffs and stencil marks inside the canvas', () => {
    const marks = getCrateMarks(2, 256);
    expect(marks).toEqual(getCrateMarks(2, 256));
    expect(getCrateMarks(3, 256)).not.toEqual(marks);
    expect(marks.scuffs.length).toBeGreaterThan(20);
    expect(marks.scuffs.every((scuff) => scuff.x >= 0 && scuff.x <= 256 && scuff.y >= 0 && scuff.y <= 256)).toBe(true);
  });

  it('returns null without a canvas 2D context so the crate keeps its flat colour', () => {
    expect(createCrateTexture(1, '#7a7d58', { getContext: () => null } as unknown as HTMLCanvasElement)).toBeNull();
  });
});
