import { describe, expect, it } from 'vitest';
import { getCinematicSettings, isSoftwareRenderer } from '../src/scene/cinematicSettings';
import type { StageRecord } from '../src/app/types';

const backdrop = (variant: StageRecord['backdrop']['variant']) => ({ backdrop: { variant, particleCount: 0, motion: 0 } });

describe('cinematic grade settings', () => {
  it('returns a vignette and exposure for every stage variant', () => {
    for (const variant of ['hangar', 'forest', 'ruined-city', 'space'] as const) {
      const settings = getCinematicSettings(backdrop(variant));
      expect(settings.vignette).toBeGreaterThan(0);
      expect(settings.vignette).toBeLessThan(1);
      expect(settings.exposure).toBeGreaterThan(0);
    }
  });

  it('keeps daylight stages more open than the Hangar', () => {
    const hangar = getCinematicSettings(backdrop('hangar')).vignette;
    expect(getCinematicSettings(backdrop('forest')).vignette).toBeLessThan(hangar);
    expect(getCinematicSettings(backdrop('ruined-city')).vignette).toBeLessThan(hangar);
  });

  it('opens up the Forest into bright daylight', () => {
    const forest = getCinematicSettings(backdrop('forest'));
    expect(forest.exposure).toBeGreaterThan(1);
    expect(forest.vignette).toBeLessThan(getCinematicSettings(backdrop('ruined-city')).vignette);
  });
});

describe('software renderer detection', () => {
  it('recognises software WebGL renderers and accepts real GPUs', () => {
    expect(isSoftwareRenderer('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)')).toBe(true);
    expect(isSoftwareRenderer('llvmpipe (LLVM 15.0.7, 256 bits)')).toBe(true);
    expect(isSoftwareRenderer('Microsoft Basic Render Driver')).toBe(true);
    expect(isSoftwareRenderer('ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe(false);
    expect(isSoftwareRenderer(undefined)).toBe(false);
  });
});
