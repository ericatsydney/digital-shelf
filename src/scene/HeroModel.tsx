import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import type { CollectionRecord } from '../app/types';

type HeroModelProps = {
  record: CollectionRecord;
  onLoaded: () => void;
};

/** Positive degrees turn the model clockwise when seen from above (three.js Y rotation is counter-clockwise). */
export function getRotationRadians(degrees: number | undefined): number {
  return degrees === undefined || !Number.isFinite(degrees) ? 0 : (-degrees * Math.PI) / 180;
}

/** Renders the model at the scale and ground offset stored in its record; nothing is measured at runtime. */
export function HeroModel({ record, onLoaded }: HeroModelProps) {
  const { scene } = useGLTF(record.model);
  const scale = record.display?.scale ?? 1;
  const groundOffset = record.display?.groundOffset ?? 0;

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  return (
    <group data-testid="hero-model" scale={scale} rotation={[0, getRotationRadians(record.display?.rotationYDegrees), 0]}>
      <group position={[0, groundOffset, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
