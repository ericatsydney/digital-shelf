import { useMemo } from 'react';
import { getCityFireSpots } from './cityFire';
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
  { side: -1, z: -7, width: 12, depth: 12, color: '#8a8172', roof: 'broken', windowRows: 4, windowColumns: 3, balconies: 0, shellHoles: 4, cornerCut: true },
  { side: -1, z: 9, width: 16, depth: 18, color: '#9a8f7b', roof: 'flat', windowRows: 5, windowColumns: 5, balconies: 3, shellHoles: 2, cornerCut: false },
  { side: -1, z: 24, width: 18, depth: 16, color: '#857b6c', roof: 'flat', windowRows: 4, windowColumns: 5, balconies: 2, shellHoles: 3, cornerCut: true },
  { side: 1, z: -20, width: 16, depth: 15, color: '#8f8472', roof: 'broken', windowRows: 4, windowColumns: 4, balconies: 1, shellHoles: 3, cornerCut: true },
  { side: 1, z: -5, width: 18, depth: 14, color: '#887e6e', roof: 'flat', windowRows: 5, windowColumns: 5, balconies: 3, shellHoles: 2, cornerCut: false },
  { side: 1, z: 11, width: 12, depth: 16, color: '#968b78', roof: 'flat', windowRows: 3, windowColumns: 3, balconies: 1, shellHoles: 4, cornerCut: false },
  { side: 1, z: 25, width: 15, depth: 18, color: '#827868', roof: 'broken', windowRows: 5, windowColumns: 4, balconies: 2, shellHoles: 3, cornerCut: true },
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
  balconySlabs: Part[]; rails: Part[]; roofs: Part[]; chimneys: Part[]; cornice: Part[]; rubble: Part[];
};

/** Deterministic facade parts in world space, placed on the road-facing wall of a building. */
export function getFacadeParts(building: Building, index: number): FacadeParts {
  const [width, height, depth] = building.size;
  const [bx, , bz] = building.position;
  const toRoad = -building.side;
  const faceX = bx + toRoad * (width / 2);
  const baseY = streetBaseY;
  const parts: FacadeParts = {
    windows: [], arches: [], sills: [], slabs: [],
    balconySlabs: [], rails: [], roofs: [], chimneys: [], cornice: [], rubble: [],
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

  for (let pile = 0; pile < 6; pile += 1) {
    const size = 0.5 + seeded(index * 11 + pile) * 1.3;
    parts.rubble.push({
      position: [faceX + toRoad * (1.2 + seeded(index * 23 + pile) * 2.2), baseY + size / 2, bz + (seeded(index * 29 + pile) - 0.5) * depth],
      scale: [size * 1.4, size, size * 1.2],
      rotation: [seeded(pile + index) * 0.6, seeded(pile * 3 + index) * 3, seeded(pile * 5 + index) * 0.5],
    });
  }
  return parts;
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
      <Instanced parts={parts.rubble} shape="box" color="#6d675c" />
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

function debrisParts(): Part[] {
  return Array.from({ length: 26 }, (_, i) => {
    const size = 0.3 + seeded(i + 200) * 0.9;
    const onRoad = seeded(i + 240) > 0.45;
    const x = onRoad ? (seeded(i + 280) - 0.5) * roadwayWidth * 0.95 : (seeded(i + 280) > 0.5 ? 1 : -1) * (roadwayWidth / 2 + 1.2);
    const keepsModelClear = Math.abs(x) < 4 && Math.abs(seeded(i + 320) - 0.5) < 0.12;
    return {
      position: [keepsModelClear ? x + 6 : x, -1.2 + size / 2, (seeded(i + 320) - 0.5) * streetLength * 0.95],
      scale: [size * 1.5, size, size],
      rotation: [seeded(i) * 0.5, seeded(i + 9) * 3, seeded(i + 3) * 0.4],
    };
  });
}

function wreckParts(): { bodies: Part[]; cabins: Part[] } {
  const spots: Array<[number, number, number]> = [[-7.5, -14, 0.3], [7, 16, -0.25], [-6.5, 19, 0.15]];
  return {
    bodies: spots.map(([x, z, yaw]) => ({ position: [x, -0.75, z], scale: [2.1, 0.9, 4.4], rotation: [0, yaw, 0] })),
    cabins: spots.map(([x, z, yaw]) => ({ position: [x, 0.05, z - 0.2], scale: [1.8, 0.8, 2.3], rotation: [0, yaw, 0.04] })),
  };
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
  const debris = useMemo(debrisParts, []);
  const wrecks = useMemo(wreckParts, []);
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
      <Instanced parts={debris} shape="box" color="#6a645a" />
      <Instanced parts={wrecks.bodies} shape="box" color="#6b3b2c" />
      <Instanced parts={wrecks.cabins} shape="box" color="#3a3532" />
      {buildings.map((building, index) => (
        <CityBuilding key={`${building.side}:${building.position[2]}`} building={building} index={index} />
      ))}
      <Instanced parts={smoke} shape="sphere" color="#707478" opacity={0.1} />
      {fires.map((spot) => (spot.kind === 'live' ? <Fire key={spot.seed} spot={spot} /> : <EmberGlow key={spot.seed} spot={spot} />))}
    </group>
  );
}
