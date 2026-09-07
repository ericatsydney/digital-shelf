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
  position: [number, number, number];
  size: [number, number, number];
};

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

function RuinedCityBackdrop({ color, config }: { color: string; config: StageBackdropConfig }) {
  const buildings = useMemo<Building[]>(() => {
    const heights = [1.8, 2.7, 1.3, 3.4, 2.1, 3, 1.5, 2.4];
    return heights.map((height, index) => {
      const width = 0.5 + seededUnit(index + 301) * 0.45;
      const depth = 0.35 + seededUnit(index + 401) * 0.25;
      const x = (index - (heights.length - 1) / 2) * 0.78;
      return {
        position: [x, -1.24 + height / 2, -2.5 - seededUnit(index + 501) * 1.4],
        size: [width, height, depth],
      };
    });
  }, []);

  return (
    <group>
      {buildings.map((building, index) => (
        <mesh key={index} position={building.position}>
          <boxGeometry args={building.size} />
          <meshBasicMaterial color={color} transparent opacity={0.25} depthWrite={false} />
        </mesh>
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
      return <RuinedCityBackdrop color={stage.accentColor} config={effectiveConfig} />;
    case 'hangar':
    default:
      return <HangarBackdrop color={stage.accentColor} />;
  }
}
