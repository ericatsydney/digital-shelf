export type Position = [number, number, number];
export type ForestTree = { position: Position; height: number; radius: number; layer: number; color: string; canopy: 'round' | 'flat' };
export type EnvironmentBox = { position: Position; size: Position };

export function getHangarLayout() {
  return {
    width: 58, height: 29, rearZ: -36, floorY: -1.25,
    beamZs: [-32, -18, -4, 10],
    crates: [
      { position: [15.5, 0.75, -3], size: [3.6, 4, 3.6] },
      { position: [19.4, 0.75, -3.4], size: [3.6, 4, 3.6] },
      { position: [15.6, 4.25, -3], size: [3.2, 3, 3.2] },
    ] as EnvironmentBox[],
  };
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
