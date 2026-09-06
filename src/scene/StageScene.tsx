import { Grid } from '@react-three/drei';
import type { StageRecord } from '../app/types';

type StageSceneProps = {
  stage: StageRecord;
};

export function StageScene({ stage }: StageSceneProps) {
  return (
    <>
      <color attach="background" args={[stage.background]} />
      <ambientLight intensity={stage.ambientIntensity} />
      <directionalLight position={[4, 8, 5]} intensity={stage.directionalIntensity} />
      <Grid
        args={[20, 20]}
        cellColor={stage.gridColor}
        sectionColor={stage.accentColor}
        cellSize={1}
        sectionSize={5}
        fadeDistance={24}
        fadeStrength={1.25}
        position={[0, -1.25, 0]}
      />
    </>
  );
}
