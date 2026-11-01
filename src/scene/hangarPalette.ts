/** Neutral industrial greys for the Hangar walls and floor (a hint of cool so steel doesn't look flat). */
export function greyRgb(level: number, alpha?: number): string {
  const clamp = (value: number) => Math.min(255, Math.max(0, Math.round(value)));
  const [r, g, b] = [level - 1, level, level + 2].map(clamp);
  return alpha === undefined ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
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
