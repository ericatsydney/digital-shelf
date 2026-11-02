import { describe, expect, it } from 'vitest';
import { HANGAR_GREYS, STEEL_FACE_SHADE, greyRgb, steelFaceColors } from '../src/scene/hangarPalette';

const channels = (rgb: string) => rgb.match(/\d+/g)!.map(Number);
const spread = (rgb: string) => Math.max(...channels(rgb)) - Math.min(...channels(rgb));

describe('hangar grey palette', () => {
  it('builds near-neutral greys: channels stay within a few steps of each other', () => {
    for (const level of [20, 80, 140, 200]) expect(spread(greyRgb(level))).toBeLessThanOrEqual(4);
  });

  it('clamps to the valid colour range', () => {
    expect(channels(greyRgb(-30)).every((value) => value >= 0)).toBe(true);
    expect(channels(greyRgb(400)).every((value) => value <= 255)).toBe(true);
  });

  it('keeps the walls clearly grey, not near-black, with a lighter floor than wall', () => {
    expect(HANGAR_GREYS.wallPanelMin).toBeGreaterThan(55);
    expect(HANGAR_GREYS.floorTileMin).toBeGreaterThan(HANGAR_GREYS.wallPanelMax);
  });

  it('colours the steel a blue-grey that is slightly darker than the floor plates', () => {
    for (const hex of [HANGAR_GREYS.girder, HANGAR_GREYS.beam]) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      expect(Math.min(r, g, b)).toBeGreaterThanOrEqual(90);
      expect(Math.max(r, g, b)).toBeLessThan(HANGAR_GREYS.floorTileMin); // darker than even the darkest floor plate
      expect(b).toBeGreaterThanOrEqual(r);
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(24);
    }
  });

  it('shades steel faces the same on the left and right walls: top brightest, underside darkest', () => {
    const { top, side, front, back, bottom } = STEEL_FACE_SHADE;
    expect(top).toBeGreaterThan(front);
    expect(front).toBeGreaterThan(side);
    expect(side).toBeGreaterThan(back);
    expect(back).toBeGreaterThan(bottom);
    const colors = steelFaceColors();
    expect(colors).toHaveLength(24 * 3); // BoxGeometry: +x, -x, +y, -y, +z, -z, four vertices each
    const faceShade = (face: number) => colors[face * 12];
    expect(faceShade(0)).toBe(faceShade(1)); // the two x faces match, so mirrored bars look identical
    expect(faceShade(2)).toBeCloseTo(top);
    expect(faceShade(3)).toBeCloseTo(bottom);
    expect(faceShade(4)).toBeCloseTo(front);
    expect(faceShade(5)).toBeCloseTo(back);
  });

  it('uses only neutral flat colours for the fallback wall, floor slab and ceiling lights', () => {
    for (const hex of [HANGAR_GREYS.wallFallback, HANGAR_GREYS.floorSlab, HANGAR_GREYS.ceilingLight]) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(8);
    }
  });
});
