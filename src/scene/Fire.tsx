import { useMemo } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Matrix4, PlaneGeometry, PointLight, ShaderMaterial } from 'three';
import { fireFlicker, fireMotionAmount, type CityFireSpot } from './cityFire';

const planeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const noiseGlsl = /* glsl */ `
  float hash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }
  float noise( vec2 p ) {
    vec2 i = floor( p ); vec2 f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
    return mix( mix( hash( i ), hash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( hash( i + vec2( 0.0, 1.0 ) ), hash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
  }
  float fbm( vec2 p ) {
    float value = 0.0; float amplitude = 0.5;
    for ( int i = 0; i < 4; i++ ) { value += amplitude * noise( p ); p *= 2.03; amplitude *= 0.5; }
    return value;
  }
`;

const flameFragment = /* glsl */ `
  uniform float uTime; uniform float uSeed; uniform float uBrightness;
  varying vec2 vUv;
  ${noiseGlsl}
  void main() {
    float side = abs( vUv.x - 0.5 ) * 2.0;
    vec2 q = vec2( vUv.x * 2.4 + uSeed * 7.0, vUv.y * 2.2 - uTime * 1.7 );
    float n = fbm( q + fbm( q * 1.3 + uTime * 0.4 ) );
    float body = ( 1.0 - vUv.y ) - side * ( 0.9 + vUv.y * 0.8 );
    float f = body + ( n - 0.5 ) * 0.9 - 0.18;
    float alpha = smoothstep( 0.0, 0.45, f ) * smoothstep( 0.0, 0.06, vUv.y );
    vec3 color = mix( vec3( 0.9, 0.12, 0.02 ), vec3( 1.0, 0.45, 0.05 ), smoothstep( 0.1, 0.55, f ) );
    color = mix( color, vec3( 1.0, 0.95, 0.7 ), smoothstep( 0.6, 0.95, f ) * ( 1.0 - vUv.y ) * 0.5 );
    gl_FragColor = vec4( color * uBrightness, alpha );
  }
`;

const smokeFragment = /* glsl */ `
  uniform float uTime; uniform float uSeed;
  varying vec2 vUv;
  ${noiseGlsl}
  void main() {
    float side = abs( vUv.x - 0.5 ) * 2.0;
    vec2 q = vec2( vUv.x * 1.8 + uSeed * 5.0, vUv.y * 1.6 - uTime * 0.35 );
    float n = fbm( q + vec2( 0.0, uTime * 0.05 ) );
    float alpha = smoothstep( 0.35, 0.75, n ) * ( 1.0 - side * side ) * smoothstep( 0.0, 0.15, vUv.y ) * ( 1.0 - vUv.y ) * 0.3;
    gl_FragColor = vec4( vec3( 0.09, 0.09, 0.1 ), alpha );
  }
`;

const emberVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime; uniform float uHeight; uniform float uSize;
  varying float vLife;
  void main() {
    float life = fract( uTime * ( 0.12 + aSeed * 0.18 ) + aSeed * 13.7 );
    vLife = life;
    vec3 p = position;
    p.y += life * uHeight * ( 0.6 + aSeed * 0.8 );
    p.x += sin( uTime * 1.3 + aSeed * 20.0 ) * 0.6 * life + life * life * 1.2;
    p.z += cos( uTime * 1.1 + aSeed * 17.0 ) * 0.6 * life;
    vec4 mv = modelViewMatrix * vec4( p, 1.0 );
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * ( 1.0 - life ) * ( 400.0 / -mv.z );
  }
`;

const emberFragment = /* glsl */ `
  varying float vLife;
  void main() {
    float d = length( gl_PointCoord - 0.5 );
    float alpha = smoothstep( 0.5, 0.0, d ) * ( 1.0 - vLife );
    gl_FragColor = vec4( mix( vec3( 1.0, 0.75, 0.2 ), vec3( 0.9, 0.2, 0.03 ), vLife ), alpha );
  }
`;

/** Base candela of the glow before flicker; low, because these fires are dying embers of a long-ago war. */
const baseLightIntensity = 45;
const emberCount = 14;

/** A low, nearly burnt-out flame with a few embers, thin smoke and a dim flickering light; driven by `onBeforeRender`, no hooks needed. */
export function Fire({ spot }: { spot: CityFireSpot }) {
  const { position, scale, seed } = spot;
  const parts = useMemo(() => {
    const time = { value: 0 };
    const brightness = { value: 1 };
    const planes = (width: number, height: number, count: number) => {
      const geometry = new PlaneGeometry(width, height);
      geometry.translate(0, height / 2, 0);
      return Array.from({ length: count }, (_, i) => geometry.clone().applyMatrix4(new Matrix4().makeRotationY((i * Math.PI) / count)));
    };
    const flameGeometries = planes(2.2 * scale, 2.4 * scale, 3);
    const smokeGeometries = planes(4 * scale, 8 * scale, 2);
    const flameMaterial = new ShaderMaterial({
      uniforms: { uTime: time, uSeed: { value: seed }, uBrightness: brightness },
      vertexShader: planeVertex, fragmentShader: flameFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    });
    const smokeMaterial = new ShaderMaterial({
      uniforms: { uTime: time, uSeed: { value: seed } },
      vertexShader: planeVertex, fragmentShader: smokeFragment,
      transparent: true, depthWrite: false, side: DoubleSide,
    });
    const emberPositions = new Float32Array(emberCount * 3);
    const emberSeeds = new Float32Array(emberCount);
    for (let i = 0; i < emberCount; i++) {
      const angle = (i * 2.399) % (Math.PI * 2);
      const radius = (0.25 + ((i * 0.37) % 1) * 0.9) * scale;
      emberPositions.set([Math.cos(angle) * radius, 0.4 * scale, Math.sin(angle) * radius], i * 3);
      emberSeeds[i] = ((i * 0.6180339) % 1) * 0.999 + 0.0005;
    }
    const emberGeometry = new BufferGeometry();
    emberGeometry.setAttribute('position', new BufferAttribute(emberPositions, 3));
    emberGeometry.setAttribute('aSeed', new BufferAttribute(emberSeeds, 1));
    const emberMaterial = new ShaderMaterial({
      uniforms: { uTime: time, uHeight: { value: 3.5 * scale }, uSize: { value: 0.2 * scale } },
      vertexShader: emberVertex, fragmentShader: emberFragment,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const light = new PointLight('#ff8a3d', baseLightIntensity, 42, 2);
    const tick = () => {
      const now = performance.now() / 1000;
      const flicker = fireFlicker(now + seed * 11, seed);
      time.value = fireMotionAmount ? now : 0;
      brightness.value = flicker * 0.75;
      light.intensity = baseLightIntensity * scale * flicker;
    };
    return { flameGeometries, smokeGeometries, flameMaterial, smokeMaterial, emberGeometry, emberMaterial, light, tick };
  }, [scale, seed]);

  return (
    <group position={position}>
      {parts.flameGeometries.map((geometry, i) => (
        <mesh key={`flame-${i}`} geometry={geometry} material={parts.flameMaterial} renderOrder={3} onBeforeRender={parts.tick} frustumCulled={false} />
      ))}
      {parts.smokeGeometries.map((geometry, i) => (
        <mesh key={`smoke-${i}`} geometry={geometry} material={parts.smokeMaterial} position={[0, 1.4 * scale, 0]} renderOrder={2} frustumCulled={false} />
      ))}
      <points geometry={parts.emberGeometry} material={parts.emberMaterial} renderOrder={4} frustumCulled={false} />
      <primitive object={parts.light} position={[0, 1.0 * scale, 0]} />
    </group>
  );
}
