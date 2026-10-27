import { Instanced, type Part, type Vec3 } from './Instanced';
import type { Heap } from './rubbleHeap';

const roadTopY = -1.25;

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

export type DebrisKind = 'bricks' | 'charred' | 'rebar' | 'drums';
export type StreetDebris = Record<DebrisKind, Part[]> & { heaps: Heap[] };

export const streetRubbleGroundY = roadTopY;

/** Half-width of the square the hero model stands in; debris is nudged off it so nothing clips the model. */
const modelClearance = 4;

/** War-damaged street clutter: angular rubble heaps with brick bits, charred timber, rebar and the odd oil drum. */
export function getStreetDebris(roadwayWidth: number, streetLength: number): StreetDebris {
  const debris: StreetDebris = { bricks: [], charred: [], rebar: [], drums: [], heaps: [] };

  // Piles gather along the kerbs and around the wrecks; a few strays lie in the lanes.
  for (let pile = 0; pile < 30; pile += 1) {
    const side = seeded(pile + 7) > 0.5 ? 1 : -1;
    const inLane = seeded(pile + 11) > 0.7;
    let x = inLane
      ? (seeded(pile + 13) - 0.5) * roadwayWidth * 0.8
      : side * (roadwayWidth / 2 - 0.6 - seeded(pile + 17) * 1.6);
    const z = (seeded(pile + 19) - 0.5) * streetLength * 0.92;
    const radius = inLane ? 0.8 + seeded(pile + 23) * 0.6 : 1.1 + seeded(pile + 23) * 0.8;
    const stretch = 1 + seeded(pile + 29) * 0.5;
    if (Math.abs(x) < modelClearance + radius && Math.abs(z) < modelClearance + radius * stretch) {
      x = (x === 0 ? side : Math.sign(x)) * (modelClearance + radius + 0.2);
    }
    debris.heaps.push({ center: [x, z], radius, height: 0.5 + seeded(pile + 31) * 0.6, stretch, seed: 500 + pile });

    const brickCount = 1 + Math.floor(seeded(pile + 31) * 3);
    for (let brick = 0; brick < brickCount; brick += 1) {
      const size = 0.1 + seeded(pile * 19 + brick) * 0.16;
      debris.bricks.push({
        position: [x + (seeded(pile * 23 + brick) - 0.5) * 1.4, roadTopY + 0.22 + size * 0.3, z + (seeded(pile * 29 + brick) - 0.5) * 1.4],
        scale: [size * 1.6, size * 0.7, size],
        rotation: [seeded(brick + pile) * 0.5, seeded(brick * 3 + pile) * 6, seeded(brick * 5 + pile) * 0.5],
      });
    }

    if (seeded(pile + 37) > 0.55) {
      debris.rebar.push({
        position: [x + (seeded(pile + 41) - 0.5) * 0.8, roadTopY + 0.4, z + (seeded(pile + 43) - 0.5) * 0.8],
        scale: [0.04, 0.9 + seeded(pile + 47) * 0.9, 0.04],
        rotation: [(seeded(pile + 53) - 0.5) * 1.4, 0, (seeded(pile + 59) - 0.5) * 1.4],
      });
    }
    if (seeded(pile + 83) > 0.85) {
      debris.drums.push({
        position: [x + (seeded(pile + 89) - 0.5) * 1.6, roadTopY + 0.45, z + (seeded(pile + 97) - 0.5) * 1.6],
        scale: [0.55, 0.9, 0.55],
        rotation: [0, 0, seeded(pile + 101) > 0.6 ? 0.1 : 0],
      });
    }
    if (seeded(pile + 61) > 0.6) {
      debris.charred.push({
        position: [x + (seeded(pile + 67) - 0.5) * 1.4, roadTopY + 0.12, z + (seeded(pile + 71) - 0.5) * 1.4],
        scale: [0.12, 0.12, 0.7 + seeded(pile + 73) * 0.8],
        rotation: [0, seeded(pile + 79) * 3, 0.08],
      });
    }
  }
  return debris;
}

export type WreckSpot = { position: [number, number]; yaw: number; body: string; tilt: number; missingWheel?: 'fl' | 'rr'; hoodOpen?: boolean };

export const wreckSpots: WreckSpot[] = [
  { position: [-7.5, -14], yaw: 0.3, body: '#8a4a24', tilt: 0.05, missingWheel: 'fl', hoodOpen: true },
  { position: [7, 16], yaw: -0.25, body: '#7a5a2e', tilt: 0 },
  { position: [-6.5, 19], yaw: 0.15, body: '#5d6068', tilt: -0.08, missingWheel: 'rr' },
];

const soot = '#1d1b1a';
const glass = '#161a1e';
const trim = '#1a1a1a';
const rim = '#8d8d88';
const carScale = 1.15;

/** A burnt-out Corolla-style hatchback: raked windscreen and hatch, black grille, alloy wheels, mirrors. */
export function WreckedCar({ spot }: { spot: WreckSpot }) {
  const wheelY = roadTopY + 0.33;
  const wheels: Array<{ key: 'fl' | 'fr' | 'rl' | 'rr'; position: Vec3 }> = [
    { key: 'fl', position: [-0.86, wheelY, 1.4] },
    { key: 'fr', position: [0.86, wheelY, 1.4] },
    { key: 'rl', position: [-0.86, wheelY, -1.35] },
    { key: 'rr', position: [0.86, wheelY, -1.35] },
  ];
  const paint = <meshStandardMaterial color={spot.body} roughness={1} />;
  const dark = (color: string) => <meshStandardMaterial color={color} roughness={1} />;
  return (
    <group position={[spot.position[0], 0, spot.position[1]]} rotation={[0, spot.yaw, spot.tilt]} scale={carScale}>
      {/* lower body and black sill */}
      <mesh position={[0, roadTopY + 0.62, 0]}>
        <boxGeometry args={[1.8, 0.5, 4.3]} />
        {paint}
      </mesh>
      <mesh position={[0, roadTopY + 0.38, 0]}>
        <boxGeometry args={[1.84, 0.12, 3.0]} />
        {dark(trim)}
      </mesh>
      {/* sloping bonnet, sprung open on one car */}
      <mesh
        position={[0, roadTopY + (spot.hoodOpen ? 1.12 : 0.93), spot.hoodOpen ? 1.55 : 1.45]}
        rotation={[spot.hoodOpen ? -0.6 : -0.14, 0, 0]}
      >
        <boxGeometry args={[1.72, 0.08, 1.45]} />
        {paint}
      </mesh>
      {/* black honeycomb grille and headlights */}
      <mesh position={[0, roadTopY + 0.6, 2.17]}>
        <boxGeometry args={[1.1, 0.26, 0.05]} />
        {dark(trim)}
      </mesh>
      {[-0.68, 0.68].map((x) => (
        <mesh key={`head-${x}`} position={[x, roadTopY + 0.82, 2.15]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}>
          <boxGeometry args={[0.46, 0.13, 0.06]} />
          {dark('#2b3035')}
        </mesh>
      ))}
      {/* cabin: dark glass core, raked windscreen, steeply sloping hatch glass, caved roof */}
      <mesh position={[0, roadTopY + 1.2, -0.35]}>
        <boxGeometry args={[1.62, 0.5, 1.9]} />
        {dark(glass)}
      </mesh>
      <mesh position={[0, roadTopY + 1.23, 0.68]} rotation={[-1.0, 0, 0]}>
        <boxGeometry args={[1.6, 0.8, 0.05]} />
        {dark(glass)}
      </mesh>
      <mesh position={[0, roadTopY + 1.23, -1.42]} rotation={[1.05, 0, 0]}>
        <boxGeometry args={[1.58, 1.1, 0.05]} />
        {dark(glass)}
      </mesh>
      <mesh position={[0, roadTopY + 1.52, -0.38]} rotation={[0.05, 0, 0.06]}>
        <boxGeometry args={[1.64, 0.08, 1.3]} />
        {dark(soot)}
      </mesh>
      {[-0.82, 0.82].flatMap((x) => [-0.95, 0.2].map((z) => (
        <mesh key={`pillar-${x}:${z}`} position={[x, roadTopY + 1.2, z - 0.2]}>
          <boxGeometry args={[0.06, 0.54, 0.1]} />
          {paint}
        </mesh>
      )))}
      {/* rear spoiler and side mirrors */}
      <mesh position={[0, roadTopY + 1.58, -1.95]}>
        <boxGeometry args={[1.4, 0.06, 0.22]} />
        {paint}
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`mirror-${side}`} position={[side * 1.0, roadTopY + 1.0, 0.85]}>
          <boxGeometry args={[0.18, 0.14, 0.22]} />
          {dark(trim)}
        </mesh>
      ))}
      {/* bumpers, rear one hanging loose */}
      <mesh position={[0, roadTopY + 0.4, 2.2]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[1.84, 0.26, 0.16]} />
        {paint}
      </mesh>
      <mesh position={[0.2, roadTopY + 0.28, -2.2]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[1.84, 0.24, 0.16]} />
        {paint}
      </mesh>
      {wheels.map((wheel) => {
        const missing = spot.missingWheel === wheel.key;
        const position: Vec3 = missing ? [wheel.position[0] * 1.5, roadTopY + 0.14, wheel.position[2] + 0.2] : wheel.position;
        const rotation: Vec3 = missing ? [0, 0, 0] : [0, 0, Math.PI / 2];
        return (
          <group key={wheel.key} position={position} rotation={rotation}>
            <mesh>
              <cylinderGeometry args={[0.33, 0.33, 0.24, 16]} />
              {dark('#141414')}
            </mesh>
            <mesh position={[0, wheel.position[0] > 0 ? 0.01 : -0.01, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.25, 12]} />
              {dark(rim)}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function StreetProps({ debris }: { debris: StreetDebris }) {
  return (
    <group>
      <Instanced parts={debris.bricks} shape="box" color="#7c4a39" />
      <Instanced parts={debris.charred} shape="box" color="#2a2623" />
      <Instanced parts={debris.rebar} shape="cylinder" color="#5b4a3f" />
      <Instanced parts={debris.drums} shape="cylinder" color="#6f4a33" />
      {wreckSpots.map((spot) => <WreckedCar key={spot.position.join(':')} spot={spot} />)}
    </group>
  );
}
