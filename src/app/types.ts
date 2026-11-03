export type CollectionRecord = {
  id: string;
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  model: string;
  heightMeters?: number;
  thumbnail?: string;
  /** Transparent 2D render layered over a poster stage background. */
  poster?: string;
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
  display?: {
    stageId?: string;
    /** Final model scale; the app never measures the model at runtime. */
    scale?: number;
    /** Native-unit lift (added before scaling) so the feet sit on y = 0. */
    groundOffset?: number;
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
  /** When set, the stage is a 2D poster: this image fills the hero area and the unit's poster is layered on top. */
  posterBackground?: string;
};
