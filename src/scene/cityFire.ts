import type { Vec3 } from './Instanced';

export type CityFireSpot = { position: Vec3; scale: number; seed: number; kind: 'live' | 'glow' };

const motionAmount = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 1;

/** Street-space (pre-lift) positions, clear of the hero at the origin: one live fire on the wreck at the front right, and two long-dead fires (far-left wreck, right-kerb debris) drawn as static glow spots. */
export function getCityFireSpots(): CityFireSpot[] {
  return [
    { position: [-7.5, 0.45, -14], scale: 1.1, seed: 1, kind: 'glow' },
    { position: [7, 0.45, 16], scale: 1.0, seed: 2, kind: 'live' },
    { position: [9, -1.15, -4], scale: 0.85, seed: 3, kind: 'glow' },
  ];
}

/** Light and flame brightness multiplier around 1: layered sines at different speeds read as a living fire. */
export function fireFlicker(time: number, seed: number, amount = motionAmount) {
  const wobble = 0.17 * Math.sin(time * 9.1 + seed * 6.3) + 0.12 * Math.sin(time * 17.3 + seed * 3.1) + 0.07 * Math.sin(time * 31.7 + seed * 1.7);
  return 1 + wobble * amount;
}

export const fireMotionAmount = motionAmount;
