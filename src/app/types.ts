export type CollectionRecord = {
  id: string;
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  model: string;
  thumbnail?: string;
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
  display?: {
    stageId?: string;
    scale?: number;
  };
};

export type StageRecord = {
  id: string;
  name: string;
  background: string;
  gridColor: string;
  accentColor: string;
  ambientIntensity: number;
  directionalIntensity: number;
};
