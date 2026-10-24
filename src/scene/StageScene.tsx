import type { StageRecord } from '../app/types';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Fog } from 'three';
import { SkyDome } from './SkyDome';

type StageSceneProps = {
  stage: StageRecord;
};

export function StageScene({ stage }: StageSceneProps) {
  const scene = useThree(({ scene }) => scene);
  const isForest = stage.backdrop.variant === 'forest';
  const isCity = stage.backdrop.variant === 'ruined-city';
  const hasDaylight = isForest || isCity;
  useEffect(() => {
    scene.fog = hasDaylight ? new Fog(stage.background, isCity ? 80 : 65, isCity ? 190 : 150) : null;
    return () => { scene.fog = null; };
  }, [scene, hasDaylight, isCity, stage.background]);

  return (
    <>
      <color attach="background" args={[stage.background]} />
      {hasDaylight && <SkyDome fallbackColor={stage.background} variant={isCity ? 'ruined-city' : 'forest'} />}
      <ambientLight intensity={stage.ambientIntensity} />
      <directionalLight position={[4, 8, 5]} intensity={stage.directionalIntensity} />
      {!hasDaylight && (
        <gridHelper
          args={[20, 20, stage.accentColor, stage.gridColor]}
          position={[0, -1.25, 0]}
        />
      )}
    </>
  );
}
