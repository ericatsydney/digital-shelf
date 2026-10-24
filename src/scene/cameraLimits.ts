import type { StageRecord } from '../app/types';

export type CameraLimits = {
  /** Height of the ground the orbit camera must stay above; undefined when the stage has no ground. */
  floorY?: number;
  /** Closest the orbit camera may get to `floorY`. */
  minHeightAboveFloor: number;
  /** Farthest the orbit camera may zoom out from its target, so the view never leaves the stage. */
  maxDistance: number;
};

/** The single place to tune how far the camera may roam on each stage. */
const cameraLimitsByStage: Record<StageRecord['backdrop']['variant'], CameraLimits> = {
  hangar: { minHeightAboveFloor: 1, maxDistance: 60 },
  forest: { floorY: 0, minHeightAboveFloor: 1, maxDistance: 62 },
  'ruined-city': { floorY: 0, minHeightAboveFloor: 1, maxDistance: 58 },
  space: { minHeightAboveFloor: 1, maxDistance: 11 },
};

export function getCameraLimits(stage: Pick<StageRecord, 'backdrop'>): CameraLimits {
  return cameraLimitsByStage[stage.backdrop.variant] ?? cameraLimitsByStage.space;
}
