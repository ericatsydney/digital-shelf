import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, RepeatWrapping, type Texture } from 'three';
import { ASH_LIFT, EMBER_LIFT, getAshMistSettings, getHazeLayers, seedParticles, stepParticles, windGust } from './ashMist';

const isNarrowScreen = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 700px)').matches;
const motionAmount = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 1;

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D) => void): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  return new CanvasTexture(canvas);
}

function softDotTexture() {
  return canvasTexture(64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
}

/** Soft dust blobs in the lower half, faded out towards the top so each plane sits on the ground. */
function hazeTexture() {
  const seeded = (seed: number) => { const v = Math.sin(seed * 12.9898) * 43758.5453; return v - Math.floor(v); };
  return canvasTexture(256, (ctx) => {
    for (let i = 0; i < 60; i += 1) {
      const x = seeded(i + 1) * 256, y = 120 + seeded(i + 50) * 110, r = 30 + seeded(i + 99) * 60;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.22)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    }
    const fade = ctx.createLinearGradient(0, 0, 0, 256);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(0.55, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 256, 256);
  });
}

function GroundHaze({ opacity }: { opacity: number }) {
  const layers = useMemo(getHazeLayers, []);
  const textures = useMemo(() => {
    const base = hazeTexture();
    const clones = layers.map(() => {
      const texture = base.clone();
      texture.wrapS = RepeatWrapping;
      texture.needsUpdate = true;
      return texture;
    });
    base.dispose();
    return clones;
  }, [layers]);
  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures]);
  useFrame(({ clock }, delta) => {
    if (motionAmount <= 0) return;
    const gust = windGust(clock.elapsedTime);
    textures.forEach((texture, i) => { texture.offset.x += layers[i].speed * gust * delta; });
  });
  return (
    <group>
      {layers.map((layer, i) => (
        <mesh key={i} position={[layer.x, 2.6, layer.z]} renderOrder={4}>
          <planeGeometry args={[layer.width, 6]} />
          <meshBasicMaterial map={textures[i]} color="#d9b08c" transparent opacity={opacity} depthWrite={false} side={DoubleSide} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

function AshParticles({ count, color, size, additive, lift, seed, sprite }: {
  count: number; color: string; size: number; additive: boolean; lift: number; seed: number; sprite: Texture;
}) {
  const { geometry, speeds } = useMemo(() => {
    const { positions, speeds } = seedParticles(count, seed);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    return { geometry: geo, speeds };
  }, [count, seed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }, delta) => {
    if (motionAmount <= 0) return;
    const attribute = geometry.getAttribute('position') as BufferAttribute;
    stepParticles(attribute.array as Float32Array, speeds, { delta, time: clock.elapsedTime, lift, motion: motionAmount });
    attribute.needsUpdate = true;
  });
  return (
    <points geometry={geometry}>
      <pointsMaterial map={sprite} color={color} size={size} sizeAttenuation transparent opacity={additive ? 1 : 0.9} depthWrite={false}
        blending={additive ? AdditiveBlending : undefined} toneMapped={!additive} />
    </points>
  );
}

/** The Ruined City still smoulders: warm dust haze along the street, sparse ash and a few embers, both lifted by the hot air. */
export function RuinedCityAtmosphere() {
  const { ashCount, emberCount, hazeOpacity, ashSize, emberSize } = getAshMistSettings({ narrow: Boolean(isNarrowScreen) });
  const sprite = useMemo(softDotTexture, []);
  useEffect(() => () => sprite.dispose(), [sprite]);
  return (
    <>
      <GroundHaze opacity={hazeOpacity} />
      <AshParticles count={ashCount} color="#d8d2cc" size={ashSize} additive={false} lift={ASH_LIFT} seed={1} sprite={sprite} />
      <AshParticles count={emberCount} color="#ff8a3d" size={emberSize} additive lift={EMBER_LIFT} seed={2} sprite={sprite} />
    </>
  );
}
