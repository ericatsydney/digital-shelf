import { Children, isValidElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { HangarBackdrop } from '../src/scene/HangarBackdrop';
import { getRuinedCityBuildings, StageBackdrop } from '../src/scene/StageBackdrop';

// Inspect R3F's element tree without mounting a WebGL canvas. These hooks only
// supply static scene configuration; animation is disabled for this inspection.
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useMemo: (factory: () => unknown) => factory(),
  useState: (initial: unknown) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
  useEffect: () => {},
}));

type SceneElement = React.ReactElement<{
  children?: ReactNode;
  args?: number[];
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transparent?: boolean;
}>;

function elements(node: ReactNode): SceneElement[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const element = child as SceneElement;
    if (typeof element.type === 'function') {
      return elements((element.type as (props: unknown) => ReactNode)(element.props));
    }
    return [element, ...elements(element.props.children)];
  });
}

function materials(scene: ReactNode, geometry: string, args?: number[], color?: string) {
  return elements(scene).filter((element) => element.type === 'mesh').flatMap((mesh) => {
    const children = elements(mesh.props.children);
    const shape = children.find((child) => child.type === geometry);
    if (!shape || (args && JSON.stringify(shape.props.args) !== JSON.stringify(args))) return [];
    return children.filter((child) =>
      typeof child.type === 'string' && child.type.endsWith('Material') && (!color || child.props.color === color),
    );
  });
}

function expectRoughSurface(materialsToCheck: SceneElement[], count: number) {
  expect(materialsToCheck).toHaveLength(count);
  for (const material of materialsToCheck) {
    expect(material.type).toBe('meshStandardMaterial');
    expect(material.props.roughness).toBeGreaterThanOrEqual(0.9);
    expect(material.props.metalness ?? 0).toBe(0);
  }
}

const accentColor = '#55d6ff';
const city = <StageBackdrop stage={{ accentColor }} config={{ variant: 'ruined-city', particleCount: 0, motion: 0 }} />;

describe('shaded stage surfaces', () => {
  it('shades both yellow Hangar floor-marking shapes as rough paint', () => {
    const hangar = <HangarBackdrop color={accentColor} />;
    expectRoughSurface(materials(hangar, 'boxGeometry', [0.18, 0.025, 55], '#d1ae45'), 2);
    expectRoughSurface(materials(hangar, 'boxGeometry', [2.2, 0.03, 0.32], '#d1ae45'), 24);
  });

  it('shades city roads, sidewalks, divider, curbs, and the pad base', () => {
    expectRoughSurface(materials(city, 'boxGeometry', [19.8, 0.08, 60], '#17181d'), 1);
    expectRoughSurface(materials(city, 'boxGeometry', [2.4, 0.16, 60], '#4b3b3b'), 2);
    expectRoughSurface(materials(city, 'boxGeometry', [1, 0.04, 60], '#8e7659'), 1);
    expectRoughSurface(materials(city, 'boxGeometry', [0.2, 0.22, 60], accentColor), 2);
    const pad = materials(city, 'cylinderGeometry', [1.55, 1.55, 0.035, 32], '#2b2327');
    expectRoughSurface(pad, 1);
    expect(pad[0].props).toMatchObject({ transparent: true, opacity: 0.95 });
  });

  it('shades every city building body and roof cap', () => {
    for (const building of getRuinedCityBuildings()) {
      expectRoughSurface(materials(city, 'boxGeometry', building.size, building.color), 1);
      const [width, , depth] = building.size;
      const roof = materials(city, 'boxGeometry', [width + 0.12, 0.12, depth + 0.12], accentColor);
      expectRoughSurface(roof, 1);
      expect(roof[0].props).toMatchObject({ transparent: true, opacity: 0.18 });
    }
  });

  it('keeps windows, lane indicators, scan rings, and Hangar light strips luminous', () => {
    const windows = materials(city, 'boxGeometry', undefined, '#ffc777');
    expect(windows).toHaveLength(24);
    const laneIndicators = materials(city, 'boxGeometry', [0.08, 0.02, 2.4], accentColor);
    expect(laneIndicators).toHaveLength(48);
    const rings = materials(city, 'torusGeometry', undefined, accentColor);
    expect(rings).toHaveLength(2);
    const hangarLights = materials(<HangarBackdrop color={accentColor} />, 'boxGeometry', [0.14, 12, 0.4], accentColor);
    expect(hangarLights.length).toBeGreaterThan(0);
    for (const material of [...windows, ...laneIndicators, ...rings, ...hangarLights]) {
      expect(material.type).toBe('meshBasicMaterial');
    }
  });
});
