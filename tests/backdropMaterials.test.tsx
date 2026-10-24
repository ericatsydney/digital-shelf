import { Children, isValidElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { HangarBackdrop } from '../src/scene/HangarBackdrop';
import { getRuinedCityBuildings, StageBackdrop } from '../src/scene/StageBackdrop';
import { Turntable } from '../src/scene/Turntable';

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
  it('has a light, rough Hangar floor and no yellow floor markings', () => {
    const hangar = <HangarBackdrop color={accentColor} />;
    expectRoughSurface(materials(hangar, 'boxGeometry', [58, 0.24, 90], '#968f85'), 1);
    expect(materials(hangar, 'boxGeometry', [0.18, 0.025, 55], '#d1ae45')).toHaveLength(0);
    expect(materials(hangar, 'boxGeometry', [2.2, 0.03, 0.32], '#d1ae45')).toHaveLength(0);
  });

  it('builds a rough steel turntable with a luminous accent ring', () => {
    const platform = <Turntable accentColor={accentColor} />;
    const all = elements(platform);
    const solids = all.filter((element) => element.type === 'meshStandardMaterial');
    expect(solids.length).toBeGreaterThanOrEqual(3);
    for (const material of solids) {
      expect(material.props.roughness).toBeGreaterThanOrEqual(0.5);
    }
    const ring = materials(platform, 'torusGeometry', undefined, accentColor);
    expect(ring).toHaveLength(1);
    expect(ring[0].type).toBe('meshBasicMaterial');
    expect(all.filter((element) => element.type === 'instancedMesh').length).toBeGreaterThanOrEqual(2);
  });

  it('uses three plain crates on pallets, with no black frame lines', () => {
    const hangar = <HangarBackdrop color={accentColor} />;
    const all = elements(hangar);
    expect(all.filter((element) => (element.props as { 'data-testid'?: string })['data-testid'] === 'cargo-crate')).toHaveLength(3);
    expect(all.filter((element) => element.type === 'meshStandardMaterial' && element.props.color === '#2f3438')).toHaveLength(0);
  });

  it('lays thick, slack floor cables with connectors at both ends', () => {
    const hangar = <HangarBackdrop color={accentColor} />;
    const all = elements(hangar);
    const tubes = all.filter((element) => element.type === 'tubeGeometry');
    expect(tubes.length).toBeGreaterThanOrEqual(2);
    for (const tube of tubes) expect((tube.props.args as number[])[2]).toBeGreaterThanOrEqual(0.22);
    expect(all.filter((element) => (element.props as { 'data-testid'?: string })['data-testid'] === 'cable-connector').length).toBeGreaterThanOrEqual(4);
  });

  it('keeps Hangar light strips luminous', () => {
    const hangarLights = materials(<HangarBackdrop color={accentColor} />, 'boxGeometry', [0.14, 12, 0.4], accentColor);
    expect(hangarLights.length).toBeGreaterThan(0);
    for (const material of hangarLights) expect(material.type).toBe('meshBasicMaterial');
  });

  it('builds a daylight street with only rough, non-metal solid surfaces', () => {
    const all = elements(city);
    const solids = all.filter((element) => element.type === 'meshStandardMaterial');
    expect(solids.length).toBeGreaterThan(20);
    for (const material of solids) {
      expect(material.props.roughness).toBeGreaterThanOrEqual(0.85);
      expect(material.props.metalness ?? 0).toBe(0);
    }
  });

  it('draws every building body in its weathered stone colour and drops the sci-fi props', () => {
    for (const building of getRuinedCityBuildings()) {
      expectRoughSurface(materials(city, 'boxGeometry', building.size, building.color), 1);
    }
    const all = elements(city);
    expect(all.filter((element) => element.type === 'torusGeometry')).toHaveLength(0);
    expect(materials(city, 'cylinderGeometry', [1.55, 1.55, 0.035, 32])).toHaveLength(0);
    expect(all.filter((element) => element.type === 'meshBasicMaterial' && element.props.color === '#ffc777')).toHaveLength(0);
  });

  it('batches repeated facade parts into instanced meshes to bound draw calls', () => {
    const all = elements(city);
    expect(all.filter((element) => element.type === 'instancedMesh').length).toBeGreaterThan(3);
    expect(all.filter((element) => element.type === 'mesh').length).toBeLessThan(120);
  });
});
