import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Scene, Vector3 } from 'three';
import { StageScene } from '../src/scene/StageScene';
import type { CollectionRecord, StageRecord } from '../src/app/types';
import { HeroModel, getRotationRadians } from '../src/scene/HeroModel';
import { getHeroCameraDefaults, getHeroControlsMode } from '../src/scene/HeroCanvas';

const { sceneState } = vi.hoisted(() => ({
  sceneState: {
    scene: null as Scene | null,
    camera: { position: { set: vi.fn() }, lookAt: vi.fn(), updateProjectionMatrix: vi.fn() },
  },
}));
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
  useThree: (selector: (state: unknown) => unknown) => selector({
    gl: { domElement: document.createElement('canvas') },
    scene: sceneState.scene,
    camera: sceneState.camera,
  }),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  PresentationControls: ({ children }: { children: React.ReactNode }) => <div data-testid="presentation-controls">{children}</div>,
  Grid: () => <div data-testid="grid" />,
  useGLTF: () => ({ scene: {} }),
}));

const unit: CollectionRecord = {
  id: 'light-guncannon',
  title: 'Light Guncannon',
  category: 'Support Unit',
  model: '/models/light-guncannon.glb',
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
  beforeEach(() => {
    sceneState.scene = new Scene();
    sceneState.camera.position.set.mockClear();
    sceneState.camera.lookAt.mockClear();
  });
  describe('getHeroCameraDefaults', () => {
    it('uses a street-facing city framing aligned with the roadway', () => {
      const camera = getHeroCameraDefaults(ruinedCityStage);
      const direction = new Vector3(...camera.target).sub(new Vector3(...camera.position)).normalize();

      expect(camera).toEqual({
        position: [4.3, 1.8, 48.3],
        target: [0, 10.3, 0],
      });
      expect(Math.abs(direction.z)).toBeGreaterThan(Math.abs(direction.x) * 2);
      expect(direction.y).toBeGreaterThan(0);
      expect(camera.position[1]).toBeLessThan(camera.target[1]);
    });

    it('preserves explicit record framing for the city stage', () => {
      const camera = {
        position: [1, 2, 3] as [number, number, number],
        target: [4, 5, 6] as [number, number, number],
      };

      expect(getHeroCameraDefaults(ruinedCityStage, camera)).toEqual(camera);
    });

    it('frames the maintenance bay and forest clearing from distinct fitted directions', () => {
      expect(getHeroCameraDefaults(stage)).toEqual({ position: [11.2, 15.9, 47.5], target: [0, 10.3, 0] });
      expect(getHeroCameraDefaults(forestStage)).toEqual({ position: [-11.1, 3.3, 47.3], target: [0, 10.3, 0] });
      const camera = { position: [1, 2, 3] as [number, number, number], target: [4, 5, 6] as [number, number, number] };
      expect(getHeroCameraDefaults(stage, camera)).toEqual(camera);
      expect(getHeroCameraDefaults(forestStage, camera)).toEqual(camera);
    });

    it('puts the camera at the same fixed spot every time a stage is shown, whatever was shown before', async () => {
      const { HeroCanvas } = await import('../src/scene/HeroCanvas');
      const view = render(<HeroCanvas unit={unit} stage={forestStage} requestId={1} cameraResetId={0} />);
      const forestCall = sceneState.camera.position.set.mock.calls.at(-1);
      expect(forestCall).toEqual([-11.1, 3.3, 47.3]);

      view.rerender(<HeroCanvas unit={unit} stage={ruinedCityStage} requestId={2} cameraResetId={0} />);
      expect(sceneState.camera.position.set.mock.calls.at(-1)).toEqual([4.3, 1.8, 48.3]);
      view.rerender(<HeroCanvas unit={unit} stage={stage} requestId={3} cameraResetId={0} />);
      expect(sceneState.camera.position.set.mock.calls.at(-1)).toEqual([11.2, 15.9, 47.5]);
      view.rerender(<HeroCanvas unit={unit} stage={forestStage} requestId={4} cameraResetId={0} />);
      expect(sceneState.camera.position.set.mock.calls.at(-1)).toEqual(forestCall);
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
    rerender(<StageScene stage={spaceStage} />);
    expect(sceneState.scene.fog).toBeNull();
    expect(container.querySelector('gridHelper')).not.toBeNull();
    rerender(<StageScene stage={forestStage} />);
    expect(sceneState.scene.fog).not.toBeNull();
    unmount();
    expect(sceneState.scene.fog).toBeNull();
  });

  it('renders the painted sky dome for the daylight stages only, even without a canvas context', () => {
    const { container, rerender } = render(<StageScene stage={forestStage} />);
    expect(container.querySelector('[data-testid="sky-dome"]')).not.toBeNull();
    rerender(<StageScene stage={ruinedCityStage} />);
    expect(container.querySelector('[data-testid="sky-dome"]')).not.toBeNull();
    expect(container.querySelector('gridHelper')).toBeNull();
    rerender(<StageScene stage={spaceStage} />);
    expect(container.querySelector('[data-testid="sky-dome"]')).toBeNull();
    expect(container.querySelector('gridHelper')).not.toBeNull();
  });

  it('lights the Hangar from the front without a floor grid, and only the Hangar', () => {
    const { container, rerender } = render(<StageScene stage={stage} />);
    expect(container.querySelector('gridHelper')).toBeNull();
    const lights = Array.from(container.querySelectorAll('directionalLight'));
    expect(lights.length).toBe(3);
    const frontLights = lights.filter((light) => Number(light.getAttribute('position')?.split(',')[2]) > 25);
    expect(frontLights).toHaveLength(2);
    for (const light of frontLights) {
      const [red, , blue] = [1, 3, 5].map((i) => parseInt((light.getAttribute('color') ?? '#ffffff').slice(i, i + 2), 16));
      expect(red).toBeGreaterThan(blue);
    }
    rerender(<StageScene stage={spaceStage} />);
    expect(container.querySelectorAll('directionalLight')).toHaveLength(1);
  });

  describe('model placement', () => {
    it('converts display.rotationYDegrees to radians, clockwise from above for positive degrees', () => {
      expect(getRotationRadians(undefined)).toBe(0);
      expect(getRotationRadians(90)).toBeCloseTo(-Math.PI / 2);
      expect(getRotationRadians(-90)).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('static model placement', () => {
    const placed: CollectionRecord = { ...unit, display: { scale: 20.6, groundOffset: 0.5, rotationYDegrees: 90 } };

    it('applies the stored scale and ground offset without measuring the model', () => {
      render(<HeroModel record={placed} onLoaded={vi.fn()} />);
      const group = screen.getByTestId('hero-model');
      expect(group.getAttribute('scale')).toBe('20.6');
      expect(group.firstElementChild?.getAttribute('position')).toBe('0,0.5,0');
    });

    it('falls back to scale 1 and no offset when the record stores nothing', () => {
      render(<HeroModel record={{ ...unit, display: undefined }} onLoaded={vi.fn()} />);
      const group = screen.getByTestId('hero-model');
      expect(group.getAttribute('scale')).toBe('1');
      expect(group.firstElementChild?.getAttribute('position')).toBe('0,0,0');
    });

    it('renders identically every time the same model is mounted again', () => {
      const first = render(<HeroModel record={placed} onLoaded={vi.fn()} />);
      const before = first.container.innerHTML;
      first.unmount();
      const second = render(<HeroModel record={{ ...unit, id: 'other', display: undefined }} onLoaded={vi.fn()} />);
      second.unmount();
      const third = render(<HeroModel record={placed} onLoaded={vi.fn()} />);
      expect(third.container.innerHTML).toBe(before);
    });
  });

  it('renders one canvas with orbit controls and the selected model URL', async () => {
    const { HeroCanvas } = await import('../src/scene/HeroCanvas');

    render(<HeroCanvas unit={unit} stage={stage} requestId={1} cameraResetId={0} />);

    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    expect(screen.getByTestId('hero-model')).toBeInTheDocument();
  });

  it('spins a platform under a fixed camera on the Hangar and orbits the camera elsewhere', async () => {
    const { HeroCanvas } = await import('../src/scene/HeroCanvas');
    expect(getHeroControlsMode(stage)).toBe('turntable');
    expect(getHeroControlsMode(forestStage)).toBe('orbit');
    expect(getHeroControlsMode(ruinedCityStage)).toBe('orbit');
    expect(getHeroControlsMode(spaceStage)).toBe('orbit');

    const hangar = render(<HeroCanvas unit={unit} stage={stage} requestId={1} cameraResetId={0} />);
    expect(screen.getByTestId('presentation-controls')).toContainElement(screen.getByTestId('hero-model'));
    expect(screen.getByTestId('presentation-controls')).toContainElement(screen.getByTestId('turntable'));
    hangar.unmount();

    render(<HeroCanvas unit={unit} stage={forestStage} requestId={1} cameraResetId={0} />);
    expect(screen.queryByTestId('presentation-controls')).not.toBeInTheDocument();
    expect(screen.queryByTestId('turntable')).not.toBeInTheDocument();
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
  });

  it('shows an empty hero state without rendering a model when no unit is selected', async () => {
    const { HeroCanvas } = await import('../src/scene/HeroCanvas');

    render(<HeroCanvas unit={null} stage={stage} requestId={0} cameraResetId={0} />);

    expect(screen.getByRole('status')).toHaveTextContent('Select a unit from the roster');
    expect(screen.queryByTestId('hero-model')).not.toBeInTheDocument();
  });
});
