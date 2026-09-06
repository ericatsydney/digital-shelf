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
      <gridHelper
        args={[20, 20, stage.accentColor, stage.gridColor]}
        position={[0, -1.25, 0]}
      />
    </>
  );
}
