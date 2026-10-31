import { useSyncExternalStore } from 'react';

/** Download progress (0-100) of the model being fetched; drei's useProgress only counts items, so one big GLB never moves. */
let progress = 0;
const listeners = new Set<() => void>();

const publish = (value: number) => {
  if (value === progress) return;
  progress = value;
  listeners.forEach((listener) => listener());
};

export const getModelProgress = () => progress;
export const resetModelProgress = () => publish(0);
export const subscribeModelProgress = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const useModelProgress = () => useSyncExternalStore(subscribeModelProgress, getModelProgress);

type ProgressLoader = {
  load: (url: any, onLoad: any, onProgress?: (event: ProgressEvent) => void, onError?: any) => unknown;
};
const tracked = new WeakSet<object>();

/** Hooks a loader's progress events into the store; safe to call on every render (wraps once). */
export function trackModelProgress(loader: ProgressLoader): void {
  if (tracked.has(loader)) return;
  tracked.add(loader);
  const load = loader.load.bind(loader);
  loader.load = (url, onLoad, onProgress, onError) =>
    load(
      url,
      onLoad,
      (event: ProgressEvent) => {
        if (event.lengthComputable && event.total > 0) publish((event.loaded / event.total) * 100);
        onProgress?.(event);
      },
      onError,
    );
}
