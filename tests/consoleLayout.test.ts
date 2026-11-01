import { describe, expect, it } from 'vitest';
import { getHangarLayout, getHangarSkeleton } from '../src/scene/environmentLayout';
import { CONSOLE_LOG_LINES, consoleLogLines, getConsoleLayout, scrollOffset } from '../src/scene/consoleLayout';

describe('hangar console', () => {
  it('hangs a big screen on the left wall, between the posts and between the bottom bar and the corridor deck, facing the right wall', () => {
    const bay = getHangarLayout();
    const layout = getConsoleLayout();
    const [x, y, z] = layout.screen.position;
    const [width, height] = layout.screen.size;
    // Against the left wall (its plane is at x = -29), not on the floor and with no desk.
    expect(x).toBeLessThan(-27);
    expect(x).toBeGreaterThan(-bay.width / 2);
    expect(layout).not.toHaveProperty('desk');
    expect(layout).not.toHaveProperty('keyboard');
    expect(layout).not.toHaveProperty('monitor');
    // Clear of the vertical posts.
    const leftPostZs = getHangarSkeleton().filter((box) => box.position[0] < -25 && box.size[1] > box.size[0] && box.size[1] < bay.height).map((box) => box.position[2]);
    for (const postZ of leftPostZs) expect(Math.abs(z - postZ)).toBeGreaterThan(width / 2 + 0.7);
    // Between the top of the bottom bar and the underside of the deck.
    const leftBars = getHangarSkeleton().filter((box) => box.position[0] < -25 && Math.max(...box.size) > bay.height);
    const [bottom, deck] = [...leftBars].sort((p, q) => p.position[1] - q.position[1]);
    expect(y - height / 2).toBeGreaterThan(bottom.position[1] + bottom.size[1] / 2);
    expect(y + height / 2).toBeLessThan(deck.position[1] - deck.size[1] / 2);
    expect(width).toBeGreaterThanOrEqual(5);
    // The plane's normal is +x, towards the right-hand wall, and the frame sits behind it against the wall.
    expect(layout.screen.rotationY).toBeCloseTo(Math.PI / 2, 5);
    expect(layout.frame.position[0]).toBeLessThan(x);
  });

  it('writes a deterministic, log-like block of green status lines', () => {
    const lines = consoleLogLines(CONSOLE_LOG_LINES);
    expect(lines).toHaveLength(CONSOLE_LOG_LINES);
    expect(consoleLogLines(CONSOLE_LOG_LINES)).toEqual(lines);
    expect(new Set(lines).size).toBeGreaterThan(CONSOLE_LOG_LINES * 0.8);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(34);
  });

  it('scrolls the log upward slowly and seamlessly, and holds still with reduced motion', () => {
    // The texture offset falls over time, which moves the text up the screen, and wraps within 0..1.
    const samples = [0, 1, 2, 3].map((t) => scrollOffset(t, 0.02, 1));
    expect(samples[1]).toBeLessThan(samples[0] + 1e-9);
    for (let i = 1; i < samples.length; i += 1) expect(samples[i]).toBeLessThan(samples[i - 1]);
    for (const t of [0, 7.3, 49.9, 120, 1000]) {
      expect(scrollOffset(t, 0.02, 1)).toBeGreaterThanOrEqual(0);
      expect(scrollOffset(t, 0.02, 1)).toBeLessThanOrEqual(1);
    }
    expect(Math.abs(scrollOffset(1, 0.02, 1) - scrollOffset(0, 0.02, 1))).toBeLessThan(0.05); // slow
    expect(scrollOffset(37, 0.02, 0)).toBe(scrollOffset(0, 0.02, 0));
  });
});
