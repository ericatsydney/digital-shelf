import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

const collection = [
  {
    id: 'light-guncannon',
    title: 'Light Guncannon',
    category: 'Support Unit',
    description: 'A compact companion unit.',
    tags: ['mascot', 'support'],
    model: '/models/light-guncannon.glb',
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

  it('renders a single-model command deck without deployment controls', async () => {
    mockFetch(collection);
    render(<App />);

    expect(await screen.findByRole('button', { name: /Light Guncannon/i })).toBeInTheDocument();
    expect(screen.getByText('Hero display')).toBeInTheDocument();
    expect(screen.getByText('Support Unit')).toBeInTheDocument();
    expect(screen.getByText('mascot')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Deployment slot/i })).not.toBeInTheDocument();
    expect(screen.queryByText('DEPLOYMENT')).not.toBeInTheDocument();
    expect(screen.getByText('Select a unit from the roster to view it.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Light Guncannon/i }));
    expect(screen.getByText('Loading unit…')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Light Guncannon');
    expect(screen.queryByText('Hero display')).not.toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /Deployment slot/i })).not.toBeInTheDocument();
    expect(screen.queryByText('DEPLOYMENT')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Space stage' }));
    expect(screen.getByRole('button', { name: 'Space stage' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('replaces the selected model while retaining the active stage', async () => {
    mockFetch([...collection, { ...collection[0], id: 'sample-two', title: 'Sample Two', model: '/models/sample-two.glb' }]);
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /Light Guncannon/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Space stage' }));
    fireEvent.click(screen.getByRole('button', { name: /Sample Two/i }));

    expect(screen.getByRole('region', { name: 'Hero display' })).toHaveTextContent('Sample Two');
    expect(screen.getByRole('region', { name: 'Hero display' })).not.toHaveTextContent('Light Guncannon');
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
