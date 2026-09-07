import { describe, expect, it } from 'vitest';
import { validateStageRecord } from '../src/data/stages';

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
});
