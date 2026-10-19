export type CollectionRecord = {
  id: string;
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  model: string;
  heightMeters?: number;
  thumbnail?: string;
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
  display?: {
    stageId?: string;
    scale?: number;
    /** Clockwise (seen from above) turn applied to the model, in degrees. */
    rotationYDegrees?: number;
  };
};

export type StageBackdropConfig = {
  variant: 'hangar' | 'forest' | 'space' | 'ruined-city';
  particleCount: number;
  motion: number;
};

export type StageRecord = {
  id: string;
  name: string;
  background: string;
  gridColor: string;
  accentColor: string;
  ambientIntensity: number;
  directionalIntensity: number;
  backdrop: StageBackdropConfig;
};
