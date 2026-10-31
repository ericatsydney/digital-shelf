import { describe, expect, it, vi } from 'vitest';
import { getModelProgress, resetModelProgress, subscribeModelProgress, trackModelProgress } from '../src/scene/modelProgress';

type Loader = { load: (url: string, onLoad: () => void, onProgress?: (e: ProgressEvent) => void, onError?: () => void) => void };

function fakeLoader(events: Partial<ProgressEvent>[]) {
  const forwarded = vi.fn();
  const loader: Loader = {
    load: (_url, _onLoad, onProgress) => {
      for (const event of events) onProgress?.(event as ProgressEvent);
    },
  };
  return { loader, forwarded };
}

describe('model download progress', () => {
  it('reports the downloaded percentage and still forwards the original callback', () => {
    resetModelProgress();
    const { loader, forwarded } = fakeLoader([
      { lengthComputable: true, loaded: 50, total: 200 },
      { lengthComputable: true, loaded: 150, total: 200 },
    ]);
    trackModelProgress(loader);
    const seen: number[] = [];
    const unsubscribe = subscribeModelProgress(() => seen.push(getModelProgress()));

    loader.load('/m.glb', () => undefined, forwarded);

    expect(seen).toEqual([25, 75]);
    expect(forwarded).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('ignores events with an unknown length and does not double-wrap the loader', () => {
    resetModelProgress();
    const { loader, forwarded } = fakeLoader([
      { lengthComputable: false, loaded: 10, total: 0 },
      { lengthComputable: true, loaded: 100, total: 100 },
    ]);
    trackModelProgress(loader);
    trackModelProgress(loader);

    loader.load('/m.glb', () => undefined, forwarded);

    expect(getModelProgress()).toBe(100);
    expect(forwarded).toHaveBeenCalledTimes(2);
  });

  it('resets to zero', () => {
    resetModelProgress();
    expect(getModelProgress()).toBe(0);
  });
});
