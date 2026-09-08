import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, type Mesh, type Points } from 'three';
import type { StageBackdropConfig, StageRecord } from '../app/types';

type StageBackdropProps = {
  stage: Pick<StageRecord, 'accentColor'>;
  config: StageBackdropConfig;
};

type Marker = {
  position: [number, number, number];
  rotation: [number, number, number];
};

type Building = {
  side: -1 | 1;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  windowStrips: number;
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

const ruinedCityBuildingSpecs: Array<{
  side: -1 | 1;
  z: number;
  width: number;
  height: number;
  depth: number;
  color: string;
  windowStrips: number;
}> = [
  { side: -1, z: -22, width: 14, height: 22, depth: 16, color: '#392a31', windowStrips: 5 },
  { side: -1, z: -7, width: 12, height: 18, depth: 12, color: '#4a3030', windowStrips: 4 },
  { side: -1, z: 9, width: 16, height: 28, depth: 18, color: '#30252d', windowStrips: 6 },
  { side: -1, z: 24, width: 18, height: 32, depth: 16, color: '#503337', windowStrips: 7 },
  { side: 1, z: -20, width: 16, height: 20, depth: 15, color: '#433038', windowStrips: 5 },
  { side: 1, z: -5, width: 18, height: 30, depth: 14, color: '#34272f', windowStrips: 7 },
  { side: 1, z: 11, width: 12, height: 19, depth: 16, color: '#513435', windowStrips: 4 },
  { side: 1, z: 25, width: 15, height: 26, depth: 18, color: '#3d2a32', windowStrips: 6 },
];

export function getRuinedCityBuildings(): Building[] {
  return ruinedCityBuildingSpecs.map((building) => ({
    side: building.side,
    position: [
      building.side * (roadwayWidth / 2 + sidewalkWidth + 1.2 + building.width / 2),
      streetBaseY + building.height / 2,
      building.z,
    ],
    size: [building.width, building.height, building.depth],
    color: building.color,
    windowStrips: building.windowStrips,
  }));
}

const hangarMarkers: Marker[] = [
  { position: [-2.6, -1.15, -1.2], rotation: [0, 0, 0] },
  { position: [2.6, -1.15, -1.2], rotation: [0, 0, 0] },
  { position: [-2.6, -1.15, 1.4], rotation: [0, Math.PI / 2, 0] },
  { position: [2.6, -1.15, 1.4], rotation: [0, Math.PI / 2, 0] },
];

const seededUnit = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

function HangarBackdrop({ color }: { color: string }) {
  const markers = useMemo(() => hangarMarkers, []);

  return (
    <group>
      <mesh position={[0, -1.2, -1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.2, 0.025, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, -1.19, -1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.4, 0.012, 8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </mesh>
      {markers.map((marker) => (
        <mesh key={marker.position.join(':')} position={marker.position} rotation={marker.rotation}>
          <boxGeometry args={[0.42, 0.04, 0.12]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function SpaceDrift({ pointsRef, motion }: { pointsRef: RefObject<Points | null>; motion: number }) {
  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points || motion <= 0) return;

    const elapsed = clock.elapsedTime * motion;
    points.rotation.y = Math.sin(elapsed * 0.22) * 0.08;
    points.rotation.x = Math.sin(elapsed * 0.17) * 0.04;
  });

  return null;
}

function SpaceBackdrop({ color, config }: { color: string; config: StageBackdropConfig }) {
  const pointsRef = useRef<Points | null>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(config.particleCount * 3);
    for (let index = 0; index < config.particleCount; index += 1) {
      const offset = index * 3;
      positions[offset] = (seededUnit(index + 1) - 0.5) * 14;
      positions[offset + 1] = seededUnit(index + 101) * 7 - 0.5;
      positions[offset + 2] = -2.5 - seededUnit(index + 201) * 6;
    }

    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute('position', new BufferAttribute(positions, 3));
    return nextGeometry;
  }, [config.particleCount]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial color={color} size={0.045} transparent opacity={0.8} sizeAttenuation />
      {config.motion > 0 && <SpaceDrift pointsRef={pointsRef} motion={config.motion} />}
    </points>
  );
}

function StaticScanRing({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.4, -2.8]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.8, 0.018, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.45} />
    </mesh>
  );
}

function AnimatedScanRing({ color, motion }: { color: string; motion: number }) {
  const ringRef = useRef<Mesh | null>(null);

  useFrame(({ clock }) => {
    const ring = ringRef.current;
    if (!ring || motion <= 0) return;

    const elapsed = clock.elapsedTime * motion;
    const scale = 1 + Math.sin(elapsed * 0.8) * 0.04;
    ring.rotation.z = elapsed * 0.12;
    ring.scale.set(scale, scale, scale);
  });

  return (
    <mesh ref={ringRef} position={[0, 0.4, -2.8]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.8, 0.018, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.45} />
    </mesh>
  );
}

function StreetSurface({ color }: { color: string }) {
  const laneMarkerZs = [-27, -22, -17, -12, -7, -2, 3, 8, 13, 18, 23, 28];
  const laneBoundaryXs = [-6.6, -3.3, 3.3, 6.6];

  return (
    <group>
      <mesh position={[0, -1.29, 0]}>
        <boxGeometry args={[roadwayWidth, 0.08, streetLength]} />
        <meshBasicMaterial color="#17181d" />
      </mesh>
      {laneBoundaryXs.flatMap((x) => laneMarkerZs.map((z) => (
        <mesh key={`${x}:${z}`} position={[x, -1.235, z]}>
          <boxGeometry args={[0.08, 0.02, 2.4]} />
          <meshBasicMaterial color={color} transparent opacity={0.55} />
        </mesh>
      )))}
      <mesh position={[0, -1.235, 0]}>
        <boxGeometry args={[centerDividerWidth, 0.04, streetLength]} />
        <meshBasicMaterial color="#8e7659" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function Sidewalk({ side, color }: { side: -1 | 1; color: string }) {
  const sidewalkCenterX = side * (roadwayWidth / 2 + sidewalkWidth / 2);
  const curbCenterX = side * (roadwayWidth / 2 + 0.1);

  return (
    <group>
      <mesh position={[sidewalkCenterX, -1.17, 0]}>
        <boxGeometry args={[sidewalkWidth, 0.16, streetLength]} />
        <meshBasicMaterial color="#4b3b3b" />
      </mesh>
      <mesh position={[curbCenterX, -1.16, 0]}>
        <boxGeometry args={[0.2, 0.22, streetLength]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function CityBuilding({ building, color }: { building: Building; color: string }) {
  const [x, y, z] = building.position;
  const [width, height, depth] = building.size;
  const roadFacingX = x - building.side * (width / 2 + 0.025);
  const windowLevels = [0.28, 0.52, 0.76].slice(0, building.windowStrips);

  return (
    <group>
      <mesh position={building.position}>
        <boxGeometry args={building.size} />
        <meshBasicMaterial color={building.color} />
      </mesh>
      <mesh position={[x, y + height / 2 + 0.06, z]}>
        <boxGeometry args={[width + 0.12, 0.12, depth + 0.12]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
      {windowLevels.map((level) => (
        <mesh key={level} position={[roadFacingX, streetBaseY + height * level, z]}>
          <boxGeometry args={[0.035, 0.08, Math.min(depth * 0.55, 1.25)]} />
          <meshBasicMaterial color="#ffc777" transparent opacity={0.62} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function DeploymentPad({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, -1.22, 0]}>
        <cylinderGeometry args={[1.55, 1.55, 0.035, 32]} />
        <meshBasicMaterial color="#2b2327" transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, -1.195, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.42, 0.028, 8, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, -1.19, 0]}>
        <boxGeometry args={[1.7, 0.025, 0.035]} />
        <meshBasicMaterial color={color} transparent opacity={0.42} />
      </mesh>
      <mesh position={[0, -1.19, 0]}>
        <boxGeometry args={[0.035, 0.025, 1.7]} />
        <meshBasicMaterial color={color} transparent opacity={0.42} />
      </mesh>
    </group>
  );
}

function StreetCanyonBackdrop({ color, config }: { color: string; config: StageBackdropConfig }) {
  const buildings = useMemo(() => getRuinedCityBuildings(), []);

  return (
    <group>
      <StreetSurface color={color} />
      <Sidewalk side={-1} color={color} />
      <Sidewalk side={1} color={color} />
      <DeploymentPad color={color} />
      {buildings.map((building) => (
        <CityBuilding key={`${building.side}:${building.position[2]}`} building={building} color={color} />
      ))}
      {config.motion > 0 ? <AnimatedScanRing color={color} motion={config.motion} /> : <StaticScanRing color={color} />}
    </group>
  );
}

export function StageBackdrop({ stage, config }: StageBackdropProps) {
  const reducedMotion = usePrefersReducedMotion();
  const effectiveConfig = useMemo(
    () => (reducedMotion ? { ...config, motion: 0 } : config),
    [config, reducedMotion],
  );

  switch (effectiveConfig.variant) {
    case 'space':
      return <SpaceBackdrop color={stage.accentColor} config={effectiveConfig} />;
    case 'ruined-city':
      return <StreetCanyonBackdrop color={stage.accentColor} config={effectiveConfig} />;
    case 'hangar':
    default:
      return <HangarBackdrop color={stage.accentColor} />;
  }
}
