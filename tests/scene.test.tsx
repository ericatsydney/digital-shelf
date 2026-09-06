import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CollectionRecord, StageRecord } from '../src/app/types';

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
};

describe('hero scene', () => {
  it('renders one canvas with orbit controls and the selected model URL', async () => {
    const { HeroCanvas } = await import('../src/scene/HeroCanvas');

    render(<HeroCanvas unit={unit} stage={stage} requestId={1} />);

    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    expect(screen.getByTestId('hero-model')).toHaveAttribute('data-model-url', unit.model);
  });

  it('shows an empty hero state without rendering a model when no unit is selected', async () => {
    const { HeroCanvas } = await import('../src/scene/HeroCanvas');

    render(<HeroCanvas unit={null} stage={stage} requestId={0} />);

    expect(screen.getByRole('status')).toHaveTextContent('Select a unit from the roster');
    expect(screen.queryByTestId('hero-model')).not.toBeInTheDocument();
  });
});
