import { CanvasTexture, SRGBColorSpace } from 'three';

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

export type HangarFloorLayout = {
  columns: number;
  rows: number;
  stains: Array<{ x: number; y: number; radius: number; alpha: number; onSeam: boolean }>;
  rustStreaks: Array<{ x: number; y: number; length: number; width: number }>;
  scuffs: Array<{ x: number; y: number; length: number; angle: number; light: boolean }>;
};

/** Deterministic floor wear in canvas pixels; stains cluster along the panel seams. */
export function getHangarFloorLayout(width: number, height: number): HangarFloorLayout {
  const columns = 6;
  const rows = 10;
  const stains = Array.from({ length: 48 }, (_, i) => {
    const onSeam = seeded(i * 7 + 1) < 0.6;
    const vertical = seeded(i * 11 + 2) < 0.5;
    let x = seeded(i * 13 + 3) * width;
    let y = seeded(i * 17 + 4) * height;
    if (onSeam && vertical) x = (1 + Math.floor(seeded(i * 19 + 5) * (columns - 1))) * (width / columns) + (seeded(i + 6) - 0.5) * 24;
    if (onSeam && !vertical) y = (1 + Math.floor(seeded(i * 23 + 7) * (rows - 1))) * (height / rows) + (seeded(i + 8) - 0.5) * 24;
    return { x, y, radius: 18 + seeded(i * 29 + 9) * 70, alpha: 0.18 + seeded(i * 31 + 10) * 0.3, onSeam };
  });
  const rustStreaks = Array.from({ length: 16 }, (_, i) => ({
    x: (1 + Math.floor(seeded(i * 37 + 11) * (columns - 1))) * (width / columns) + (seeded(i + 12) - 0.5) * 16,
    y: seeded(i * 41 + 13) * height,
    length: 60 + seeded(i * 43 + 14) * 220,
    width: 6 + seeded(i * 47 + 15) * 12,
  }));
  const scuffs = Array.from({ length: 64 }, (_, i) => ({
    x: seeded(i * 53 + 16) * width,
    y: seeded(i * 59 + 17) * height,
    length: 20 + seeded(i * 61 + 18) * 90,
    angle: seeded(i * 67 + 19) * Math.PI,
    light: seeded(i * 71 + 20) > 0.5,
  }));
  return { columns, rows, stains, rustStreaks, scuffs };
}

let cached: CanvasTexture | null | undefined;

/** Painted once and reused so switching stages never repaints it. */
export function getHangarFloorTexture(): CanvasTexture | null {
  if (cached === undefined) cached = createHangarFloorTexture();
  return cached;
}

/** Light concrete-and-steel floor with grimy panel edges, oil stains, rust streaks and wear around the platform. */
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

  for (let row = 0; row < layout.rows; row += 1) {
    for (let column = 0; column < layout.columns; column += 1) {
      const tone = 150 + Math.floor(seeded(row * 17 + column * 5 + 1) * 22);
      context.fillStyle = `rgb(${tone + 6},${tone},${tone - 8})`;
      context.fillRect(column * cellWidth, row * cellHeight, cellWidth, cellHeight);

      const edge = 26;
      const x = column * cellWidth;
      const y = row * cellHeight;
      const sides: Array<[number, number, number, number, number, number, number, number]> = [
        [x, y, x, y + edge, x, y, cellWidth, edge],
        [x, y + cellHeight, x, y + cellHeight - edge, x, y + cellHeight - edge, cellWidth, edge],
        [x, y, x + edge, y, x, y, edge, cellHeight],
        [x + cellWidth, y, x + cellWidth - edge, y, x + cellWidth - edge, y, edge, cellHeight],
      ];
      for (const [gx0, gy0, gx1, gy1, rx, ry, rw, rh] of sides) {
        const gradient = context.createLinearGradient(gx0, gy0, gx1, gy1);
        gradient.addColorStop(0, 'rgba(45,38,30,0.5)');
        gradient.addColorStop(1, 'rgba(45,38,30,0)');
        context.fillStyle = gradient;
        context.fillRect(rx, ry, rw, rh);
      }
    }
  }

  context.lineWidth = 3;
  context.strokeStyle = 'rgba(34,29,24,0.7)';
  for (let column = 1; column < layout.columns; column += 1) {
    context.beginPath();
    context.moveTo(column * cellWidth, 0);
    context.lineTo(column * cellWidth, height);
    context.stroke();
  }
  for (let row = 1; row < layout.rows; row += 1) {
    context.beginPath();
    context.moveTo(0, row * cellHeight);
    context.lineTo(width, row * cellHeight);
    context.stroke();
  }

  for (const streak of layout.rustStreaks) {
    const gradient = context.createLinearGradient(0, streak.y, 0, streak.y + streak.length);
    gradient.addColorStop(0, 'rgba(128,74,40,0.4)');
    gradient.addColorStop(1, 'rgba(128,74,40,0)');
    context.fillStyle = gradient;
    context.fillRect(streak.x - streak.width / 2, streak.y, streak.width, streak.length);
  }

  for (const stain of layout.stains) {
    for (let blob = 0; blob < 3; blob += 1) {
      const dx = (seeded(stain.x + blob * 3) - 0.5) * stain.radius;
      const dy = (seeded(stain.y + blob * 5) - 0.5) * stain.radius;
      const radius = stain.radius * (0.55 + blob * 0.22);
      const gradient = context.createRadialGradient(stain.x + dx, stain.y + dy, 0, stain.x + dx, stain.y + dy, radius);
      gradient.addColorStop(0, `rgba(28,23,19,${stain.alpha})`);
      gradient.addColorStop(1, 'rgba(28,23,19,0)');
      context.fillStyle = gradient;
      context.fillRect(stain.x + dx - radius, stain.y + dy - radius, radius * 2, radius * 2);
    }
  }

  context.lineWidth = 2;
  for (const scuff of layout.scuffs) {
    context.strokeStyle = scuff.light ? 'rgba(225,218,205,0.35)' : 'rgba(40,34,28,0.3)';
    context.beginPath();
    context.moveTo(scuff.x, scuff.y);
    context.lineTo(scuff.x + Math.cos(scuff.angle) * scuff.length, scuff.y + Math.sin(scuff.angle) * scuff.length);
    context.stroke();
  }

  const platformY = (47 / 90) * height;
  const wear = context.createRadialGradient(width / 2, platformY, 40, width / 2, platformY, 330);
  wear.addColorStop(0, 'rgba(30,25,20,0.5)');
  wear.addColorStop(1, 'rgba(30,25,20,0)');
  context.fillStyle = wear;
  context.fillRect(width / 2 - 330, platformY - 330, 660, 660);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
