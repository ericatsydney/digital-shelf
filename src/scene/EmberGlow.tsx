import { useEffect, useState } from 'react';
import { AdditiveBlending, DoubleSide, type Texture } from 'three';
import type { CityFireSpot } from './cityFire';
import { loadEmberGlowTexture } from './emberGlowTexture';

/** A long-dead fire: a static orange glow lying on the surface plus a low haze, from one baked image; no light, no animation. */
export function EmberGlow({ spot }: { spot: CityFireSpot }) {
  const [texture, setTexture] = useState<Texture | null>(null);
  useEffect(() => {
    let active = true;
    void loadEmberGlowTexture().then((loaded) => { if (active) setTexture(loaded); });
    return () => { active = false; };
  }, []);
  if (!texture) return null;
  const { position, scale } = spot;
  const material = <meshBasicMaterial map={texture} transparent opacity={0.8} blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />;
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <planeGeometry args={[5.5 * scale, 5.5 * scale]} />
        {material}
      </mesh>
      {[0, Math.PI / 2].map((yaw) => (
        <mesh key={yaw} position={[0, 0.7 * scale, 0]} rotation={[0, yaw, 0]} renderOrder={3}>
          <planeGeometry args={[3 * scale, 1.5 * scale]} />
          {material}
        </mesh>
      ))}
    </group>
  );
}
