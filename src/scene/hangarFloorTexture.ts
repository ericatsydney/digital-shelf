import { CanvasTexture, SRGBColorSpace } from 'three';
import { HANGAR_GREYS, greyRgb } from './hangarPalette';

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

export type HangarFloorLayout = {
  columns: number;
  rows: number;
  /** Pixel width of the hairline gap between plates. */
  seamWidth: number;
  /** Pixel size of each plate's cut corners. */
  chamfer: number;
  stains: Array<{ x: number; y: number; radius: number; alpha: number; onSeam: boolean }>;
  rustStreaks: Array<{ x: number; y: number; length: number; width: number }>;
  scuffs: Array<{ x: number; y: number; length: number; angle: number; light: boolean }>;
  specks: Array<{ x: number; y: number; size: number; light: boolean }>;
};

/** Deterministic floor wear in canvas pixels; many small stains cluster along the panel seams, with fine scuffs and specks. */
export function getHangarFloorLayout(width: number, height: number): HangarFloorLayout {
  const columns = 6;
  const rows = 10;
  const stains = Array.from({ length: 180 }, (_, i) => {
    const onSeam = seeded(i * 7 + 1) < 0.6;
    const vertical = seeded(i * 11 + 2) < 0.5;
    let x = seeded(i * 13 + 3) * width;
    let y = seeded(i * 17 + 4) * height;
    if (onSeam && vertical) x = (1 + Math.floor(seeded(i * 19 + 5) * (columns - 1))) * (width / columns) + (seeded(i + 6) - 0.5) * 24;
    if (onSeam && !vertical) y = (1 + Math.floor(seeded(i * 23 + 7) * (rows - 1))) * (height / rows) + (seeded(i + 8) - 0.5) * 24;
    return { x, y, radius: 3 + seeded(i * 29 + 9) * 10, alpha: 0.05 + seeded(i * 31 + 10) * 0.13, onSeam };
  });
  const rustStreaks = Array.from({ length: 16 }, (_, i) => ({
    x: (1 + Math.floor(seeded(i * 37 + 11) * (columns - 1))) * (width / columns) + (seeded(i + 12) - 0.5) * 16,
    y: seeded(i * 41 + 13) * height,
    length: 60 + seeded(i * 43 + 14) * 220,
    width: 6 + seeded(i * 47 + 15) * 12,
  }));
  const scuffs = Array.from({ length: 220 }, (_, i) => ({
    x: seeded(i * 53 + 16) * width,
    y: seeded(i * 59 + 17) * height,
    length: 8 + seeded(i * 61 + 18) * 40,
    angle: seeded(i * 67 + 19) * Math.PI,
    light: seeded(i * 71 + 20) > 0.5,
  }));
  const specks = Array.from({ length: 1000 }, (_, i) => ({
    x: seeded(i * 73 + 21) * width,
    y: seeded(i * 79 + 22) * height,
    size: 1 + seeded(i * 83 + 23) * 2.5,
    light: seeded(i * 89 + 24) > 0.5,
  }));
  return { columns, rows, seamWidth: 1.5, chamfer: 16, stains, rustStreaks, scuffs, specks };
}

let cached: CanvasTexture | null | undefined;

/** Painted once and reused so switching stages never repaints it. */
export function getHangarFloorTexture(): CanvasTexture | null {
  if (cached === undefined) cached = createHangarFloorTexture();
  return cached;
}

/** Grey sci-fi deck plating: chamfered plates with hairline seams, inset bevels and bolts, plus faint stains, scuffs and wear around the platform. */
export function createHangarFloorTexture(canvas: HTMLCanvasElement = document.createElement('canvas')): CanvasTexture | null {
  const width = 1024;
  const height = 1584;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const layout = getHangarFloorLayout(width, height);
  const cellWidth = width / layout.columns;
  const cellHeight = height / layout.rows;

  // Dark base shows through as the hairline seams between plates.
  context.fillStyle = greyRgb(45);
  context.fillRect(0, 0, width, height);

  const { seamWidth, chamfer } = layout;
  const chamferedPlate = (x: number, y: number, w: number, h: number, cut: number) => {
    context.beginPath();
    context.moveTo(x + cut, y);
    context.lineTo(x + w - cut, y);
    context.lineTo(x + w, y + cut);
    context.lineTo(x + w, y + h - cut);
    context.lineTo(x + w - cut, y + h);
    context.lineTo(x + cut, y + h);
    context.lineTo(x, y + h - cut);
    context.lineTo(x, y + cut);
    context.closePath();
  };

  for (let row = 0; row < layout.rows; row += 1) {
    for (let column = 0; column < layout.columns; column += 1) {
      const tone = HANGAR_GREYS.floorTileMin + Math.floor(seeded(row * 17 + column * 5 + 1) * HANGAR_GREYS.floorTileRange);
      const x = column * cellWidth + seamWidth / 2;
      const y = row * cellHeight + seamWidth / 2;
      const w = cellWidth - seamWidth;
      const h = cellHeight - seamWidth;

      chamferedPlate(x, y, w, h, chamfer);
      context.fillStyle = greyRgb(tone);
      context.fill();

      // Bevel: light on the top-left edges, shadow on the bottom-right.
      context.lineWidth = 2;
      context.strokeStyle = greyRgb(tone + 40, 0.5);
      context.beginPath();
      context.moveTo(x + 2, y + h - chamfer);
      context.lineTo(x + 2, y + chamfer);
      context.lineTo(x + chamfer, y + 2);
      context.lineTo(x + w - chamfer, y + 2);
      context.stroke();
      context.strokeStyle = greyRgb(tone - 50, 0.5);
      context.beginPath();
      context.moveTo(x + w - 2, y + chamfer);
      context.lineTo(x + w - 2, y + h - chamfer);
      context.lineTo(x + w - chamfer, y + h - 2);
      context.lineTo(x + chamfer, y + h - 2);
      context.stroke();

      // Inset panel with a recessed centre, alternating with a slotted vent plate.
      const inset = 26;
      chamferedPlate(x + inset, y + inset, w - inset * 2, h - inset * 2, chamfer * 0.6);
      context.fillStyle = greyRgb(tone - 8);
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = greyRgb(tone - 40, 0.7);
      context.stroke();
      if ((row + column) % 2 === 0) {
        context.fillStyle = greyRgb(tone - 34, 0.8);
        for (let slot = -2; slot <= 2; slot += 1) {
          context.fillRect(x + w / 2 - 30, y + h / 2 + slot * 9 - 2, 60, 4);
        }
      }

      // Corner bolts.
      context.fillStyle = greyRgb(tone - 42, 0.9);
      for (const [bx, by] of [[x + 12, y + 12], [x + w - 12, y + 12], [x + 12, y + h - 12], [x + w - 12, y + h - 12]]) {
        context.beginPath();
        context.arc(bx, by, 2.6, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  for (const streak of layout.rustStreaks) {
    const gradient = context.createLinearGradient(0, streak.y, 0, streak.y + streak.length);
    gradient.addColorStop(0, greyRgb(60, 0.15));
    gradient.addColorStop(1, greyRgb(60, 0));
    context.fillStyle = gradient;
    context.fillRect(streak.x - streak.width / 2, streak.y, streak.width, streak.length);
  }

  for (const stain of layout.stains) {
    for (let blob = 0; blob < 3; blob += 1) {
      const dx = (seeded(stain.x + blob * 3) - 0.5) * stain.radius;
      const dy = (seeded(stain.y + blob * 5) - 0.5) * stain.radius;
      const radius = stain.radius * (0.55 + blob * 0.22);
      const gradient = context.createRadialGradient(stain.x + dx, stain.y + dy, 0, stain.x + dx, stain.y + dy, radius);
      gradient.addColorStop(0, greyRgb(28, stain.alpha));
      gradient.addColorStop(1, greyRgb(28, 0));
      context.fillStyle = gradient;
      context.fillRect(stain.x + dx - radius, stain.y + dy - radius, radius * 2, radius * 2);
    }
  }

  for (const speck of layout.specks) {
    context.fillStyle = speck.light ? greyRgb(205, 0.3) : greyRgb(25, 0.35);
    context.fillRect(speck.x, speck.y, speck.size, speck.size);
  }

  context.lineWidth = 1.5;
  for (const scuff of layout.scuffs) {
    context.strokeStyle = scuff.light ? greyRgb(200, 0.3) : greyRgb(40, 0.3);
    context.beginPath();
    context.moveTo(scuff.x, scuff.y);
    context.lineTo(scuff.x + Math.cos(scuff.angle) * scuff.length, scuff.y + Math.sin(scuff.angle) * scuff.length);
    context.stroke();
  }

  const platformY = (47 / 90) * height;
  const wear = context.createRadialGradient(width / 2, platformY, 40, width / 2, platformY, 330);
  wear.addColorStop(0, greyRgb(30, 0.3));
  wear.addColorStop(1, greyRgb(30, 0));
  context.fillStyle = wear;
  context.fillRect(width / 2 - 330, platformY - 330, 660, 660);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
