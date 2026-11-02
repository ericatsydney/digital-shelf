import { describe, expect, it } from 'vitest';
import { ASH_LIFT, ASH_VOLUME, EMBER_LIFT, getAshMistSettings, getHazeLayers, seedParticles, shouldShowAshMist, stepParticles } from '../src/scene/ashMist';

const city = { backdrop: { variant: 'ruined-city' as const } };

describe('ruined city ash mist', () => {
  it('uses a ninth of the prototype particle count on desktop and fewer on phones', () => {
    const desktop = getAshMistSettings({ narrow: false });
    expect(desktop.ashCount).toBe(Math.round(1400 / 9));
    expect(desktop.emberCount).toBe(Math.round(140 / 9));
    const phone = getAshMistSettings({ narrow: true });
    expect(phone.ashCount).toBeLessThan(desktop.ashCount);
    expect(phone.emberCount).toBeLessThan(desktop.emberCount);
    expect(phone.emberCount).toBeGreaterThan(0);
  });

  it('draws ash flakes and embers at about half the prototype size', () => {
    const { ashSize, emberSize } = getAshMistSettings({ narrow: false });
    expect(ashSize).toBeLessThanOrEqual(0.55 / 2 + 0.01);
    expect(emberSize).toBeLessThanOrEqual(0.6 / 2 + 0.01);
    expect(ashSize).toBeGreaterThan(0);
    expect(emberSize).toBeGreaterThan(0);
  });

  it('thins the dust haze to a third of the prototype opacity', () => {
    expect(getAshMistSettings({ narrow: false }).hazeOpacity).toBeCloseTo(0.14 / 3);
  });

  it('floats upward on hot air and swirls in depth as well as sideways', () => {
    const positions = new Float32Array([0, 20, 10]);
    stepParticles(positions, new Float32Array([1.7]), { delta: 1, time: 0.5, lift: ASH_LIFT, motion: 1 });
    expect(positions[1] - 20).toBeGreaterThan(0.3);
    expect(positions[1] - 20).toBeLessThan(2);
    expect(positions[2]).not.toBe(10);
  });

  it('varies the drift over time so the ash does not move in lockstep', () => {
    const drift = (time: number) => {
      const positions = new Float32Array([0, 20, 10]);
      stepParticles(positions, new Float32Array([1]), { delta: 0.1, time, lift: ASH_LIFT, motion: 1 });
      return positions[0];
    };
    expect(drift(0)).not.toBeCloseTo(drift(10), 3);
  });

  it('builds 14 deterministic haze layers running from the camera back down the street', () => {
    const layers = getHazeLayers();
    expect(layers).toHaveLength(14);
    expect(getHazeLayers()).toEqual(layers);
    expect(layers[0].z).toBeGreaterThan(layers[13].z);
    for (const layer of layers) expect(layer.speed).toBeGreaterThan(0);
  });

  it('seeds particles inside the street volume', () => {
    const { positions, speeds } = seedParticles(200, 1);
    expect(positions).toHaveLength(600);
    expect(speeds).toHaveLength(200);
    for (let i = 0; i < 200; i += 1) {
      expect(Math.abs(positions[i * 3])).toBeLessThanOrEqual(ASH_VOLUME.halfWidth);
      expect(positions[i * 3 + 1]).toBeGreaterThanOrEqual(0);
      expect(positions[i * 3 + 1]).toBeLessThanOrEqual(ASH_VOLUME.height);
      expect(positions[i * 3 + 2]).toBeGreaterThanOrEqual(ASH_VOLUME.zMin);
      expect(positions[i * 3 + 2]).toBeLessThanOrEqual(ASH_VOLUME.zMax);
    }
  });

  it('lifts both ash and embers, embers faster, and wraps them inside the volume', () => {
    expect(EMBER_LIFT).toBeGreaterThan(ASH_LIFT);
    const ash = new Float32Array([0, 10, 0]);
    stepParticles(ash, new Float32Array([1]), { delta: 1, time: 0, lift: ASH_LIFT, motion: 1 });
    expect(ash[1]).toBeGreaterThan(10);

    const ember = new Float32Array([0, 10, 0]);
    stepParticles(ember, new Float32Array([1]), { delta: 1, time: 0, lift: EMBER_LIFT, motion: 1 });
    expect(ember[1]).toBeGreaterThan(10);

    const top = new Float32Array([ASH_VOLUME.halfWidth - 0.01, ASH_VOLUME.height - 0.01, ASH_VOLUME.zMax - 0.01]);
    stepParticles(top, new Float32Array([1]), { delta: 1, time: 0, lift: EMBER_LIFT, motion: 1 });
    expect(top[1]).toBeLessThan(ASH_VOLUME.height / 2);
    const low = top;
    expect(low[0]).toBeLessThan(ASH_VOLUME.halfWidth);
    expect(low[2]).toBeGreaterThanOrEqual(ASH_VOLUME.zMin);
    expect(low[2]).toBeLessThanOrEqual(ASH_VOLUME.zMax);
  });

  it('keeps particles still with reduced motion', () => {
    const positions = new Float32Array([1, 5, 2]);
    stepParticles(positions, new Float32Array([1]), { delta: 1, time: 3, lift: ASH_LIFT, motion: 0 });
    expect(Array.from(positions)).toEqual([1, 5, 2]);
  });

  it('shows only on the Ruined City once a GPU renderer is confirmed', () => {
    expect(shouldShowAshMist(city, false)).toBe(true);
    expect(shouldShowAshMist(city, true)).toBe(false);
    expect(shouldShowAshMist(city, null)).toBe(false);
    for (const variant of ['hangar', 'forest', 'space'] as const) {
      expect(shouldShowAshMist({ backdrop: { variant } }, false)).toBe(false);
    }
  });
});
