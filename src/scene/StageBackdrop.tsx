import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, type Mesh, type Points } from 'three';
import type { StageBackdropConfig, StageRecord } from '../app/types';
import { HangarBackdrop } from './HangarBackdrop';
import { ForestBackdrop } from './ForestBackdrop';
import { StreetCanyonBackdrop } from './RuinedCityBackdrop';

export { getRuinedCityBuildings, getRuinedCityStreetDimensions } from './RuinedCityBackdrop';

type StageBackdropProps = {
  stage: Pick<StageRecord, 'accentColor'>;
  config: StageBackdropConfig;
};

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

/** Forest and city grounds are modelled at y = -1.25; lift them so they meet the robot's feet at y = 0. */
const groundLift = 1.25;

export function StageBackdrop({ stage, config }: StageBackdropProps) {
  const reducedMotion = usePrefersReducedMotion();
  const effectiveConfig = useMemo(
    () => (reducedMotion ? { ...config, motion: 0 } : config),
    [config, reducedMotion],
  );

  switch (effectiveConfig.variant) {
    case 'forest':
      return <group position={[0, groundLift, 0]}><ForestBackdrop /></group>;
    case 'space':
      return <SpaceBackdrop color={stage.accentColor} config={effectiveConfig} />;
    case 'ruined-city':
      return <group position={[0, groundLift, 0]}><StreetCanyonBackdrop /></group>;
    case 'hangar':
    default:
      return <HangarBackdrop color={stage.accentColor} />;
  }
}
