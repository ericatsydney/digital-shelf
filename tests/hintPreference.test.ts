import { afterEach, describe, expect, it, vi } from 'vitest';
import { HINT_STORAGE_KEY, isHintDismissed, rememberHintDismissed } from '../src/components/hintPreference';

describe('hint preference', () => {
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it('shows the hint until the user closes it, then remembers that', () => {
    expect(isHintDismissed()).toBe(false);
    rememberHintDismissed();
    expect(localStorage.getItem(HINT_STORAGE_KEY)).toBe('1');
    expect(isHintDismissed()).toBe(true);
  });

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(isHintDismissed()).toBe(false);
    expect(() => rememberHintDismissed()).not.toThrow();
  });
});
