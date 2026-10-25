import { describe, expect, it } from 'vitest';
import { validateStageRecord } from '../src/data/stages';
import shippedStages from '../public/stages.json';
import { getRuinedCityBuildings, getRuinedCityStreetDimensions } from '../src/scene/StageBackdrop';

describe('stage backdrop validation', () => {
  it('accepts the static Forest backdrop', () => {
    expect(validateStageRecord({
      id: 'forest', name: 'Forest', background: '#15251f', gridColor: '#314b36',
      accentColor: '#a5c880', ambientIntensity: 0.85, directionalIntensity: 1.25,
      backdrop: { variant: 'forest', particleCount: 0, motion: 0 },
    })).toMatchObject({ backdrop: { variant: 'forest', particleCount: 0, motion: 0 } });
  });

  it('rejects unknown backdrop variants', () => {
    expect(validateStageRecord({
      ...shippedStages[0], backdrop: { variant: 'bogus', particleCount: 0, motion: 0 },
    })).toBeNull();
  });

  it('ships Hangar, Forest, and Ruined City as valid selectable stages', () => {
    const records = shippedStages.map(validateStageRecord);
    expect(records.every((record) => record !== null)).toBe(true);
    expect(records.map((record) => record?.id)).toEqual(['hangar', 'forest', 'ruined-city']);
    expect(records[2]).toMatchObject({
      name: 'Ruined City', background: '#8d9ca6', ambientIntensity: 0.7, directionalIntensity: 1.2,
    });
    expect(records[1]).toMatchObject({
      name: 'Forest', background: '#78bcd8', gridColor: '#314b36',
      accentColor: '#a5c880', ambientIntensity: 1, directionalIntensity: 1.7,
      backdrop: { variant: 'forest', particleCount: 0, motion: 0 },
    });
  });

  it('accepts a configured hologram backdrop', () => {
    expect(validateStageRecord({
      id: 'space', name: 'Space', background: '#02040c', gridColor: '#29336d',
      accentColor: '#8d9cff', ambientIntensity: 0.35, directionalIntensity: 0.85,
      backdrop: { variant: 'space', particleCount: 80, motion: 0.4 },
    })).toMatchObject({ backdrop: { variant: 'space', particleCount: 80, motion: 0.4 } });
  });

  it('adds safe Hangar defaults when backdrop is omitted', () => {
    expect(validateStageRecord({
      id: 'hangar', name: 'Hangar', background: '#07111f', gridColor: '#284c6e',
      accentColor: '#55d6ff', ambientIntensity: 0.6, directionalIntensity: 1.2,
    })).toMatchObject({ backdrop: { variant: 'hangar', particleCount: 0, motion: 0 } });
  });

  it('skips records with invalid explicit backdrop settings', () => {
    expect(validateStageRecord({
      id: 'space', name: 'Space', background: '#02040c', gridColor: '#29336d',
      accentColor: '#8d9cff', ambientIntensity: 0.35, directionalIntensity: 0.85,
      backdrop: { variant: 'space', particleCount: -1, motion: 0.4 },
    })).toBeNull();
  });

  it('keeps the ruined-city stage and exposes a balanced deterministic building layout', () => {
    const stage = validateStageRecord({
      id: 'ruined-city', name: 'Ruined City', background: '#8d9ca6', gridColor: '#6c4037',
      accentColor: '#ff9b61', ambientIntensity: 0.7, directionalIntensity: 1.2,
      backdrop: { variant: 'ruined-city', particleCount: 12, motion: 0.12 },
    });
    const buildings = getRuinedCityBuildings();

    expect(stage?.backdrop.variant).toBe('ruined-city');
    expect(buildings).toHaveLength(8);
    expect(buildings.filter((building) => building.side === -1)).toHaveLength(4);
    expect(buildings.filter((building) => building.side === 1)).toHaveLength(4);
    expect(new Set(buildings.map((building) => building.size[1])).size).toBeGreaterThan(1);
  });

  it('gives every ruined-city building weathered stone, windows, a roof style and shell damage', () => {
    const buildings = getRuinedCityBuildings();
    expect(buildings).toEqual(getRuinedCityBuildings());
    expect(new Set(buildings.map((building) => building.roof))).toEqual(new Set(['flat', 'broken']));
    expect(buildings.some((building) => building.cornerCut)).toBe(true);
    expect(buildings.some((building) => building.balconies > 0)).toBe(true);
    for (const building of buildings) {
      expect(building.windowRows).toBeGreaterThanOrEqual(3);
      expect(building.windowColumns).toBeGreaterThanOrEqual(3);
      expect(building.shellHoles).toBeGreaterThanOrEqual(1);
      const [red, green, blue] = [1, 3, 5].map((i) => parseInt(building.color.slice(i, i + 2), 16));
      expect(red).toBeGreaterThanOrEqual(0x80);
      expect(red).toBeLessThanOrEqual(0xa0);
      expect(red >= green && green >= blue).toBe(true);
    }
  });

  it('caps every ruined-city building at five floors and derives its height from the floor count', () => {
    const buildings = getRuinedCityBuildings();
    for (const building of buildings) {
      expect(building.windowRows).toBeGreaterThanOrEqual(3);
      expect(building.windowRows).toBeLessThanOrEqual(5);
      expect(building.size[1]).toBeCloseTo(4 + building.windowRows * 3.3, 5);
    }
    expect(new Set(buildings.map((building) => building.windowRows)).size).toBeGreaterThan(1);
  });

  it('uses real-world proportions for the six-lane street canyon', () => {
    const dimensions = getRuinedCityStreetDimensions();
    const buildings = getRuinedCityBuildings();

    expect(dimensions).toMatchObject({
      laneCount: 6,
      laneWidth: 3.3,
      roadwayWidth: 19.8,
      sidewalkWidth: 2.4,
      centerDividerWidth: 1,
    });
    expect(buildings.every(({ size: [width, height, depth] }) =>
      width >= 10 && width <= 18 && height >= 13 && height <= 21 && depth >= 12 && depth <= 24,
    )).toBe(true);
  });
});
