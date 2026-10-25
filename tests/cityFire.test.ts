import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fireFlicker, getCityFireSpots } from '../src/scene/cityFire';

describe('getCityFireSpots', () => {
  const spots = getCityFireSpots();

  it('places three deterministic fires', () => {
    expect(spots).toHaveLength(3);
    expect(getCityFireSpots()).toEqual(spots);
    expect(new Set(spots.map((spot) => spot.seed)).size).toBe(3);
  });

  it('keeps exactly one fire live, on the front right, and turns the rest into static glow spots', () => {
    const live = spots.filter((spot) => spot.kind === 'live');
    expect(live).toHaveLength(1);
    expect(live[0].position[0]).toBeGreaterThan(0);
    expect(spots.filter((spot) => spot.kind === 'glow')).toHaveLength(2);
  });

  it('ships a baked 128 px ember glow image', () => {
    const path = 'public/textures/ember-glow.png';
    expect(existsSync(path)).toBe(true);
    const png = readFileSync(path);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(128);
    expect(png.readUInt32BE(20)).toBe(128);
  });

  it('keeps fires on the street and away from the hero at the origin', () => {
    for (const { position: [x, , z] } of spots) {
      expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(6);
      expect(Math.abs(x)).toBeLessThanOrEqual(12);
      expect(Math.abs(z)).toBeLessThanOrEqual(30);
    }
  });
});

describe('fireFlicker', () => {
  it('stays in a believable band, is deterministic, and varies over time and between fires', () => {
    const samples = Array.from({ length: 200 }, (_, i) => fireFlicker(i * 0.05, 1));
    expect(samples.every((value) => value > 0.55 && value < 1.45)).toBe(true);
    expect(fireFlicker(3.2, 1)).toBe(fireFlicker(3.2, 1));
    expect(new Set(samples.map((value) => value.toFixed(3))).size).toBeGreaterThan(50);
    expect(fireFlicker(3.2, 1)).not.toBe(fireFlicker(3.2, 2));
  });

  it('is exactly steady when motion is reduced', () => {
    expect(fireFlicker(1.7, 1, 0)).toBe(1);
    expect(fireFlicker(9.1, 2, 0)).toBe(1);
  });
});
