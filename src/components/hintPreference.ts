export const HINT_STORAGE_KEY = 'digital-shelf.controlsHintDismissed';

/** Whether the user has closed the controls hint before; false if storage is unavailable. */
export function isHintDismissed(): boolean {
  try {
    return localStorage.getItem(HINT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function rememberHintDismissed(): void {
  try {
    localStorage.setItem(HINT_STORAGE_KEY, '1');
  } catch {
    // Storage blocked: the hint simply shows again next visit.
  }
}
