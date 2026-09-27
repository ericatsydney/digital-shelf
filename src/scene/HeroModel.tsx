import { useGLTF } from '@react-three/drei';
import { Box3 } from 'three';
import { useEffect, useMemo } from 'react';
import type { CollectionRecord } from '../app/types';

type HeroModelProps = {
  record: CollectionRecord;
  onLoaded: () => void;
  onBounds?: (bounds: Box3) => void;
};

export function getHeightAwareScale(
  measuredHeight: number,
  heightMeters: number | undefined,
  authoredScale: number,
): number {
  if (
    !Number.isFinite(measuredHeight) ||
    measuredHeight <= 0 ||
    heightMeters === undefined ||
    !Number.isFinite(heightMeters) ||
    heightMeters <= 0
  ) {
    return authoredScale;
  }

  return (heightMeters / measuredHeight) * authoredScale;
}

export function HeroModel({ record, onLoaded, onBounds }: HeroModelProps) {
  const { scene } = useGLTF(record.model);
  const authoredScale = record.display?.scale ?? 1;
  const measuredHeight = useMemo(() => {
    try {
      const bounds = new Box3().setFromObject(scene);
      return bounds.max.y - bounds.min.y;
    } catch {
      return 0;
    }
  }, [scene]);
  const scale = getHeightAwareScale(measuredHeight, record.heightMeters, authoredScale);
  const effectiveBounds = useMemo(() => {
    try {
      const bounds = new Box3().setFromObject(scene);
      bounds.min.multiplyScalar(scale);
      bounds.max.multiplyScalar(scale);
      return bounds;
    } catch {
      return new Box3();
    }
  }, [scale, scene]);

  useEffect(() => {
    onBounds?.(effectiveBounds);
    onLoaded();
  }, [effectiveBounds, onBounds, onLoaded]);

  return (
    <group data-testid="hero-model" scale={scale}>
      <primitive object={scene} />
    </group>
  );
}
