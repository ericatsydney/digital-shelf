import { describe, expect, it } from 'vitest';
import { validateStageRecord } from '../src/data/stages';
import { getRuinedCityBuildings, getRuinedCityStreetDimensions } from '../src/scene/StageBackdrop';

describe('stage backdrop validation', () => {
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
      id: 'ruined-city', name: 'Ruined City', background: '#1b1515', gridColor: '#6c4037',
      accentColor: '#ff9b61', ambientIntensity: 0.7, directionalIntensity: 1,
      backdrop: { variant: 'ruined-city', particleCount: 12, motion: 0.12 },
    });
    const buildings = getRuinedCityBuildings();

    expect(stage?.backdrop.variant).toBe('ruined-city');
    expect(buildings).toHaveLength(8);
    expect(buildings.filter((building) => building.side === -1)).toHaveLength(4);
    expect(buildings.filter((building) => building.side === 1)).toHaveLength(4);
    expect(new Set(buildings.map((building) => building.size[1])).size).toBeGreaterThan(1);
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
      width >= 10 && width <= 18 && height >= 18 && height <= 32 && depth >= 12 && depth <= 24,
    )).toBe(true);
  });
});
