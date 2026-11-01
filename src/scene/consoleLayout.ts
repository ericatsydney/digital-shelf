import { getHangarLayout } from './environmentLayout';

export const CONSOLE_LOG_LINES = 40;

type Box = { position: [number, number, number]; size: [number, number, number] };

export type ConsoleLayout = {
  /** A thin dark frame set against the wall, just behind the screen. */
  frame: Box;
  /** The glowing log screen: a plane whose normal points along +x, towards the right-hand wall. */
  screen: { position: [number, number, number]; size: [number, number]; rotationY: number };
};

/** A big status screen hung on the left wall between the second and third wall posts, above the bottom bar and under the corridor deck. */
export function getConsoleLayout(): ConsoleLayout {
  const { width, floorY } = getHangarLayout();
  const wallX = -width / 2;
  const screenSize: [number, number] = [7.2, 4.6];
  const frameThickness = 0.3;
  const y = floorY + 7.4;
  const z = -5;
  return {
    frame: { position: [wallX + 0.05 + frameThickness / 2, y, z], size: [frameThickness, screenSize[1] + 0.8, screenSize[0] + 0.8] },
    screen: { position: [wallX + 0.05 + frameThickness + 0.02, y, z], size: screenSize, rotationY: Math.PI / 2 },
  };
}

const MODULES = ['REACTOR', 'ARM-L', 'ARM-R', 'LEG-L', 'LEG-R', 'FCS', 'THERMAL', 'HYDRAUL', 'COMMS', 'SENSOR', 'BACKPACK', 'GYRO'];
const STATES = ['OK', 'NOMINAL', 'SYNC', 'LOCKED', 'READY', 'CHECK', 'IDLE', 'STABLE'];

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

/** Deterministic fake diagnostic log lines; the block repeats every `count` lines so it can scroll seamlessly. */
export function consoleLogLines(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const module = MODULES[Math.floor(seeded(i * 7 + 1) * MODULES.length)];
    const state = STATES[Math.floor(seeded(i * 13 + 2) * STATES.length)];
    const value = 60 + Math.floor(seeded(i * 17 + 3) * 40);
    return `${String(1000 + i * 37).padStart(4, '0')} ${module.padEnd(8)} ${state.padEnd(7)} ${value}%`;
  });
}

/** Texture v-offset for a log that moves up the screen: it falls with time and wraps within 0..1; zero motion holds still. */
export function scrollOffset(time: number, speed: number, motion: number): number {
  if (motion <= 0) return 0;
  const travelled = (time * speed * motion) % 1;
  return 1 - travelled;
}
