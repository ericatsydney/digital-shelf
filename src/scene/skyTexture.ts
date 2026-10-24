import { CanvasTexture, SRGBColorSpace } from 'three';

export type CloudStreak = { x: number; y: number; width: number; height: number; alpha: number };

/** Deterministic, wide and flat cloud streaks, denser towards the horizon, like a painted cumulus sky. */
export function getCloudStreaks(width: number, height: number): CloudStreak[] {
  return Array.from({ length: 56 }, (_, i) => {
    const t = i / 55;
    return {
      x: (i * 197) % width,
      y: height * (0.08 + 0.62 * ((i * 61) % 100) / 100) * (0.6 + 0.4 * t),
      width: width * (0.12 + 0.16 * (((i * 37) % 10) / 10)),
      height: height * (0.018 + 0.03 * (((i * 53) % 10) / 10)),
      alpha: 0.35 + 0.4 * (((i * 29) % 10) / 10),
    };
  });
}

/** Paints a teal-to-pale gradient with streaky cloud bands; null when no 2D context exists. */
export function createSkyTexture(canvas: HTMLCanvasElement = document.createElement('canvas')): CanvasTexture | null {
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#2a7fb8');
  gradient.addColorStop(0.5, '#5aaed0');
  gradient.addColorStop(0.78, '#a9d8e4');
  gradient.addColorStop(1, '#d8efe6');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (const streak of getCloudStreaks(canvas.width, canvas.height)) {
    for (const offset of [-canvas.width, 0, canvas.width]) {
      context.save();
      context.translate(streak.x + offset, streak.y);
      context.scale(streak.width, streak.height);
      context.beginPath();
      context.arc(0, 0, 1, 0, Math.PI * 2);
      context.restore();
      context.fillStyle = `rgba(255,255,255,${streak.alpha * 0.55})`;
      context.fill();
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
