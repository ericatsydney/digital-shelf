import type { StageRecord } from '../app/types';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Fog } from 'three';

type StageSceneProps = {
  stage: StageRecord;
};

export function StageScene({ stage }: StageSceneProps) {
  const scene = useThree(({ scene }) => scene);
  const isForest = stage.backdrop.variant === 'forest';
  useEffect(() => {
    scene.fog = isForest ? new Fog(stage.background, 65, 150) : null;
    return () => { scene.fog = null; };
  }, [scene, isForest, stage.background]);

  return (
    <>
      <color attach="background" args={[stage.background]} />
      <ambientLight intensity={stage.ambientIntensity} />
      <directionalLight position={[4, 8, 5]} intensity={stage.directionalIntensity} />
      {!isForest && (
        <gridHelper
          args={[20, 20, stage.accentColor, stage.gridColor]}
          position={[0, -1.25, 0]}
        />
      )}
    </>
  );
}
