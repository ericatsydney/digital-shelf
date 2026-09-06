import type { StageRecord } from '../app/types';

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
  return record as unknown as StageRecord;
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
