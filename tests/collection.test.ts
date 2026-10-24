import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CollectionLoadError,
  loadCollection,
  validateCollectionRecord,
} from '../src/data/collection';
import { StageLoadError, loadStages, validateStageRecord } from '../src/data/stages';

const validCollectionRecord = {
  id: 'light-guncannon',
  title: 'Light Guncannon',
  category: 'Mobile Suit',
  model: '/models/light-guncannon.glb',
  tags: ['mascot'],
};

const validStageRecord = {
  id: 'hangar',
  name: 'Hangar',
  background: '#07111f',
  gridColor: '#284c6e',
  accentColor: '#55d6ff',
  ambientIntensity: 0.6,
  directionalIntensity: 1.2,
  backdrop: {
    variant: 'hangar',
    particleCount: 0,
    motion: 0,
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('collection validation and loading', () => {
  it('accepts a valid identity record', () => {
    expect(validateCollectionRecord(validCollectionRecord)).toEqual(validCollectionRecord);
  });

  it('accepts a positive finite heightMeters value', () => {
    expect(
      validateCollectionRecord({
        id: 'light-guncannon',
        title: 'Light Guncannon',
        category: 'Figure',
        model: '/models/light-guncannon.glb',
        heightMeters: 18,
      }),
    ).toMatchObject({ heightMeters: 18 });
  });

  it('accepts records without heightMeters for backward compatibility', () => {
    expect(validateCollectionRecord(validCollectionRecord)).not.toBeNull();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid heightMeters: %s',
    (heightMeters) => {
      expect(
        validateCollectionRecord({
          id: 'invalid',
          title: 'Invalid',
          category: 'Figure',
          model: '/models/invalid.glb',
          heightMeters,
        }),
      ).toBeNull();
    },
  );

  it('skips records missing required fields and reports the skipped count', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([validCollectionRecord, { id: 'broken', title: 'Broken' }])),
      ),
    );

    await expect(loadCollection('/collection.json')).resolves.toEqual({
      records: [validCollectionRecord],
      skipped: 1,
    });
  });

  it('loads an empty array as an empty collection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]')));

    await expect(loadCollection('/collection.json')).resolves.toEqual({ records: [], skipped: 0 });
  });

  it('rejects a non-array collection payload as collection-error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ records: [] }))));

    await expect(loadCollection('/collection.json')).rejects.toMatchObject({
      code: 'collection-error',
    } satisfies Partial<CollectionLoadError>);
  });

  it('rejects a non-OK collection response as collection-error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })));

    await expect(loadCollection('/collection.json')).rejects.toMatchObject({
      code: 'collection-error',
    } satisfies Partial<CollectionLoadError>);
  });
});

describe('stage validation and loading', () => {
  it('accepts a valid stage record', () => {
    expect(validateStageRecord(validStageRecord)).toEqual(validStageRecord);
  });

  it('rejects invalid colors and non-finite intensities', () => {
    expect(validateStageRecord({ ...validStageRecord, background: 'blue' })).toBeNull();
    expect(validateStageRecord({ ...validStageRecord, ambientIntensity: Number.NaN })).toBeNull();
  });

  it('loads valid stages and skips invalid stage records', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([validStageRecord, { ...validStageRecord, id: '' }])),
      ),
    );

    await expect(loadStages('/stages.json')).resolves.toEqual([validStageRecord]);
  });

  it('rejects invalid stage payloads with stage-error for fallback handling', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ stages: [] }))));

    await expect(loadStages('/stages.json')).rejects.toMatchObject({
      code: 'stage-error',
    } satisfies Partial<StageLoadError>);
  });
});

describe('display.groundOffset', () => {
  it('accepts a finite offset and rejects anything else', () => {
    expect(validateCollectionRecord({ ...validCollectionRecord, display: { scale: 20.6, groundOffset: 0.5 } })).not.toBeNull();
    expect(validateCollectionRecord({ ...validCollectionRecord, display: { groundOffset: 'low' } })).toBeNull();
    expect(validateCollectionRecord({ ...validCollectionRecord, display: { groundOffset: Number.POSITIVE_INFINITY } })).toBeNull();
  });
});

describe('display.rotationYDegrees', () => {
  it('accepts a finite number and rejects other values', () => {
    expect(validateCollectionRecord({ ...validCollectionRecord, display: { rotationYDegrees: 90 } })).not.toBeNull();
    expect(validateCollectionRecord({ ...validCollectionRecord, display: { rotationYDegrees: 'left' } })).toBeNull();
    expect(validateCollectionRecord({ ...validCollectionRecord, display: { rotationYDegrees: Number.NaN } })).toBeNull();
  });
});
