import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

const collection = [
  {
    id: 'haro-green',
    title: 'Haro Green',
    category: 'Support Unit',
    description: 'A compact companion unit.',
    tags: ['mascot', 'support'],
    model: '/models/haro-green.glb',
  },
];

const stages = [
  {
    id: 'hangar',
    name: 'Hangar',
    background: '#101827',
    gridColor: '#3b82f6',
    accentColor: '#67e8f9',
    ambientIntensity: 1,
    directionalIntensity: 1,
  },
  {
    id: 'space',
    name: 'Space',
    background: '#030712',
    gridColor: '#8b5cf6',
    accentColor: '#c4b5fd',
    ambientIntensity: 0.6,
    directionalIntensity: 0.8,
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(payload: unknown, ok = true) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return {
      ok,
      status: ok ? 200 : 500,
      json: async () => (url.endsWith('/stages.json') ? stages : payload),
    } as Response;
  });
}

describe('command UI', () => {
  it('renders the loading state before local collection data resolves', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => undefined));

    render(<App />);

    expect(screen.getByText('Loading collection…')).toBeInTheDocument();
  });

  it('renders the hero command deck and dispatches unit, slot, and stage actions', async () => {
    mockFetch(collection);
    render(<App />);

    expect(await screen.findByRole('button', { name: /Haro Green/i })).toBeInTheDocument();
    expect(screen.getByText('Hero display')).toBeInTheDocument();
    expect(screen.getByText('Support Unit')).toBeInTheDocument();
    expect(screen.getByText('mascot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Deployment slot Alpha/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Haro Green/i }));
    expect(screen.getByText('Loading unit…')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Deployment slot Alpha/i }));
    expect(screen.getByRole('button', { name: /Deployment slot Alpha/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Space stage' }));
    expect(screen.getByRole('button', { name: 'Space stage' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows partial, empty, and collection error states', async () => {
    mockFetch([{ id: 'valid', title: 'Valid', category: 'Unit', model: '/valid.glb' }, { title: 'Invalid' }]);
    render(<App />);
    expect(await screen.findByText('Some units were skipped: 1')).toBeInTheDocument();

    mockFetch([]);
    render(<App />);
    expect(await screen.findByText('No units available')).toBeInTheDocument();

    mockFetch(null, false);
    render(<App />);
    expect(await screen.findByText('Collection unavailable')).toBeInTheDocument();
  });
});
