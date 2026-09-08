import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CollectionRecord, StageRecord } from '../src/app/types';
import { getHeightAwareScale } from '../src/scene/HeroModel';
import { getHeroCameraDefaults } from '../src/scene/HeroCanvas';

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
  useThree: () => ({ gl: { domElement: document.createElement('canvas') } }),
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

describe('hero scene', () => {
  describe('getHeroCameraDefaults', () => {
    it('uses a wider city framing aimed above the road when no camera is specified', () => {
      expect(getHeroCameraDefaults(ruinedCityStage)).toEqual({
        position: [42, 28, 54],
        target: [0, 8, 0],
      });
    });

    it('preserves explicit record framing for the city stage', () => {
      const camera = {
        position: [1, 2, 3] as [number, number, number],
        target: [4, 5, 6] as [number, number, number],
      };

      expect(getHeroCameraDefaults(ruinedCityStage, camera)).toEqual(camera);
    });

    it('keeps the existing defaults for non-city stages', () => {
      const expected = { position: [4, 2.5, 6], target: [0, 0, 0] };

      expect(getHeroCameraDefaults(stage)).toEqual(expected);
      expect(getHeroCameraDefaults(spaceStage)).toEqual(expected);
    });
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

    render(<HeroCanvas unit={unit} stage={stage} requestId={1} />);

    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    expect(screen.getByTestId('hero-model')).toBeInTheDocument();
  });

  it('shows an empty hero state without rendering a model when no unit is selected', async () => {
    const { HeroCanvas } = await import('../src/scene/HeroCanvas');

    render(<HeroCanvas unit={null} stage={stage} requestId={0} />);

    expect(screen.getByRole('status')).toHaveTextContent('Select a unit from the roster');
    expect(screen.queryByTestId('hero-model')).not.toBeInTheDocument();
  });
});
