import type { StageBackdropConfig, StageRecord } from '../app/types';

export class StageLoadError extends Error {
  readonly code = 'stage-error' as const;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StageLoadError';
  }
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(value);

const isBackdropVariant = (value: unknown): value is StageBackdropConfig['variant'] =>
  value === 'hangar' || value === 'space' || value === 'ruined-city';

const isNonNegativeFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const defaultBackdrop: StageBackdropConfig = {
  variant: 'hangar',
  particleCount: 0,
  motion: 0,
};

const validateBackdropConfig = (value: unknown): StageBackdropConfig | null => {
  if (!value || typeof value !== 'object') return null;
  const backdrop = value as Record<string, unknown>;
  if (
    !isBackdropVariant(backdrop.variant) ||
    !isNonNegativeFiniteNumber(backdrop.particleCount) ||
    !isNonNegativeFiniteNumber(backdrop.motion)
  ) {
    return null;
  }
  return {
    variant: backdrop.variant,
    particleCount: backdrop.particleCount,
    motion: backdrop.motion,
  };
};

export function validateStageRecord(value: unknown): StageRecord | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (
    !isNonEmptyString(record.id) ||
    !isNonEmptyString(record.name) ||
    !isColor(record.background) ||
    !isColor(record.gridColor) ||
    !isColor(record.accentColor) ||
    typeof record.ambientIntensity !== 'number' ||
    !Number.isFinite(record.ambientIntensity) ||
    typeof record.directionalIntensity !== 'number' ||
    !Number.isFinite(record.directionalIntensity)
  ) {
    return null;
  }
  if (record.backdrop === undefined) {
    return { ...record, backdrop: defaultBackdrop } as unknown as StageRecord;
  }

  const backdrop = validateBackdropConfig(record.backdrop);
  return backdrop ? ({ ...record, backdrop } as unknown as StageRecord) : null;
}

export async function loadStages(url: string): Promise<StageRecord[]> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new StageLoadError(`Unable to fetch stages from ${url}`, { cause: error });
  }
  if (!response.ok) {
    throw new StageLoadError(`Stage request failed with status ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new StageLoadError('Stage JSON could not be parsed', { cause: error });
  }
  if (!Array.isArray(payload)) {
    throw new StageLoadError('Stage payload must be an array');
  }

  const records = payload.flatMap((item) => {
    const record = validateStageRecord(item);
    return record ? [record] : [];
  });
  if (records.length === 0) {
    throw new StageLoadError('Stage payload contains no valid stages');
  }
  return records;
}
