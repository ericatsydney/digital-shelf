import { describe, expect, it } from 'vitest';
import { applyWind, getTreeWindStrength, swayWeight, WIND_TUNING } from '../src/scene/windMaterial';

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

describe('gentle wind tuning', () => {
  it('sways trees softly, with the far layer calmer than the near ones', () => {
    expect(getTreeWindStrength(1)).toBeLessThanOrEqual(0.3);
    expect(getTreeWindStrength(3)).toBeLessThan(getTreeWindStrength(1));
  });

  it('moves slowly: gusts, swing and leaf flutter all well under their old speeds', () => {
    expect(WIND_TUNING.gustSpeed).toBeLessThan(0.9 * 0.6);
    expect(WIND_TUNING.swingSpeed).toBeLessThan(1.6 * 0.6);
    expect(WIND_TUNING.flutterSpeed).toBeLessThan(0.6);
    expect(WIND_TUNING.flutterAmount).toBeLessThan(0.16);
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
