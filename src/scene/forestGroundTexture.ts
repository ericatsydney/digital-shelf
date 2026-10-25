import { SRGBColorSpace, TextureLoader, type Texture } from 'three';
import { getForestLayout, type ForestTree } from './environmentLayout';

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

/** World-space rectangle (metres) that the ground texture covers; matches the 160 x 180 ground slab. */
export const GROUND_BOUNDS = { minX: -80, maxX: 80, minZ: -100, maxZ: 80 };

/** Direction the scene's main light travels along the ground, per metre of height (light at [4, 8, 5]). */
const SHADOW_PER_HEIGHT = { x: -4 / 8, z: -5 / 8 };

const PATCH_COLORS = ['#3f6a34', '#4d7a3a', '#7c8a45', '#6b7d3c', '#7a6a4a', '#8a6a3b'];

export type GroundPatch = { x: number; y: number; radius: number; color: string; alpha: number };
export type GroundShadow = { baseX: number; baseY: number; x: number; y: number; radiusX: number; radiusY: number; trunk: number; alpha: number };
export type GroundLitter = { x: number; y: number; radius: number };
export type ForestGroundLayout = { patches: GroundPatch[]; shadows: GroundShadow[]; litter: GroundLitter[] };

function toPixel(x: number, z: number, width: number, height: number): [number, number] {
  return [
    ((x - GROUND_BOUNDS.minX) / (GROUND_BOUNDS.maxX - GROUND_BOUNDS.minX)) * width,
    ((z - GROUND_BOUNDS.minZ) / (GROUND_BOUNDS.maxZ - GROUND_BOUNDS.minZ)) * height,
  ];
}

/** Deterministic colour patches, leaf litter and baked tree shade in canvas pixels. */
export function getForestGroundLayout(trees: ForestTree[], width: number, height: number): ForestGroundLayout {
  const pixelsPerMetre = width / (GROUND_BOUNDS.maxX - GROUND_BOUNDS.minX);
  const patches: GroundPatch[] = Array.from({ length: 180 }, (_, i) => ({
    x: seeded(i * 7 + 1) * width,
    y: seeded(i * 11 + 2) * height,
    radius: (3 + seeded(i * 13 + 3) * 12) * pixelsPerMetre,
    color: PATCH_COLORS[Math.floor(seeded(i * 17 + 4) * PATCH_COLORS.length)],
    alpha: 0.22 + seeded(i * 19 + 5) * 0.28,
  }));
  const shadows = trees.map((tree) => {
    const [baseX, baseY] = toPixel(tree.position[0], tree.position[2], width, height);
    const canopyHeight = tree.height * 0.78;
    return {
      baseX,
      baseY,
      x: baseX + SHADOW_PER_HEIGHT.x * canopyHeight * pixelsPerMetre,
      y: baseY + SHADOW_PER_HEIGHT.z * canopyHeight * pixelsPerMetre,
      radiusX: tree.radius * 1.35 * pixelsPerMetre,
      radiusY: tree.radius * 1.15 * pixelsPerMetre,
      trunk: 0.9 * pixelsPerMetre,
      alpha: tree.layer === 3 ? 0.3 : 0.5,
    };
  });
  const litter = trees.map((tree) => {
    const [x, y] = toPixel(tree.position[0], tree.position[2], width, height);
    return { x, y, radius: (2.5 + tree.radius * 0.5) * pixelsPerMetre };
  });
  return { patches, shadows, litter };
}

/** Size of the baked ground image; 160 x 180 m of ground at 6.4 px per metre. */
export const FOREST_GROUND_SIZE = { width: 1024, height: 1152 };
export const FOREST_GROUND_URL = '/textures/forest-ground.png';

let pending: Promise<Texture | null> | undefined;

/** Loads the baked ground image once; resolves null if it is missing so the ground keeps its flat colour. */
export function loadForestGroundTexture(): Promise<Texture | null> {
  pending ??= new TextureLoader().loadAsync(FOREST_GROUND_URL).then((texture) => {
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }).catch(() => null);
  return pending;
}

function softBlob(context: CanvasRenderingContext2D, x: number, y: number, radiusX: number, radiusY: number, rgb: string, alpha: number) {
  context.save();
  context.translate(x, y);
  context.scale(1, radiusY / radiusX);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radiusX);
  gradient.addColorStop(0, `rgba(${rgb},${alpha})`);
  gradient.addColorStop(0.55, `rgba(${rgb},${alpha * 0.6})`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  context.fillStyle = gradient;
  context.fillRect(-radiusX, -radiusX, radiusX * 2, radiusX * 2);
  context.restore();
}

const hexToRgb = (hex: string) => `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;

/**
 * Paints the muted earthy forest floor (mossy and dry patches, bare earth, leaf litter at tree bases, grain,
 * soft tree shade) onto a canvas. Run by `npm run ground:generate` to bake `public/textures/forest-ground.png`;
 * the app itself never paints it. Returns false without a 2D context.
 */
export function paintForestGround(canvas: HTMLCanvasElement): boolean {
  const { width, height } = FOREST_GROUND_SIZE;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return false;
  const { trees, horizon } = getForestLayout();
  const layout = getForestGroundLayout([...trees, ...horizon], width, height);

  context.fillStyle = '#58783a';
  context.fillRect(0, 0, width, height);

  for (const patch of layout.patches) softBlob(context, patch.x, patch.y, patch.radius, patch.radius * 0.8, hexToRgb(patch.color), patch.alpha);
  for (const ring of layout.litter) {
    softBlob(context, ring.x, ring.y, ring.radius, ring.radius, '112,86,52', 0.55);
    softBlob(context, ring.x, ring.y, ring.radius * 0.55, ring.radius * 0.55, '78,58,36', 0.5);
  }

  for (let i = 0; i < 3000; i += 1) {
    const light = seeded(i * 3 + 1) > 0.5;
    context.fillStyle = light ? `rgba(150,170,90,${0.12 + seeded(i + 2) * 0.15})` : `rgba(32,52,28,${0.12 + seeded(i + 3) * 0.15})`;
    const size = 1.5 + seeded(i * 5 + 4) * 3;
    context.fillRect(seeded(i * 7 + 5) * width, seeded(i * 11 + 6) * height, size, size * (0.5 + seeded(i + 7)));
  }

  context.filter = 'blur(4px)';
  for (const shadow of layout.shadows) {
    context.strokeStyle = `rgba(14,26,14,${shadow.alpha * 0.45})`;
    context.lineWidth = shadow.trunk;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(shadow.baseX, shadow.baseY);
    context.lineTo(shadow.x, shadow.y);
    context.stroke();
  }
  context.filter = 'none';
  for (const shadow of layout.shadows) softBlob(context, shadow.x, shadow.y, shadow.radiusX, shadow.radiusY, '12,24,14', shadow.alpha);

  return true;
}
