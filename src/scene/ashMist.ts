import type { StageRecord } from '../app/types';

export type AshMistSettings = { ashCount: number; emberCount: number; hazeOpacity: number; ashSize: number; emberSize: number };
export type HazeLayer = { z: number; x: number; width: number; speed: number };
export type StepOptions = { delta: number; time: number; rise: boolean; motion: number };

/** The street volume the ash fills, from just behind the hero to past the camera. */
export const ASH_VOLUME = { halfWidth: 20, height: 40, zMin: -10, zMax: 42 };

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

/** A ninth of the reviewed prototype's particles (1400 ash, 140 embers) at half its flake size (0.55, 0.6), and a third of its haze; phones get half the particles. */
export function getAshMistSettings({ narrow }: { narrow: boolean }): AshMistSettings {
  const ashCount = Math.round(1400 / 9);
  const emberCount = Math.round(140 / 9);
  const shared = { hazeOpacity: 0.14 / 3, ashSize: 0.27, emberSize: 0.3 };
  return narrow
    ? { ashCount: Math.round(ashCount / 2), emberCount: Math.round(emberCount / 2), ...shared }
    : { ashCount, emberCount, ...shared };
}

/** Low dust planes every 7 m from the camera end of the street back towards the hero. */
export function getHazeLayers(): HazeLayer[] {
  return Array.from({ length: 14 }, (_, i) => ({
    z: 40 - i * 7,
    x: (seeded(i + 7) - 0.5) * 8,
    width: 40 + seeded(i + 3) * 20,
    speed: 0.002 + seeded(i + 11) * 0.003,
  }));
}

export function seedParticles(count: number, seed: number) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (seeded(seed + i) - 0.5) * 2 * ASH_VOLUME.halfWidth;
    positions[i * 3 + 1] = seeded(seed + i + 5000) * ASH_VOLUME.height;
    positions[i * 3 + 2] = ASH_VOLUME.zMin + seeded(seed + i + 9000) * (ASH_VOLUME.zMax - ASH_VOLUME.zMin);
    speeds[i] = 0.5 + seeded(seed + i + 13000) * 1.2;
  }
  return { positions, speeds };
}

/** Wind strength around 1: slow gusts that build and ease so the ash never drifts at a constant rate. */
export function windGust(time: number) {
  return 1 + 0.6 * Math.sin(time * 0.23) + 0.3 * Math.sin(time * 0.61 + 1.3);
}

/** Ash falls slowly and embers rise, both swirling sideways and in depth on gusting wind; anything leaving the volume wraps to the other side. */
export function stepParticles(positions: Float32Array, speeds: Float32Array, { delta, time, rise, motion }: StepOptions) {
  if (motion <= 0) return;
  const step = delta * motion;
  const gust = windGust(time);
  const { halfWidth, height, zMin, zMax } = ASH_VOLUME;
  for (let i = 0; i < speeds.length; i += 1) {
    // Each particle has its own phase, so neighbours eddy differently instead of moving in lockstep.
    const swirl = Math.sin(time * 0.45 + i * 1.7) * 0.5 + Math.sin(time * 1.1 + i * 0.6) * 0.2;
    positions[i * 3 + 1] += speeds[i] * step * (rise ? 0.35 : -0.4) + Math.sin(time * 0.8 + i * 2.9) * 0.08 * step;
    positions[i * 3] += (0.25 * gust + swirl) * step;
    positions[i * 3 + 2] += Math.sin(time * 0.37 + i * 2.3) * 0.35 * step;
    if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] += height;
    if (positions[i * 3 + 1] > height) positions[i * 3 + 1] -= height;
    if (positions[i * 3] > halfWidth) positions[i * 3] -= 2 * halfWidth;
    if (positions[i * 3] < -halfWidth) positions[i * 3] += 2 * halfWidth;
    if (positions[i * 3 + 2] > zMax) positions[i * 3 + 2] -= zMax - zMin;
    if (positions[i * 3 + 2] < zMin) positions[i * 3 + 2] += zMax - zMin;
  }
}

/** Only the Ruined City smoulders, and only on a confirmed GPU: CPU WebGL stalls on the full-screen haze. */
export function shouldShowAshMist(stage: { backdrop: Pick<StageRecord['backdrop'], 'variant'> }, softwareRendering: boolean | null) {
  return stage.backdrop.variant === 'ruined-city' && softwareRendering === false;
}
