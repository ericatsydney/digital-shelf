export type WindParams = {
  /** Height of the tree the geometry belongs to; the bend weight is y / treeHeight. */
  treeHeight: number;
  strength: number;
};

type WindShader = { uniforms: Record<string, { value: unknown }>; vertexShader: string };

/** Shared by every tree so one clock drives the whole forest. */
export const windTime = { value: 0 };
const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const windAmount = { value: reduceMotion ? 0 : 1 };

export const tickWind = () => { windTime.value = performance.now() / 1000; };

/** Eased 0..1 sway weight: the trunk base stays planted, the canopy top moves most. */
export function swayWeight(heightFraction: number) {
  const t = Math.min(1, Math.max(0, heightFraction));
  return t * t;
}

const MARKER = '#include <project_vertex>';
const BEGIN = '#include <begin_vertex>';

const SWAY_CHUNK = /* glsl */ `
  vec2 windDir = vec2( 0.92, 0.38 );
  float windFraction = clamp( windLocal.y / uTreeHeight, 0.0, 1.0 );
  float windBase = dot( modelMatrix[3].xz, windDir );
  float gust = 0.5 + 0.5 * sin( windBase * 0.09 - uWindTime * 0.9 );
  float swing = sin( uWindTime * 1.6 + windBase * 0.21 );
  float bend = ( 0.3 + 0.7 * gust + 0.12 * swing ) * windFraction * windFraction * uWindStrength * uWindAmount;
  float flutter = aLeaf * uWindStrength * uWindAmount * ( 0.35 + 0.65 * gust ) * 0.16;
  vec3 windOffset = vec3( windDir.x, 0.0, windDir.y ) * bend;
  windOffset += flutter * vec3(
    sin( uWindTime * 3.1 + aPhase * 5.0 ),
    sin( uWindTime * 2.3 + aPhase * 3.0 ) * 0.6,
    sin( uWindTime * 2.7 + aPhase * 4.0 ) );
  mvPosition.xyz += mat3( viewMatrix ) * windOffset;
  gl_Position = projectionMatrix * mvPosition;
`;

/** Bend a tree's vertex shader with a travelling gust and leaf flutter; no-op if three's shader layout changes. */
export function applyWind(shader: WindShader, { treeHeight, strength }: WindParams) {
  if (!shader.vertexShader.includes(MARKER) || !shader.vertexShader.includes(BEGIN)) return;
  shader.uniforms.uWindTime = windTime;
  shader.uniforms.uWindAmount = windAmount;
  shader.uniforms.uTreeHeight = { value: treeHeight };
  shader.uniforms.uWindStrength = { value: strength };
  shader.vertexShader = `
    attribute float aLeaf; attribute float aPhase;
    uniform float uWindTime; uniform float uWindAmount; uniform float uTreeHeight; uniform float uWindStrength;
  ` + shader.vertexShader
    .replace(BEGIN, `${BEGIN}\nvec3 windLocal = transformed;`)
    .replace(MARKER, `${MARKER}\n${SWAY_CHUNK}`);
}
