import { CanvasTexture, SRGBColorSpace } from 'three';

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

export type CrateMarks = {
  scuffs: Array<{ x: number; y: number; length: number; angle: number; light: boolean }>;
  stencil: { x: number; y: number; width: number; height: number };
};

/** Deterministic wear and stencil position in canvas pixels. */
export function getCrateMarks(seed: number, size: number): CrateMarks {
  return {
    scuffs: Array.from({ length: 36 }, (_, i) => ({
      x: seeded(seed * 31 + i) * size,
      y: seeded(seed * 37 + i * 3) * size,
      length: size * (0.04 + seeded(seed * 41 + i) * 0.14),
      angle: seeded(seed * 43 + i) * Math.PI,
      light: seeded(seed * 47 + i) > 0.5,
    })),
    stencil: { x: size * (0.12 + seeded(seed * 53) * 0.2), y: size * (0.58 + seeded(seed * 59) * 0.15), width: size * 0.4, height: size * 0.1 },
  };
}

const cache = new Map<string, CanvasTexture>();

export function getCrateTexture(seed: number, baseColor: string): CanvasTexture | null {
  const key = `${seed}:${baseColor}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const texture = createCrateTexture(seed, baseColor);
  if (texture) cache.set(key, texture);
  return texture;
}

/** Painted crate face: soft panel seams, edge wear, scuffs and a faded stencil; no hard black outlines. */
export function createCrateTexture(seed: number, baseColor: string, canvas: HTMLCanvasElement = document.createElement('canvas')): CanvasTexture | null {
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const marks = getCrateMarks(seed, size);

  context.fillStyle = baseColor;
  context.fillRect(0, 0, size, size);

  for (let plank = 1; plank < 5; plank += 1) {
    context.fillStyle = 'rgba(30,26,18,0.13)';
    context.fillRect(0, (plank * size) / 5 - 1, size, 3);
  }

  const edge = context.createLinearGradient(0, 0, 0, size);
  edge.addColorStop(0, 'rgba(25,20,14,0.28)');
  edge.addColorStop(0.12, 'rgba(25,20,14,0)');
  edge.addColorStop(0.88, 'rgba(25,20,14,0)');
  edge.addColorStop(1, 'rgba(25,20,14,0.36)');
  context.fillStyle = edge;
  context.fillRect(0, 0, size, size);

  context.fillStyle = 'rgba(232,226,205,0.5)';
  context.fillRect(marks.stencil.x, marks.stencil.y, marks.stencil.width, marks.stencil.height);
  context.fillRect(marks.stencil.x, marks.stencil.y + marks.stencil.height * 1.5, marks.stencil.width * 0.6, marks.stencil.height * 0.5);

  context.lineWidth = 1.5;
  for (const scuff of marks.scuffs) {
    context.strokeStyle = scuff.light ? 'rgba(235,228,205,0.3)' : 'rgba(35,30,22,0.25)';
    context.beginPath();
    context.moveTo(scuff.x, scuff.y);
    context.lineTo(scuff.x + Math.cos(scuff.angle) * scuff.length, scuff.y + Math.sin(scuff.angle) * scuff.length);
    context.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
