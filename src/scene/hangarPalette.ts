/** Neutral industrial greys for the Hangar walls and floor (a hint of cool so steel doesn't look flat). */
export function greyRgb(level: number, alpha?: number): string {
  const clamp = (value: number) => Math.min(255, Math.max(0, Math.round(value)));
  const [r, g, b] = [level - 1, level, level + 2].map(clamp);
  return alpha === undefined ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Brightness of each face of a steel bar, as if lit by the ceiling strips: tops catch the light, undersides are dark,
 * and both side faces match so the left and right walls look identical.
 */
export const STEEL_FACE_SHADE = { top: 1.3, front: 1, side: 0.82, back: 0.7, bottom: 0.5 };

/** Per-vertex greys for a BoxGeometry (faces +x, -x, +y, -y, +z, -z; four vertices each). */
export function steelFaceColors(): Float32Array {
  const { top, front, side, back, bottom } = STEEL_FACE_SHADE;
  return Float32Array.from([side, side, top, bottom, front, back].flatMap((shade) => Array<number>(12).fill(shade)));
}

export const HANGAR_GREYS = {
  wallFallback: '#4a4d50',
  wallBase: 56,
  wallPanelMin: 62,
  wallPanelMax: 78,
  floorSlab: '#85888a',
  floorTileMin: 128,
  floorTileRange: 22,
  girder: '#606a70',
  /** Emissive that cancels the Hangar's warm lamps so lit steel still reads grey, not tan. */
  coolFill: '#2c353d',
  beam: '#5c666c',
  ceilingLight: '#e9ebec',
};
