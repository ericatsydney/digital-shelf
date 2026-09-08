import type { CollectionRecord } from '../app/types';

export class CollectionLoadError extends Error {
  readonly code = 'collection-error' as const;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'CollectionLoadError';
  }
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isVector3 = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number' && Number.isFinite(item));

const isPositiveFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export function validateCollectionRecord(value: unknown): CollectionRecord | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  if (
    !isNonEmptyString(record.id) ||
    !isNonEmptyString(record.title) ||
    !isNonEmptyString(record.category) ||
    !isNonEmptyString(record.model)
  ) {
    return null;
  }

  if (record.description !== undefined && !isNonEmptyString(record.description)) return null;
  if (record.tags !== undefined && (!Array.isArray(record.tags) || !record.tags.every(isNonEmptyString))) return null;
  if (record.thumbnail !== undefined && !isNonEmptyString(record.thumbnail)) return null;
  if (record.heightMeters !== undefined && !isPositiveFiniteNumber(record.heightMeters)) return null;

  if (record.camera !== undefined) {
    if (!record.camera || typeof record.camera !== 'object') return null;
    const camera = record.camera as Record<string, unknown>;
    if (!isVector3(camera.position) || !isVector3(camera.target)) return null;
  }

  if (record.display !== undefined) {
    if (!record.display || typeof record.display !== 'object') return null;
    const display = record.display as Record<string, unknown>;
    if (display.stageId !== undefined && !isNonEmptyString(display.stageId)) return null;
    if (display.scale !== undefined && (typeof display.scale !== 'number' || !Number.isFinite(display.scale) || display.scale <= 0)) {
      return null;
    }
  }

  return record as unknown as CollectionRecord;
}

export async function loadCollection(url: string): Promise<{ records: CollectionRecord[]; skipped: number }> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new CollectionLoadError(`Unable to fetch collection from ${url}`, { cause: error });
  }

  if (!response.ok) {
    throw new CollectionLoadError(`Collection request failed with status ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new CollectionLoadError('Collection JSON could not be parsed', { cause: error });
  }

  if (!Array.isArray(payload)) {
    throw new CollectionLoadError('Collection payload must be an array');
  }

  const records: CollectionRecord[] = [];
  for (const item of payload) {
    const record = validateCollectionRecord(item);
    if (record) records.push(record);
  }

  return { records, skipped: payload.length - records.length };
}
