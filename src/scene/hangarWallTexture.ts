import { CanvasTexture, SRGBColorSpace } from 'three';

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

export type HangarWallLayout = {
  panels: Array<{ x: number; y: number; width: number; height: number; shade: number }>;
  trusses: Array<{ x: number; width: number; braces: number }>;
  catwalks: Array<{ x: number; y: number; width: number }>;
  containers: Array<{ x: number; width: number; height: number; shade: number; ribs: number }>;
  lamps: Array<{ x: number; y: number; radius: number }>;
  pipes: Array<{ y: number; thickness: number }>;
};

/** Deterministic layout of the painted wall; all coordinates are canvas pixels. */
export function getHangarWallLayout(seed: number, width: number, height: number): HangarWallLayout {
  const columns = 18;
  const rows = 9;
  const panels = Array.from({ length: columns * rows }, (_, i) => {
    const column = i % columns;
    const row = Math.floor(i / columns);
    return {
      x: (column * width) / columns + 2,
      y: (row * height) / rows + 2,
      width: width / columns - 4,
      height: height / rows - 4,
      shade: seeded(seed * 131 + i),
    };
  });
  const trusses = Array.from({ length: 5 }, (_, i) => ({
    x: width * (0.06 + i * 0.22 + seeded(seed * 3 + i) * 0.04),
    width: width * (0.05 + seeded(seed * 5 + i) * 0.02),
    braces: 9 + Math.floor(seeded(seed * 7 + i) * 5),
  }));
  const catwalks = Array.from({ length: 3 }, (_, i) => ({
    x: width * (0.1 + i * 0.3 + seeded(seed * 11 + i) * 0.06),
    y: height * (0.3 + 0.12 * ((i + seed) % 3)),
    width: width * (0.16 + seeded(seed * 13 + i) * 0.08),
  }));
  const containers = Array.from({ length: 6 }, (_, i) => ({
    x: width * (0.05 + i * 0.16 + seeded(seed * 17 + i) * 0.03),
    width: width * (0.09 + seeded(seed * 19 + i) * 0.03),
    height: height * (0.14 + seeded(seed * 23 + i) * 0.1),
    shade: seeded(seed * 29 + i),
    ribs: 5 + Math.floor(seeded(seed * 31 + i) * 4),
  }));
  const lamps = Array.from({ length: 8 }, (_, i) => ({
    x: width * (0.06 + i * 0.12 + seeded(seed * 37 + i) * 0.03),
    y: height * (0.1 + seeded(seed * 41 + i) * 0.5),
    radius: height * (0.05 + seeded(seed * 43 + i) * 0.04),
  }));
  const pipes = Array.from({ length: 4 }, (_, i) => ({
    y: height * (0.08 + i * 0.2 + seeded(seed * 47 + i) * 0.05),
    thickness: 5 + seeded(seed * 53 + i) * 8,
  }));
  return { panels, trusses, catwalks, containers, lamps, pipes };
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

/** Paints a dark industrial wall; null when no 2D context exists. */
export function createHangarWallTexture(seed: number, aspect: number, canvas: HTMLCanvasElement = document.createElement('canvas')): CanvasTexture | null {
  const width = 1536;
  const height = Math.max(256, Math.round(width / aspect));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const layout = getHangarWallLayout(seed, width, height);

  context.fillStyle = '#1a232c';
  context.fillRect(0, 0, width, height);

  for (const panel of layout.panels) {
    const light = 28 + panel.shade * 26;
    context.fillStyle = `rgb(${light - 4},${light + 4},${light + 12})`;
    context.fillRect(panel.x, panel.y, panel.width, panel.height);
    context.strokeStyle = 'rgba(8,12,16,0.8)';
    context.lineWidth = 2;
    context.strokeRect(panel.x, panel.y, panel.width, panel.height);
    if (panel.shade > 0.55) {
      context.fillStyle = 'rgba(8,12,16,0.55)';
      context.fillRect(panel.x + panel.width * 0.12, panel.y + panel.height * 0.2, panel.width * 0.55, panel.height * 0.18);
      context.fillStyle = 'rgba(120,150,170,0.22)';
      context.fillRect(panel.x + panel.width * 0.12, panel.y + panel.height * 0.62, panel.width * 0.3, 3);
    }
  }

  for (const pipe of layout.pipes) {
    const gradient = context.createLinearGradient(0, pipe.y, 0, pipe.y + pipe.thickness);
    gradient.addColorStop(0, '#59666f');
    gradient.addColorStop(0.5, '#2e3841');
    gradient.addColorStop(1, '#12181d');
    context.fillStyle = gradient;
    context.fillRect(0, pipe.y, width, pipe.thickness);
  }

  for (const truss of layout.trusses) {
    context.fillStyle = 'rgba(6,9,12,0.92)';
    context.fillRect(truss.x, 0, 9, height);
    context.fillRect(truss.x + truss.width, 0, 9, height);
    context.strokeStyle = 'rgba(6,9,12,0.9)';
    context.lineWidth = 5;
    const step = height / truss.braces;
    for (let i = 0; i < truss.braces; i += 1) {
      context.beginPath();
      context.moveTo(truss.x + 9, i * step);
      context.lineTo(truss.x + truss.width, (i + 1) * step);
      context.moveTo(truss.x + truss.width, i * step);
      context.lineTo(truss.x + 9, (i + 1) * step);
      context.stroke();
    }
  }

  for (const walk of layout.catwalks) {
    context.fillStyle = '#3c4852';
    context.fillRect(walk.x, walk.y, walk.width, 10);
    context.fillStyle = '#0d1216';
    context.fillRect(walk.x, walk.y + 10, walk.width, 6);
    context.strokeStyle = '#717f89';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(walk.x, walk.y - 38);
    context.lineTo(walk.x + walk.width, walk.y - 38);
    context.stroke();
    for (let post = 0; post <= walk.width; post += 34) {
      context.beginPath();
      context.moveTo(walk.x + post, walk.y);
      context.lineTo(walk.x + post, walk.y - 38);
      context.stroke();
    }
  }

  for (const container of layout.containers) {
    const top = height - container.height;
    const tone = 60 + container.shade * 40;
    context.fillStyle = `rgb(${tone - 6},${tone + 4},${tone + 12})`;
    context.fillRect(container.x, top, container.width, container.height);
    context.strokeStyle = 'rgba(8,12,16,0.85)';
    context.lineWidth = 4;
    context.strokeRect(container.x, top, container.width, container.height);
    context.lineWidth = 2;
    for (let rib = 1; rib < container.ribs; rib += 1) {
      const x = container.x + (container.width * rib) / container.ribs;
      context.beginPath();
      context.moveTo(x, top + 4);
      context.lineTo(x, height - 4);
      context.stroke();
    }
  }

  for (const lamp of layout.lamps) {
    const glow = context.createRadialGradient(lamp.x, lamp.y, 2, lamp.x, lamp.y, lamp.radius * 4);
    glow.addColorStop(0, 'rgba(190,225,255,0.95)');
    glow.addColorStop(0.18, 'rgba(110,160,230,0.45)');
    glow.addColorStop(1, 'rgba(60,90,150,0)');
    context.fillStyle = glow;
    context.fillRect(lamp.x - lamp.radius * 4, lamp.y - lamp.radius * 4, lamp.radius * 8, lamp.radius * 8);
  }

  const floorFade = context.createLinearGradient(0, height * 0.7, 0, height);
  floorFade.addColorStop(0, 'rgba(10,14,18,0)');
  floorFade.addColorStop(1, 'rgba(10,14,18,0.55)');
  context.fillStyle = floorFade;
  context.fillRect(0, height * 0.7, width, height * 0.3);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
