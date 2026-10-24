import { useGLTF } from '@react-three/drei';
import { Box3, Vector3, type Object3D } from 'three';
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

/**
 * Bounds of a model in its own frame. The cached glTF scene may still be attached to a previous,
 * scaled group when a new HeroModel measures it, so measure a detached clone instead.
 */
export function getIntrinsicBounds(object: Object3D): Box3 {
  return new Box3().setFromObject(object.clone(true));
}

/** Lifts a model whose origin is not at its feet so the lowest point sits on y = 0. */
export function getGroundOffsetY(minY: number): number {
  return Number.isFinite(minY) ? 0 - minY : 0;
}

/** Positive degrees turn the model clockwise when seen from above (three.js Y rotation is counter-clockwise). */
export function getRotationRadians(degrees: number | undefined): number {
  return degrees === undefined || !Number.isFinite(degrees) ? 0 : (-degrees * Math.PI) / 180;
}

export function HeroModel({ record, onLoaded, onBounds }: HeroModelProps) {
  const { scene } = useGLTF(record.model);
  const authoredScale = record.display?.scale ?? 1;
  const intrinsicBounds = useMemo(() => {
    try {
      return getIntrinsicBounds(scene);
    } catch {
      return new Box3();
    }
  }, [scene]);
  const measuredHeight = intrinsicBounds.isEmpty() ? 0 : intrinsicBounds.max.y - intrinsicBounds.min.y;
  const groundOffsetY = intrinsicBounds.isEmpty() ? 0 : getGroundOffsetY(intrinsicBounds.min.y);
  const scale = getHeightAwareScale(measuredHeight, record.heightMeters, authoredScale);
  const effectiveBounds = useMemo(() => {
    const bounds = intrinsicBounds.clone();
    if (bounds.isEmpty()) return bounds;
    bounds.translate(new Vector3(0, groundOffsetY, 0));
    bounds.min.multiplyScalar(scale);
    bounds.max.multiplyScalar(scale);
    return bounds;
  }, [groundOffsetY, intrinsicBounds, scale]);

  useEffect(() => {
    onBounds?.(effectiveBounds);
    onLoaded();
  }, [effectiveBounds, onBounds, onLoaded]);

  return (
    <group data-testid="hero-model" scale={scale} rotation={[0, getRotationRadians(record.display?.rotationYDegrees), 0]}>
      <group position={[0, groundOffsetY, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
