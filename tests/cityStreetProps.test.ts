import { describe, expect, it } from 'vitest';
import { getStreetDebris, wreckSpots } from '../src/scene/CityStreetProps';

describe('city street props', () => {
  const debris = getStreetDebris(19.8, 60);

  it('builds rubble heaps with brick bits, charred timber and rebar instead of uniform cubes', () => {
    expect(debris.heaps.length).toBeGreaterThan(10);
    for (const kind of ['bricks', 'charred', 'rebar'] as const) {
      expect(debris[kind].length).toBeGreaterThan(0);
    }
  });

  it('keeps debris and wrecks off the street between the buildings', () => {
    const all = [...debris.bricks, ...debris.charred, ...debris.rebar, ...debris.drums];
    for (const part of all) {
      expect(Math.abs(part.position[0])).toBeLessThan(19.8 / 2 + 2);
      expect(Math.abs(part.position[2])).toBeLessThan(30);
    }
    for (const spot of wreckSpots) expect(Math.abs(spot.position[0])).toBeLessThan(19.8 / 2);
  });

  it('keeps street heaps inside the street and off the hero model standing area', () => {
    for (const heap of debris.heaps) {
      expect(Math.abs(heap.center[0]) + heap.radius).toBeLessThan(19.8 / 2 + 2.5);
      const stretch = heap.stretch ?? 1;
      expect(Math.abs(heap.center[0]) - heap.radius < 3.5 && Math.abs(heap.center[1]) - heap.radius * stretch < 3.5).toBe(false);
    }
  });

  it('is deterministic', () => {
    expect(getStreetDebris(19.8, 60)).toEqual(debris);
  });
});

describe('facade damage', () => {
  it('gives every building blown-out bays and bare brick', async () => {
    const { getRuinedCityBuildings, getFacadeParts } = await import('../src/scene/RuinedCityBackdrop');
    getRuinedCityBuildings().forEach((building, index) => {
      const parts = getFacadeParts(building, index);
      // Shell holes that fall inside a missing-facade gap are dropped along with the wall.
      const expected = building.facadeLoss ? parts.holes.length : building.shellHoles;
      expect(parts.holes.length).toBeLessThanOrEqual(building.shellHoles);
      expect(parts.holes).toHaveLength(expected);
      expect(parts.hangingSlabs).toHaveLength(expected);
      expect(parts.columns).toHaveLength(expected * 2);
      if (!building.facadeLoss) expect(parts.brickPatches.length).toBeGreaterThan(0);
    });
  });
});

describe('missing facades', () => {
  it('strips the facade off some buildings to expose floor slabs, columns and a dark interior', async () => {
    const { getRuinedCityBuildings, getFacadeParts, getFacadeLossRegion } = await import('../src/scene/RuinedCityBackdrop');
    const buildings = getRuinedCityBuildings();
    const stripped = buildings.filter((building) => building.facadeLoss);
    expect(stripped.length).toBeGreaterThanOrEqual(3);
    expect(stripped.length).toBeLessThan(buildings.length);

    buildings.forEach((building, index) => {
      const parts = getFacadeParts(building, index);
      const region = getFacadeLossRegion(building);
      if (!region) {
        expect(parts.voids).toHaveLength(0);
        return;
      }
      expect(parts.voids).toHaveLength(1);
      expect(parts.frameSlabs.length).toBeGreaterThanOrEqual(2);
      expect(parts.frameColumns.length).toBeGreaterThanOrEqual(2);
      const insideGap = (position: [number, number, number]) =>
        position[2] > region.z0 && position[2] < region.z1 && position[1] > region.y0;
      for (const part of [...parts.windows, ...parts.sills, ...parts.balconySlabs, ...parts.holes, ...parts.brickPatches]) {
        expect(insideGap(part.position)).toBe(false);
      }
    });
  });
});
