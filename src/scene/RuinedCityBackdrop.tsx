import { useMemo } from 'react';
import { getCityFireSpots } from './cityFire';
import { getStreetDebris, StreetProps, streetRubbleGroundY } from './CityStreetProps';
import { addRubbleHeap, emptyRubble, type Heap, type RubbleChunks } from './rubbleHeap';
import { EmberGlow } from './EmberGlow';
import { Fire } from './Fire';
import { Instanced, type Part, type Vec3 } from './Instanced';
import { getWallTexture } from './wallTexture';

export type Building = {
  side: -1 | 1;
  position: Vec3;
  size: Vec3;
  color: string;
  roof: 'flat' | 'broken';
  windowRows: number;
  windowColumns: number;
  balconies: number;
  shellHoles: number;
  cornerCut: boolean;
  /** Part of the street wall blown away (fractions along the facade, from a window row up), exposing the concrete frame. */
  facadeLoss?: { zStart: number; zEnd: number; fromRow: number };
};

const streetBaseY = -1.08;
const streetLength = 60;
const sidewalkWidth = 2.4;
const roadwayWidth = 19.8;
const centerDividerWidth = 1;

export function getRuinedCityStreetDimensions() {
  return {
    laneCount: 6,
    laneWidth: 3.3,
    roadwayWidth,
    sidewalkWidth,
    centerDividerWidth,
    roadLength: streetLength,
  } as const;
}

/** Floors are window rows; a building is never taller than five of them. */
export const maxBuildingFloors = 5;
const floorHeight = 3.3;
const groundStoreyAndParapet = 4;

type BuildingSpec = Omit<Building, 'position' | 'size'> & { z: number; width: number; depth: number };

const ruinedCityBuildingSpecs: BuildingSpec[] = [
  { side: -1, z: -22, width: 14, depth: 16, color: '#948a79', roof: 'flat', windowRows: 5, windowColumns: 4, balconies: 2, shellHoles: 3, cornerCut: false },
  { side: -1, z: -7, width: 12, depth: 12, color: '#8a8172', roof: 'broken', windowRows: 4, windowColumns: 3, balconies: 0, shellHoles: 4, cornerCut: true, facadeLoss: { zStart: 0.1, zEnd: 0.75, fromRow: 0 } },
  { side: -1, z: 9, width: 16, depth: 18, color: '#9a8f7b', roof: 'flat', windowRows: 5, windowColumns: 5, balconies: 3, shellHoles: 2, cornerCut: false },
  { side: -1, z: 24, width: 18, depth: 16, color: '#857b6c', roof: 'flat', windowRows: 4, windowColumns: 5, balconies: 2, shellHoles: 3, cornerCut: true, facadeLoss: { zStart: 0.35, zEnd: 0.95, fromRow: 1 } },
  { side: 1, z: -20, width: 16, depth: 15, color: '#8f8472', roof: 'broken', windowRows: 4, windowColumns: 4, balconies: 1, shellHoles: 3, cornerCut: true },
  { side: 1, z: -5, width: 18, depth: 14, color: '#887e6e', roof: 'flat', windowRows: 5, windowColumns: 5, balconies: 3, shellHoles: 2, cornerCut: false, facadeLoss: { zStart: 0.05, zEnd: 0.6, fromRow: 2 } },
  { side: 1, z: 11, width: 12, depth: 16, color: '#968b78', roof: 'flat', windowRows: 3, windowColumns: 3, balconies: 1, shellHoles: 4, cornerCut: false },
  { side: 1, z: 25, width: 15, depth: 18, color: '#827868', roof: 'broken', windowRows: 5, windowColumns: 4, balconies: 2, shellHoles: 3, cornerCut: true, facadeLoss: { zStart: 0.2, zEnd: 0.7, fromRow: 1 } },
];

export function getRuinedCityBuildings(): Building[] {
  return ruinedCityBuildingSpecs.map(({ z, width, depth, ...rest }) => {
    const height = groundStoreyAndParapet + Math.min(rest.windowRows, maxBuildingFloors) * floorHeight;
    return {
      ...rest,
      windowRows: Math.min(rest.windowRows, maxBuildingFloors),
      position: [
        rest.side * (roadwayWidth / 2 + sidewalkWidth + 1.2 + width / 2),
        streetBaseY + height / 2,
        z,
      ],
      size: [width, height, depth],
    };
  });
}

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const QUARTER_TURN = Math.PI / 2;

type FacadeParts = {
  windows: Part[]; arches: Part[]; sills: Part[]; slabs: Part[];
  balconySlabs: Part[]; rails: Part[]; roofs: Part[]; chimneys: Part[]; cornice: Part[];
  holes: Part[]; hangingSlabs: Part[]; columns: Part[]; brickPatches: Part[];
  voids: Part[]; frameSlabs: Part[]; frameColumns: Part[]; partitions: Part[]; ragged: Part[];
};

export type FacadeLossRegion = { z0: number; z1: number; y0: number; y1: number; floorYs: number[] };

/** Floor level under window row `row`, matching how windows are spaced up the facade. */
const floorLevel = (building: Building, row: number) =>
  streetBaseY + 3 + ((building.size[1] - 4) * row) / building.windowRows - 0.9;

/** Where the facade is missing, in world space; null for an intact building. */
export function getFacadeLossRegion(building: Building): FacadeLossRegion | null {
  if (!building.facadeLoss) return null;
  const { zStart, zEnd, fromRow } = building.facadeLoss;
  const usableDepth = building.size[2] - 3;
  const bz = building.position[2];
  const floorYs = Array.from({ length: building.windowRows - fromRow + 1 }, (_, step) => floorLevel(building, fromRow + step));
  return {
    z0: bz - usableDepth / 2 + zStart * usableDepth,
    z1: bz - usableDepth / 2 + zEnd * usableDepth,
    y0: floorYs[0],
    y1: streetBaseY + building.size[1],
    floorYs,
  };
}

/** Deterministic facade parts in world space, placed on the road-facing wall of a building. */
export function getFacadeParts(building: Building, index: number): FacadeParts {
  const [width, height, depth] = building.size;
  const [bx, , bz] = building.position;
  const toRoad = -building.side;
  const faceX = bx + toRoad * (width / 2);
  const baseY = streetBaseY;
  const parts: FacadeParts = {
    windows: [], arches: [], sills: [], slabs: [],
    balconySlabs: [], rails: [], roofs: [], chimneys: [], cornice: [],
    holes: [], hangingSlabs: [], columns: [], brickPatches: [],
    voids: [], frameSlabs: [], frameColumns: [], partitions: [], ragged: [],
  };

  const usableHeight = height - 4;
  const usableDepth = depth - 3;
  for (let row = 0; row < building.windowRows; row += 1) {
    for (let column = 0; column < building.windowColumns; column += 1) {
      const y = baseY + 3 + (usableHeight * (row + 0.5)) / building.windowRows;
      const z = bz - usableDepth / 2 + (usableDepth * (column + 0.5)) / building.windowColumns;
      if (seeded(index * 97 + row * 7 + column) > 0.9) continue; // a few bricked-up bays
      parts.windows.push({ position: [faceX + toRoad * 0.02, y, z], scale: [0.14, 1.5, 1.05] });
      parts.arches.push({ position: [faceX + toRoad * 0.02, y + 0.75, z], scale: [1.05, 0.14, 1.05], rotation: [0, 0, QUARTER_TURN] });
      parts.sills.push({ position: [faceX + toRoad * 0.12, y - 0.85, z], scale: [0.3, 0.14, 1.4] });
    }
  }

  for (let balcony = 0; balcony < building.balconies; balcony += 1) {
    const row = 1 + ((balcony * 2 + index) % Math.max(1, building.windowRows - 1));
    const y = baseY + 3 + (usableHeight * row) / building.windowRows;
    const z = bz - usableDepth / 2 + usableDepth * ((balcony + 0.5) / building.balconies);
    parts.balconySlabs.push({ position: [faceX + toRoad * 0.6, y, z], scale: [1.2, 0.2, 2.8] });
    parts.rails.push({ position: [faceX + toRoad * 1.12, y + 0.5, z], scale: [0.08, 0.9, 2.8] });
  }

  parts.cornice.push({ position: [bx, baseY + height + 0.15, bz], scale: [width + 0.5, 0.3, depth + 0.5] });

  if (building.roof === 'flat') {
    if (index % 2 === 0) {
      parts.chimneys.push({ position: [bx + building.side * (width / 5), baseY + height + 1.6, bz - depth / 4], scale: [1.1, 2.6, 1.1] });
    }
  } else if (building.roof === 'broken') {
    for (let shard = 0; shard < 5; shard += 1) {
      const shardHeight = 1 + seeded(index * 13 + shard) * 3.2;
      parts.roofs.push({
        position: [bx + (shard - 2) * (width / 6), baseY + height + shardHeight / 2 + 0.3, bz + (seeded(index * 19 + shard) - 0.5) * (depth - 3)],
        scale: [width / 6, shardHeight, 0.6 + seeded(shard + index) * 1.4],
        rotation: [0, 0, (seeded(index + shard * 3) - 0.5) * 0.4],
      });
    }
  }

  if (building.cornerCut) {
    const cutWidth = width * 0.45;
    const cutHeight = height * 0.28;
    const cutX = faceX - toRoad * (cutWidth / 2 - 0.04);
    parts.slabs.push({ position: [cutX, baseY + height - cutHeight / 2, bz + depth / 2 - 0.05], scale: [cutWidth, cutHeight, 0.2] });
    for (const level of [0.25, 0.55, 0.85]) {
      parts.slabs.push({ position: [cutX, baseY + height - cutHeight * level, bz + depth / 2 + 0.3], scale: [cutWidth, 0.16, 1.4] });
    }
  }

  // Shell-blown bays: dark gaps with the floor slab drooping out and bare columns either side.
  const lossRegion = getFacadeLossRegion(building);
  for (let hole = 0; hole < building.shellHoles; hole += 1) {
    const row = 1 + Math.floor(seeded(index * 31 + hole * 5) * Math.max(1, building.windowRows - 1));
    const y = baseY + 3 + (usableHeight * row) / building.windowRows - 0.5;
    const z = bz - usableDepth / 2 + usableDepth * ((hole + 0.3 + seeded(index + hole) * 0.4) / building.shellHoles);
    const holeWidth = 2.2 + seeded(index * 7 + hole) * 1.4;
    if (lossRegion && z > lossRegion.z0 - 0.3 && z < lossRegion.z1 + 0.3 && y > lossRegion.y0 - 0.3) continue;
    parts.holes.push({ position: [faceX + toRoad * 0.05, y, z], scale: [0.14, 2.4, holeWidth] });
    parts.hangingSlabs.push({
      position: [faceX + toRoad * 0.85, y - 1.35, z + (seeded(hole + index) - 0.5) * 0.6],
      scale: [1.9, 0.22, holeWidth * 0.7],
      rotation: [0, 0, toRoad * -0.5],
    });
    for (const edge of [-1, 1]) {
      parts.columns.push({ position: [faceX + toRoad * 0.3, y, z + edge * (holeWidth / 2 + 0.15)], scale: [0.4, 2.7, 0.4] });
    }
  }

  // Render stripped back to brick in patches.
  for (let patch = 0; patch < 3; patch += 1) {
    const y = baseY + 2.5 + seeded(index * 17 + patch) * (usableHeight - 1);
    const z = bz - usableDepth / 2 + seeded(index * 19 + patch) * usableDepth;
    parts.brickPatches.push({ position: [faceX + toRoad * 0.03, y, z], scale: [0.06, 1.4 + seeded(patch + index) * 1.4, 1.6 + seeded(patch * 3 + index) * 1.6] });
  }

  if (lossRegion) addExposedFrame(parts, lossRegion, faceX, toRoad, index);
  return parts;
}

/** Strips facade details from the gap and fills it with a dark interior, bare floor slabs, columns and ragged wall edges. */
function addExposedFrame(parts: FacadeParts, region: FacadeLossRegion, faceX: number, toRoad: number, index: number) {
  const { z0, z1, y0, y1, floorYs } = region;
  const inGap = ({ position: [, y, z] }: Part) => z > z0 - 0.3 && z < z1 + 0.3 && y > y0 - 0.3;
  // Shell holes in the gap were already skipped as whole groups when they were placed.
  for (const key of ['windows', 'arches', 'sills', 'balconySlabs', 'rails', 'brickPatches'] as const) {
    parts[key] = parts[key].filter((part) => !inGap(part));
  }

  const length = z1 - z0;
  const zc = (z0 + z1) / 2;
  parts.voids.push({ position: [faceX + toRoad * 0.05, (y0 + y1) / 2, zc], scale: [0.12, y1 - y0, length] });

  floorYs.forEach((y, floor) => {
    const jag = seeded(index * 83 + floor);
    const sags = seeded(index * 89 + floor) > 0.72;
    parts.frameSlabs.push({
      position: [faceX + toRoad * (0.4 + jag * 0.35), y - (sags ? 0.35 : 0), zc + (seeded(index * 97 + floor) - 0.5) * 0.4],
      scale: [0.8 + jag * 0.7, 0.3, length * (0.82 + seeded(index * 101 + floor) * 0.18)],
      rotation: [0, 0, toRoad * -(sags ? 0.3 : jag * 0.05)],
    });
    if (floor < floorYs.length - 1) {
      parts.partitions.push({
        position: [faceX + toRoad * 0.18, y + 1.3, z0 + (0.2 + seeded(index * 103 + floor) * 0.6) * length],
        scale: [0.3, 2.3, 0.14],
      });
    }
    for (const [edge, direction] of [[z0, 1], [z1, -1]] as const) {
      const width = 0.4 + seeded(index * 107 + floor * 3 + direction) * 1.1;
      const tall = 1.2 + seeded(index * 109 + floor * 5 + direction) * 1.8;
      parts.ragged.push({ position: [faceX + toRoad * 0.1, y + tall / 2, edge + direction * width / 2], scale: [0.22, tall, width] });
    }
  });

  const columnCount = Math.max(2, Math.round(length / 3.2) + 1);
  for (let column = 0; column < columnCount; column += 1) {
    const z = z0 + 0.25 + ((length - 0.5) * column) / (columnCount - 1);
    const broken = seeded(index * 113 + column) > 0.7;
    const height = (y1 - y0) * (broken ? 0.65 : 1);
    parts.frameColumns.push({ position: [faceX + toRoad * 0.25, y0 + height / 2, z], scale: [0.45, height, 0.45] });
  }
}

/** Rubble heaps collapsed off a facade, big enough to cross the pavement and spill into the road. */
export function getFacadeRubbleHeaps(building: Building, index: number): Heap[] {
  const [width, , depth] = building.size;
  const [bx, , bz] = building.position;
  const toRoad = -building.side;
  const faceX = bx + toRoad * (width / 2);
  const heaps: Heap[] = Array.from({ length: 3 }, (_, heap) => ({
    center: [faceX + toRoad * (2.2 + seeded(index * 61 + heap) * 1.4), bz + ((heap + 0.5) / 3 - 0.5) * (depth - 3) + (seeded(index * 67 + heap) - 0.5) * 2],
    radius: 2.4 + seeded(index * 71 + heap) * 1.0,
    height: 1.3 + seeded(index * 73 + heap) * 1.0,
    stretch: 1.3 + seeded(index * 79 + heap) * 0.5,
    seed: index * 10 + heap + 1,
  }));
  // The missing facade lies in a bigger heap right under the gap.
  const region = getFacadeLossRegion(building);
  if (region) {
    heaps.push({
      center: [faceX + toRoad * 2.4, (region.z0 + region.z1) / 2],
      radius: 3,
      height: 2.2,
      stretch: Math.max(1.2, (region.z1 - region.z0) / 6),
      seed: index * 10 + 9,
    });
  }
  return heaps;
}

const facadeRubbleGroundY = -1.15;

export function getCityRubble(): RubbleChunks {
  const rubble = emptyRubble();
  getRuinedCityBuildings().forEach((building, index) => {
    for (const heap of getFacadeRubbleHeaps(building, index)) addRubbleHeap(rubble, heap, facadeRubbleGroundY);
  });
  for (const heap of getStreetDebris(roadwayWidth, streetLength).heaps) addRubbleHeap(rubble, heap, streetRubbleGroundY);
  return rubble;
}

function CityBuilding({ building, index }: { building: Building; index: number }) {
  const parts = useMemo(() => getFacadeParts(building, index), [building, index]);
  const wallTexture = useMemo(() => getWallTexture(index + 1, building.shellHoles + 2, building.size[1] / building.size[2]), [building, index]);
  return (
    <group>
      <mesh position={building.position}>
        <boxGeometry args={building.size} />
        <meshStandardMaterial color={building.color} roughness={1} map={wallTexture ?? undefined} />
      </mesh>
      <Instanced parts={parts.windows} shape="box" color="#2b2f36" />
      <Instanced parts={parts.arches} shape="cylinder" color="#2b2f36" />
      <Instanced parts={parts.sills} shape="box" color="#9a917f" />
      <Instanced parts={parts.slabs} shape="box" color="#4a443d" />
      <Instanced parts={parts.balconySlabs} shape="box" color="#8c8272" />
      <Instanced parts={parts.rails} shape="box" color="#2a2928" />
      <Instanced parts={parts.cornice} shape="box" color="#a2977f" />
      <Instanced parts={parts.roofs} shape="box" color="#6e655a" />
      <Instanced parts={parts.chimneys} shape="box" color="#7d7365" />
      <Instanced parts={parts.holes} shape="box" color="#17130f" />
      <Instanced parts={parts.hangingSlabs} shape="box" color="#6f6b62" />
      <Instanced parts={parts.columns} shape="box" color="#5f5b53" />
      <Instanced parts={parts.brickPatches} shape="box" color="#74503f" />
      <Instanced parts={parts.voids} shape="box" color="#221e1a" />
      <Instanced parts={parts.frameSlabs} shape="box" color="#8d887e" />
      <Instanced parts={parts.frameColumns} shape="box" color="#7f7a71" />
      <Instanced parts={parts.partitions} shape="box" color="#a59e92" />
      <Instanced parts={parts.ragged} shape="box" color={building.color} />
    </group>
  );
}

function crackParts(): Part[] {
  return Array.from({ length: 24 }, (_, i) => ({
    position: [(seeded(i + 1) - 0.5) * roadwayWidth * 0.9, -1.24, (seeded(i + 40) - 0.5) * streetLength * 0.9],
    scale: [0.06, 0.02, 1.5 + seeded(i + 80) * 3],
    rotation: [0, (seeded(i + 120) - 0.5) * 1.2, 0],
  }));
}

function smokeParts(): Part[] {
  const columns: Array<[number, number]> = [[-30, -38], [-12, -44], [8, -42], [26, -36], [-24, 4], [30, 6]];
  return columns.flatMap(([x, z], column) =>
    Array.from({ length: 14 }, (_, puff) => {
      const size = 7 + puff * 1.4 + seeded(column * 9 + puff) * 3;
      return {
        position: [x + (seeded(column + puff * 3) - 0.5) * 5 + puff * 0.6, 18 + puff * 3.6, z + (seeded(puff + column * 7) - 0.5) * 4],
        scale: [size, size * 0.85, size],
      } satisfies Part;
    }),
  );
}

export function StreetCanyonBackdrop() {
  const buildings = useMemo(() => getRuinedCityBuildings(), []);
  const cracks = useMemo(crackParts, []);
  const debris = useMemo(() => getStreetDebris(roadwayWidth, streetLength), []);
  const rubble = useMemo(getCityRubble, []);
  const smoke = useMemo(smokeParts, []);
  const fires = useMemo(getCityFireSpots, []);

  return (
    <group>
      <mesh position={[0, -1.29, 0]}>
        <boxGeometry args={[roadwayWidth, 0.08, streetLength]} />
        <meshStandardMaterial color="#5b5a58" roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (roadwayWidth / 2 + sidewalkWidth / 2), -1.17, 0]}>
          <boxGeometry args={[sidewalkWidth, 0.16, streetLength]} />
          <meshStandardMaterial color="#a89a82" roughness={1} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`curb-${side}`} position={[side * (roadwayWidth / 2 + 0.1), -1.16, 0]}>
          <boxGeometry args={[0.2, 0.22, streetLength]} />
          <meshStandardMaterial color="#8b8374" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, -1.235, 0]}>
        <boxGeometry args={[centerDividerWidth, 0.04, streetLength]} />
        <meshStandardMaterial color="#7a7060" roughness={1} />
      </mesh>
      <mesh position={[0, -1.4, 0]}>
        <boxGeometry args={[220, 0.2, 200]} />
        <meshStandardMaterial color="#6a6155" roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`filler-${side}`} position={[side * (roadwayWidth / 2 + sidewalkWidth + 0.7), -1.17, 0]}>
          <boxGeometry args={[1.4, 0.16, streetLength]} />
          <meshStandardMaterial color="#a89a82" roughness={1} />
        </mesh>
      ))}
      <Instanced parts={cracks} shape="box" color="#2d2c2b" />
      <StreetProps debris={debris} />
      <Instanced parts={rubble.cores} shape="rock" color="#7a766f" />
      <Instanced parts={rubble.concrete} shape="rock" color="#aaa59a" />
      <Instanced parts={rubble.grey} shape="rock" color="#86817a" />
      <Instanced parts={rubble.plaster} shape="rock" color="#d2cdc2" />
      <Instanced parts={rubble.slabs} shape="box" color="#9c968a" />
      {buildings.map((building, index) => (
        <CityBuilding key={`${building.side}:${building.position[2]}`} building={building} index={index} />
      ))}
      <Instanced parts={smoke} shape="sphere" color="#707478" opacity={0.1} />
      {fires.map((spot) => (spot.kind === 'live' ? <Fire key={spot.seed} spot={spot} /> : <EmberGlow key={spot.seed} spot={spot} />))}
    </group>
  );
}
