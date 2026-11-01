import { CanvasTexture, SRGBColorSpace } from 'three';
import { HANGAR_GREYS, greyRgb } from './hangarPalette';

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

export type HangarWallLayout = {
  panels: Array<{ x: number; y: number; width: number; height: number; shade: number }>;
};

/** Deterministic layout of the painted wall; all coordinates are canvas pixels. Only big flat plates, clean (no stains, no painted bars: the steel is 3D). */
export function getHangarWallLayout(seed: number, width: number, height: number): HangarWallLayout {
  const columns = 4;
  const rows = 2;
  const panels = Array.from({ length: columns * rows }, (_, i) => {
    const column = i % columns;
    const row = Math.floor(i / columns);
    return {
      x: (column * width) / columns + 3,
      y: (row * height) / rows + 3,
      width: width / columns - 6,
      height: height / rows - 6,
      shade: seeded(seed * 131 + i),
    };
  });
  return { panels };
}

const cache = new Map<string, CanvasTexture>();

/** Cached per wall so switching stages never repaints. */
export function getHangarWallTexture(seed: number, aspect: number): CanvasTexture | null {
  const key = `${seed}:${aspect.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const texture = createHangarWallTexture(seed, aspect);
  if (texture) cache.set(key, texture);
  return texture;
}

/** Paints a clean grey wall of big plates; null when no 2D context exists. */
export function createHangarWallTexture(seed: number, aspect: number, canvas: HTMLCanvasElement = document.createElement('canvas')): CanvasTexture | null {
  const width = 1536;
  const height = Math.max(256, Math.round(width / aspect));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const layout = getHangarWallLayout(seed, width, height);

  context.fillStyle = greyRgb(HANGAR_GREYS.wallBase);
  context.fillRect(0, 0, width, height);

  for (const panel of layout.panels) {
    const light = HANGAR_GREYS.wallPanelMin + panel.shade * (HANGAR_GREYS.wallPanelMax - HANGAR_GREYS.wallPanelMin);
    context.fillStyle = greyRgb(light);
    context.fillRect(panel.x, panel.y, panel.width, panel.height);
    context.strokeStyle = greyRgb(36, 0.6);
    context.lineWidth = 3;
    context.strokeRect(panel.x, panel.y, panel.width, panel.height);
    // A shallow recessed field inside each plate, lit along its top and left edges.
    const inset = 22;
    context.fillStyle = greyRgb(light - 5);
    context.fillRect(panel.x + inset, panel.y + inset, panel.width - inset * 2, panel.height - inset * 2);
    context.strokeStyle = greyRgb(light + 24, 0.35);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(panel.x + inset, panel.y + panel.height - inset);
    context.lineTo(panel.x + inset, panel.y + inset);
    context.lineTo(panel.x + panel.width - inset, panel.y + inset);
    context.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
