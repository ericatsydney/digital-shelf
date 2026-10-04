import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Box3, Scene, Vector3 } from 'three';
import { StageScene } from '../src/scene/StageScene';
import type { CollectionRecord, StageRecord } from '../src/app/types';
import { getHeightAwareScale } from '../src/scene/HeroModel';
import { getCameraFit, getHeroCameraDefaults } from '../src/scene/HeroCanvas';

const { sceneState } = vi.hoisted(() => ({ sceneState: { scene: null as Scene | null } }));
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
  useThree: (selector: (state: unknown) => unknown) => selector({
    gl: { domElement: document.createElement('canvas') },
    scene: sceneState.scene,
    camera: {
      position: { set: vi.fn() },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
    },
  }),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Grid: () => <div data-testid="grid" />,
  useGLTF: () => ({ scene: {} }),
}));

const unit: CollectionRecord = {
  id: 'haro-green',
  title: 'Haro Green',
  category: 'Support Unit',
  model: '/models/haro-green.glb',
  display: { scale: 1.25 },
};

const stage: StageRecord = {
  id: 'hangar',
  name: 'Hangar',
  background: '#07111f',
  gridColor: '#284c6e',
  accentColor: '#55d6ff',
  ambientIntensity: 0.6,
  directionalIntensity: 1.2,
  backdrop: {
    variant: 'hangar',
    particleCount: 0,
    motion: 0.2,
  },
};

const ruinedCityStage: StageRecord = {
  ...stage,
  id: 'ruined-city',
  name: 'Ruined City',
  backdrop: {
    ...stage.backdrop,
    variant: 'ruined-city',
  },
};

const spaceStage: StageRecord = {
  ...stage,
  id: 'space',
  name: 'Space',
  backdrop: {
    ...stage.backdrop,
    variant: 'space',
  },
};
const forestStage: StageRecord = { ...stage, id: 'forest', name: 'Forest', backdrop: { ...stage.backdrop, variant: 'forest' } };

describe('hero scene', () => {
  beforeEach(() => { sceneState.scene = new Scene(); });
  describe('getCameraFit', () => {
    it('returns a target at the bounds center and a distance that contains the model', () => {
      const fit = getCameraFit(
        new Box3(new Vector3(-1, -2, -1), new Vector3(1, 2, 1)),
        { position: [4, 2.5, 6], target: [0, 0, 0] },
        42,
      );

      expect(fit.target).toEqual([0, 0, 0]);
      expect(fit.position[1]).toBeGreaterThan(0);
      expect(fit.position[2]).toBeGreaterThan(7);
    });

    it('uses the narrower horizontal field of view for narrow canvases', () => {
      const wideBounds = new Box3(new Vector3(-4, -1, -1), new Vector3(4, 1, 1));
      const normalFit = getCameraFit(wideBounds, { position: [4, 2.5, 6], target: [0, 0, 0] }, 42, 1);
      const narrowFit = getCameraFit(wideBounds, { position: [4, 2.5, 6], target: [0, 0, 0] }, 42, 0.5);

      expect(narrowFit.position[2]).toBeGreaterThan(normalFit.position[2]);
    });

    it('falls back to the provided camera when bounds are invalid', () => {
      const fallback = { position: [4, 2.5, 6] as [number, number, number], target: [0, 0, 0] as [number, number, number] };

      expect(getCameraFit(new Box3(), fallback, 42)).toEqual(fallback);
    });
  });

  describe('getHeroCameraDefaults', () => {
    it('uses a street-facing city framing aligned with the roadway', () => {
      const camera = getHeroCameraDefaults(ruinedCityStage);
      const direction = new Vector3(...camera.target).sub(new Vector3(...camera.position)).normalize();

      expect(camera).toEqual({
        position: [10, 12, 34],
        target: [0, 5, 0],
      });
      expect(Math.abs(direction.z)).toBeGreaterThan(Math.abs(direction.x) * 2);
      expect(direction.y).toBeLessThan(0);
      expect(camera.position[1]).toBeGreaterThan(camera.target[1]);
    });

    it('preserves explicit record framing for the city stage', () => {
      const camera = {
        position: [1, 2, 3] as [number, number, number],
        target: [4, 5, 6] as [number, number, number],
      };

      expect(getHeroCameraDefaults(ruinedCityStage, camera)).toEqual(camera);
    });

    it('frames the maintenance bay and forest clearing from distinct fitted directions', () => {
      expect(getHeroCameraDefaults(stage)).toEqual({ position: [8, 10, 34], target: [0, 6, 0] });
      expect(getHeroCameraDefaults(forestStage)).toEqual({ position: [-8, 10, 34], target: [0, 6, 0] });
      const camera = { position: [1, 2, 3] as [number, number, number], target: [4, 5, 6] as [number, number, number] };
      expect(getHeroCameraDefaults(stage, camera)).toEqual(camera);
      expect(getHeroCameraDefaults(forestStage, camera)).toEqual(camera);
    });

    it('keeps the legacy Space defaults', () => {
      const expected = { position: [4, 2.5, 6], target: [0, 0, 0] };

      expect(getHeroCameraDefaults(spaceStage)).toEqual(expected);
    });
  });

  it('applies mild Forest fog and hides the grid, clearing fog on switching and unmount', () => {
    sceneState.scene = new Scene();
    const { container, rerender, unmount } = render(<StageScene stage={forestStage} />);
    expect(sceneState.scene.fog).toMatchObject({ near: 65, far: 150 });
    expect(container.querySelector('gridHelper')).toBeNull();
    rerender(<StageScene stage={stage} />);
    expect(sceneState.scene.fog).toBeNull();
    expect(container.querySelector('gridHelper')).not.toBeNull();
    rerender(<StageScene stage={forestStage} />);
    expect(sceneState.scene.fog).not.toBeNull();
    unmount();
    expect(sceneState.scene.fog).toBeNull();
  });

  describe('getHeightAwareScale', () => {
    it('scales a measured model to its declared height while preserving authored scale', () => {
      expect(getHeightAwareScale(2, 18, 1)).toBe(9);
      expect(getHeightAwareScale(2, 18, 1.25)).toBe(11.25);
    });

    it('falls back to authored scale when height metadata or measured bounds are unavailable', () => {
      expect(getHeightAwareScale(2, undefined, 1.25)).toBe(1.25);
      expect(getHeightAwareScale(0, 18, 1.25)).toBe(1.25);
    });
  });

  it('renders one canvas with orbit controls and the selected model URL', async () => {
    const { HeroCanvas } = await import('../src/scene/HeroCanvas');

    render(<HeroCanvas unit={unit} stage={stage} requestId={1} cameraResetId={0} />);

    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    expect(screen.getByTestId('hero-model')).toBeInTheDocument();
  });

  it('shows an empty hero state without rendering a model when no unit is selected', async () => {
    const { HeroCanvas } = await import('../src/scene/HeroCanvas');

    render(<HeroCanvas unit={null} stage={stage} requestId={0} cameraResetId={0} />);

    expect(screen.getByRole('status')).toHaveTextContent('Select a unit from the roster');
    expect(screen.queryByTestId('hero-model')).not.toBeInTheDocument();
  });
});
