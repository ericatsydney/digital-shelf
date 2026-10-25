import { describe, expect, it } from 'vitest';
import { applyWind, swayWeight } from '../src/scene/windMaterial';

const shaderSource = () => ({
  uniforms: {} as Record<string, { value: unknown }>,
  vertexShader: 'void main() {\n#include <begin_vertex>\n#include <project_vertex>\n}',
});

describe('swayWeight', () => {
  it('is zero at the base, one at the top, and rises monotonically', () => {
    expect(swayWeight(0)).toBe(0);
    expect(swayWeight(-0.5)).toBe(0);
    expect(swayWeight(1)).toBe(1);
    expect(swayWeight(2)).toBe(1);
    expect(swayWeight(0.75)).toBeGreaterThan(swayWeight(0.5));
  });
});

describe('applyWind', () => {
  it('injects the sway uniforms and displacement into the vertex shader', () => {
    const shader = shaderSource();
    applyWind(shader, { treeHeight: 14, strength: 0.5 });
    expect(shader.vertexShader).toContain('uWindTime');
    expect(shader.vertexShader).toContain('mvPosition.xyz +=');
    expect(shader.uniforms.uWindTime).toBeDefined();
    expect(shader.uniforms.uWindStrength.value).toBe(0.5);
    expect(shader.uniforms.uTreeHeight.value).toBe(14);
    expect(shader.vertexShader).toContain('aLeaf');
  });

  it('leaves a shader without the project_vertex marker untouched', () => {
    const shader = { uniforms: {}, vertexShader: 'void main() {}' };
    applyWind(shader, { treeHeight: 10, strength: 1 });
    expect(shader.vertexShader).toBe('void main() {}');
  });
});
