import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

const canvasProps: { requestId: number; onError?: (id: number) => void }[] = [];

vi.mock('../src/scene/HeroCanvas', () => ({
  HeroCanvas: (props: { requestId: number; onError?: (id: number) => void }) => {
    canvasProps.push(props);
    return <div data-testid="canvas" data-request={props.requestId} />;
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  canvasProps.length = 0;
});

describe('model load retry', () => {
  it('offers Retry after a load error and re-requests the same unit', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      return {
        ok: true,
        status: 200,
        json: async () =>
          url.endsWith('/stages.json')
            ? []
            : [{ id: 'a', title: 'Unit A', category: 'Unit', model: '/models/a.glb' }],
      } as Response;
    });
    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Unit A' });
    expect(screen.queryByRole('button', { name: 'Retry loading model' })).not.toBeInTheDocument();

    const first = canvasProps[canvasProps.length - 1];
    act(() => first.onError?.(first.requestId));

    expect(screen.getByRole('alert')).toHaveTextContent('Model unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading model' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('canvas')).toHaveAttribute('data-request', String(first.requestId + 1));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Unit A');
  });
});
