import { useEffect, useMemo } from 'react';
import { BackSide } from 'three';
import { createSkyTexture, type SkyVariant } from './skyTexture';

export function SkyDome({ fallbackColor, variant = 'forest' }: { fallbackColor: string; variant?: SkyVariant }) {
  const texture = useMemo(() => createSkyTexture(undefined, variant), [variant]);
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
