import { CanvasTexture, SRGBColorSpace } from 'three';

type Point = { x: number; y: number };
export type WallPatch = { x: number; y: number; radius: number; outline: Point[]; pocks: Array<Point & { r: number }> };
export type WallStreak = { x: number; y: number; width: number; length: number; alpha: number };

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

/** Deterministic wall damage: irregular exposed-brick patches ringed with bullet pocks, plus soot streaks. */
export function getWallDamage(seed: number, patchCount: number, size: number, height = size): { patches: WallPatch[]; streaks: WallStreak[] } {
  const patches = Array.from({ length: patchCount }, (_, patch): WallPatch => {
    const key = seed * 101 + patch * 13;
    const x = size * (0.12 + 0.76 * seeded(key + 1));
    const y = height * (0.12 + 0.6 * seeded(key + 2));
    const radius = size * (0.05 + 0.08 * seeded(key + 3));
    const points = 7 + Math.floor(seeded(key + 4) * 4);
    return {
      x, y, radius,
      outline: Array.from({ length: points }, (_, i) => {
        const angle = (i / points) * Math.PI * 2;
        const reach = radius * (0.55 + 0.7 * seeded(key + 10 + i));
        return { x: x + Math.cos(angle) * reach * 1.15, y: y + Math.sin(angle) * reach * 0.85 };
      }),
      pocks: Array.from({ length: 24 + Math.floor(seeded(key + 5) * 20) }, (_, i) => {
        const angle = seeded(key + 40 + i) * Math.PI * 2;
        const distance = radius * (0.9 + seeded(key + 80 + i) * 1.9);
        return { x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance, r: 1 + seeded(key + 120 + i) * 2.6 };
      }),
    };
  });
  const streaks = Array.from({ length: 22 }, (_, i): WallStreak => ({
    x: size * seeded(seed * 53 + i),
    y: height * 0.55 * seeded(seed * 59 + i),
    width: 5 + seeded(seed * 61 + i) * 14,
    length: height * (0.15 + 0.35 * seeded(seed * 67 + i)),
    alpha: 0.12 + seeded(seed * 71 + i) * 0.22,
  }));
  return { patches, streaks };
}

const cache = new Map<string, CanvasTexture>();

/** Cached per wall so switching stages never repaints; the grime map multiplies the building colour. */
export function getWallTexture(seed: number, patchCount: number, aspect = 1): CanvasTexture | null {
  const key = `${seed}:${patchCount}:${aspect.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const texture = createWallTexture(seed, patchCount, aspect);
  if (texture) cache.set(key, texture);
  return texture;
}

/** Grayscale-ish grime map. Null when no 2D context exists. */
export function createWallTexture(seed: number, patchCount: number, aspect = 1, canvas: HTMLCanvasElement = document.createElement('canvas')): CanvasTexture | null {
  const size = 512;
  const height = Math.min(1024, Math.round(size * aspect));
  canvas.width = size;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.fillStyle = '#cfcac0';
  context.fillRect(0, 0, size, height);
  for (let i = 0; i < 900; i += 1) {
    const shade = seeded(seed * 7 + i) > 0.5 ? '0,0,0' : '255,255,255';
    context.fillStyle = `rgba(${shade},${0.025 + seeded(seed * 11 + i) * 0.05})`;
    context.fillRect(seeded(seed * 3 + i * 1.7) * size, seeded(seed * 5 + i * 2.3) * height, 2 + seeded(i) * 14, 2 + seeded(i + 9) * 10);
  }

  const { patches, streaks } = getWallDamage(seed, patchCount, size, height);
  for (const streak of streaks) {
    const gradient = context.createLinearGradient(0, streak.y, 0, streak.y + streak.length);
    gradient.addColorStop(0, `rgba(25,20,16,${streak.alpha})`);
    gradient.addColorStop(1, 'rgba(25,20,16,0)');
    context.fillStyle = gradient;
    context.fillRect(streak.x, streak.y, streak.width, streak.length);
  }

  for (const patch of patches) {
    const char = context.createRadialGradient(patch.x, patch.y, patch.radius * 0.3, patch.x, patch.y, patch.radius * 2.6);
    char.addColorStop(0, 'rgba(18,14,12,0.55)');
    char.addColorStop(1, 'rgba(18,14,12,0)');
    context.fillStyle = char;
    context.fillRect(patch.x - patch.radius * 3, patch.y - patch.radius * 3, patch.radius * 6, patch.radius * 6);

    context.beginPath();
    patch.outline.forEach((point, i) => (i === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y)));
    context.closePath();
    context.fillStyle = '#8c5f4d';
    context.fill();
    context.strokeStyle = 'rgba(40,28,22,0.45)';
    context.lineWidth = 1;
    for (let row = -3; row <= 3; row += 1) {
      context.beginPath();
      context.moveTo(patch.x - patch.radius * 1.3, patch.y + row * patch.radius * 0.28);
      context.lineTo(patch.x + patch.radius * 1.3, patch.y + row * patch.radius * 0.28);
      context.stroke();
    }
    context.fillStyle = 'rgba(20,16,13,0.6)';
    for (const pock of patch.pocks) {
      context.beginPath();
      context.arc(pock.x, pock.y, pock.r, 0, Math.PI * 2);
      context.fill();
    }
  }

  const grime = context.createLinearGradient(0, height * 0.55, 0, height);
  grime.addColorStop(0, 'rgba(30,24,20,0)');
  grime.addColorStop(1, 'rgba(30,24,20,0.5)');
  context.fillStyle = grime;
  context.fillRect(0, height * 0.55, size, height * 0.45);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
