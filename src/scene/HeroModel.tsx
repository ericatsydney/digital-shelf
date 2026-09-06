import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import type { CollectionRecord } from '../app/types';

type HeroModelProps = {
  record: CollectionRecord;
  onLoaded: () => void;
};

export function HeroModel({ record, onLoaded }: HeroModelProps) {
  const { scene } = useGLTF(record.model);

  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  return (
    <group data-testid="hero-model" scale={record.display?.scale ?? 1}>
      <primitive object={scene} />
    </group>
  );
}
