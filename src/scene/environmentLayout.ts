export type Position = [number, number, number];
export type ForestTree = { position: Position; height: number; radius: number; layer: number; color: string; canopy: 'round' | 'flat' };
export type EnvironmentBox = { position: Position; size: Position };

/** The vertical bars on both side walls stand at these z positions, and the ceiling beams line up with them. */
export const HANGAR_POST_ZS = [-29, -13, 3] as const;

export function getHangarLayout() {
  return {
    width: 58, height: 29, rearZ: -36, floorY: -1.25,
    beamZs: [...HANGAR_POST_ZS],
    crates: [
      { position: [23.8, 0.75, -31.2], size: [3.6, 4, 3.6] },
      { position: [19.9, 0.75, -31.6], size: [3.6, 4, 3.6] },
      { position: [23.9, 4.25, -31.2], size: [3.2, 3, 3.2] },
    ] as EnvironmentBox[],
  };
}

const DECK = { depth: 4.2, thickness: 0.7 };
const BOTTOM_BAR = { depth: 1.4, thickness: 2.4 };
const WALL_Z_GAP = 0.05;
const SIDE_END_Z = 10.5;

/**
 * Grey steel bars in front of the side and back walls. The bottom bar stands upright (taller than deep) on the floor,
 * the middle bar is a wide flat corridor deck, and three thin flat posts per wall rise to the ceiling beams. The two
 * horizontal levels run as one connected ring around the left, back and right walls.
 */
export function getHangarSkeleton(): EnvironmentBox[] {
  const { width, height, floorY, rearZ } = getHangarLayout();
  const wallZ = rearZ + 0.5 + WALL_Z_GAP;
  const sideLength = SIDE_END_Z - wallZ;
  const sideZ = (wallZ + SIDE_END_Z) / 2;
  const postHeight = 27 - 0.6 - floorY;
  const postDepth = 0.7;
  const postWidth = 1.4;
  const levels = [
    { y: floorY + BOTTOM_BAR.thickness / 2, ...BOTTOM_BAR },
    { y: floorY + height * 0.5, ...DECK },
  ];
  const backPostXs = [-18, 0, 18];
  const sides = [-1, 1].flatMap((side) => [
    ...levels.map(({ y, depth, thickness }) => ({
      position: [side * (width / 2 - depth / 2 - WALL_Z_GAP), y, sideZ],
      size: [depth, thickness, sideLength],
    })),
    ...HANGAR_POST_ZS.map((z) => ({
      position: [side * (width / 2 - postDepth / 2 - WALL_Z_GAP), floorY + postHeight / 2, z],
      size: [postDepth, postHeight, postWidth],
    })),
  ]);
  const back = [
    // Each back bar spans the gap between the two side bars and overlaps their inner faces, closing the ring.
    ...levels.map(({ y, depth, thickness }) => ({
      position: [0, y, wallZ + depth / 2],
      size: [width - 2 * depth + 0.1, thickness, depth],
    })),
    ...backPostXs.map((x) => ({
      position: [x, floorY + postHeight / 2, wallZ + postDepth / 2],
      size: [postWidth, postHeight, postDepth],
    })),
  ];
  return [...sides, ...back] as EnvironmentBox[];
}

/** Two slim rails and regular posts along the outer edge of the corridor deck, on the left, back and right walls. */
export function getHangarFence(): EnvironmentBox[] {
  const { width, height, floorY, rearZ } = getHangarLayout();
  const wallZ = rearZ + 0.5 + WALL_Z_GAP;
  const deckTop = floorY + height * 0.5 + DECK.thickness / 2;
  const inset = 0.15;
  const rail = 0.18;
  const postSize = 0.22;
  const postHeight = 1.1;
  const spacing = 5;
  const leftX = -(width / 2 - WALL_Z_GAP - DECK.depth + inset);
  const backZ = wallZ + DECK.depth - inset;
  const sideStartZ = backZ;
  const sideLength = SIDE_END_Z - sideStartZ;
  const backLength = 2 * Math.abs(leftX);
  const railYs = [deckTop + postHeight, deckTop + postHeight / 2];
  const along = (from: number, length: number) =>
    Array.from({ length: Math.floor(length / spacing) + 1 }, (_, i) => from + i * (length / Math.floor(length / spacing)));
  const rails = [
    ...[-1, 1].flatMap((side) => railYs.map((y) => ({ position: [side * -leftX, y, (sideStartZ + SIDE_END_Z) / 2], size: [rail, rail, sideLength] }))),
    ...railYs.map((y) => ({ position: [0, y, backZ], size: [backLength, rail, rail] })),
  ];
  const posts = [
    ...[-1, 1].flatMap((side) => along(sideStartZ, sideLength).map((z) => ({ position: [side * -leftX, deckTop + postHeight / 2, z], size: [postSize, postHeight, postSize] }))),
    ...along(leftX, backLength).slice(1, -1).map((x) => ({ position: [x, deckTop + postHeight / 2, backZ], size: [postSize, postHeight, postSize] })),
  ];
  return [...rails, ...posts] as EnvironmentBox[];
}

export function getForestLayout() {
  const trees: ForestTree[] = [];
  const greens = ['#4f9a3c', '#5fae45', '#3f8a38'];
  for (let layer = 0; layer < 3; layer++) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        const height = 9 + ((i * 7 + layer * 3) % 9);
        const radius = 3.2 + (i % 3) * 0.6;
        trees.push({
          position: [side * (17 + layer * 9 + (i % 3) * 2), -1.25, 17 - i * 12 - layer * 6],
          height, radius, layer, color: greens[(i + layer) % greens.length], canopy: (i + layer) % 2 ? 'flat' : 'round',
        });
      }
    }
  }
  const rocks: EnvironmentBox[] = [-1, 1].flatMap(side => [-22, -8, 10].map((z, i) => ({
    position: [side * (15 + i * 3), -0.6, z], size: [1.6 + i * 0.4, 1.3 + i * 0.3, 2.2],
  })));
  const horizon: ForestTree[] = Array.from({ length: 26 }, (_, i) => ({
    position: [-78 + i * 6.2 + (i % 3) * 1.5, -1.25, -92 - (i % 2) * 6],
    height: 16 + (i * 5) % 9, radius: 5 + (i % 4) * 0.8, layer: 3,
    color: greens[i % greens.length], canopy: i % 3 ? 'flat' : 'round',
  }));
  return { trees, horizon, rocks, floorY: -1.25 };
}
