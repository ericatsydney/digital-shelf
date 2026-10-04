export type Position = [number, number, number];
export type ForestTree = { position: Position; height: number; radius: number; layer: number; color: string };
export type EnvironmentBox = { position: Position; size: Position };

export function getHangarLayout() {
  return {
    width: 58, height: 29, rearZ: -36, floorY: -1.25,
    beamZs: [-32, -18, -4, 10],
    crates: [-1, 1].flatMap(side => [-27, -18, 7].map((z, i): EnvironmentBox => ({
      position: [side * (20 + i * 1.4), 0.75, z], size: [3.6, 4, 3.6],
    }))),
  };
}

export function getForestLayout() {
  const trees: ForestTree[] = [];
  const greens = ['#294936', '#365940', '#203e32'];
  for (let layer = 0; layer < 3; layer++) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        const height = 18 + ((i * 7 + layer * 3) % 13);
        const radius = 3.6 + (i % 3) * 0.7;
        trees.push({
          position: [side * (17 + layer * 9 + (i % 3) * 2), -1.25, 17 - i * 12 - layer * 6],
          height, radius, layer, color: greens[(i + layer) % greens.length],
        });
      }
    }
  }
  const rocks: EnvironmentBox[] = [-1, 1].flatMap(side => [-22, -8, 10].map((z, i) => ({
    position: [side * (15 + i * 3), -0.6, z], size: [1.6 + i * 0.4, 1.3 + i * 0.3, 2.2],
  })));
  return { trees, rocks, floorY: -1.25 };
}
