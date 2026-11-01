import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { CinematicSettings } from './cinematicSettings';

/** Cool shadows, warm highlights, a little contrast and a vignette; runs after tone mapping. */
const gradeShader = {
  uniforms: { tDiffuse: { value: null }, vignette: { value: 0.7 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vignette; varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(color.rgb * vec3(0.82, 0.9, 1.1), color.rgb * vec3(1.06, 0.98, 0.9), smoothstep(0.1, 0.8, luma));
      color.rgb = clamp((color.rgb - 0.45) * 1.18 + 0.45, 0.0, 1.0);
      color.rgb *= 1.0 - vignette * smoothstep(0.35, 0.85, distance(vUv, vec2(0.5)));
      gl_FragColor = color;
    }`,
};

/** Film-style colour grade and vignette over the finished frame; the scene's own lighting is untouched. */
export function CinematicLook({ settings }: { settings: CinematicSettings }) {
  const gl = useThree(({ gl }) => gl);
  const scene = useThree(({ scene }) => scene);
  const camera = useThree(({ camera }) => camera);
  const size = useThree(({ size }) => size);
  const { vignette, exposure } = settings;

  // Built once per renderer; stage changes only retune the grade below.
  const { composer, grade } = useMemo(() => {
    const effects = new EffectComposer(gl);
    effects.addPass(new RenderPass(scene, camera));
    effects.addPass(new OutputPass());
    const gradePass = new ShaderPass(gradeShader);
    effects.addPass(gradePass);
    return { composer: effects, grade: gradePass };
  }, [gl, scene, camera]);

  useEffect(() => {
    grade.uniforms.vignette.value = vignette;
  }, [grade, vignette]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size.width, size.height]);

  useEffect(() => {
    const previous = gl.toneMappingExposure;
    gl.toneMappingExposure = exposure;
    return () => { gl.toneMappingExposure = previous; };
  }, [gl, exposure]);

  useEffect(() => () => composer.dispose(), [composer]);

  // A positive priority takes over rendering from R3F, so every frame goes through the grade.
  useFrame(() => composer.render(), 1);
  return null;
}
