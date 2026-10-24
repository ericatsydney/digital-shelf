import { useEffect, useMemo } from 'react';
import { BackSide } from 'three';
import { createSkyTexture } from './skyTexture';

export function SkyDome({ fallbackColor }: { fallbackColor: string }) {
  const texture = useMemo(() => createSkyTexture(), []);
  useEffect(() => () => texture?.dispose(), [texture]);

  return (
    <mesh data-testid="sky-dome" position={[0, -20, -20]} renderOrder={-1}>
      <sphereGeometry args={[170, 48, 24]} />
      <meshBasicMaterial
        map={texture ?? undefined}
        color={texture ? '#ffffff' : fallbackColor}
        side={BackSide}
        fog={false}
        depthWrite={false}
      />
    </mesh>
  );
}
