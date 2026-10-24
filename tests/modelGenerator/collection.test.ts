// @vitest-environment node
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateCollectionRecord } from '../../src/data/collection';
import {
  CollectionError,
  assertNoDuplicate,
  buildRecord,
  installModel,
  slugify,
} from '../../tools/model-generator/collection';

const publicDir = () => {
  const root = mkdtempSync(join(tmpdir(), 'pub-'));
  mkdirSync(join(root, 'models'));
  writeFileSync(join(root, 'collection.json'), JSON.stringify([{ id: 'sample-one', title: 'Sample', category: 'Figure', model: '/models/sample-one.glb' }]));
  return root;
};

describe('slugify / buildRecord', () => {
  it('slugifies titles', () => {
    expect(slugify('  Test Model!! v2 ')).toBe('test-model-v2');
    expect(() => slugify('!!!')).toThrow(CollectionError);
  });

  it('builds a valid record with defaults', () => {
    const record = buildRecord({ title: 'Test Model', heightMeters: 18, tags: ['a'] });
    expect(record).toMatchObject({ id: 'test-model', category: 'Figure', model: '/models/test-model.glb', heightMeters: 18, tags: ['a'] });
    expect(validateCollectionRecord(record)).not.toBeNull();
  });

  it('rejects an invalid height', () => {
    expect(() => buildRecord({ title: 'X', heightMeters: -1 })).toThrow(CollectionError);
  });
});

describe('installModel', () => {
  it('moves the glb and appends the record last', () => {
    const root = publicDir();
    const src = join(mkdtempSync(join(tmpdir(), 'src-')), 'm.glb');
    writeFileSync(src, 'glb');
    const record = buildRecord({ title: 'Test Model' });
    installModel(root, record, src, false);
    expect(readFileSync(join(root, 'models', 'test-model.glb'), 'utf8')).toBe('glb');
    const list = JSON.parse(readFileSync(join(root, 'collection.json'), 'utf8'));
    expect(list.map((r: { id: string }) => r.id)).toEqual(['sample-one', 'test-model']);
  });

  it('rejects duplicates unless forced, force replaces the entry', () => {
    const root = publicDir();
    const record = buildRecord({ title: 'Sample One' });
    expect(() => assertNoDuplicate(root, record, false)).toThrow(/already exists/);
    expect(() => assertNoDuplicate(root, record, true)).not.toThrow();
    const src = join(mkdtempSync(join(tmpdir(), 'src-')), 'm.glb');
    writeFileSync(src, 'new');
    installModel(root, record, src, true);
    const list = JSON.parse(readFileSync(join(root, 'collection.json'), 'utf8'));
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Sample One');
  });

  it('leaves everything untouched if collection.json is unreadable', () => {
    const root = publicDir();
    writeFileSync(join(root, 'collection.json'), '{not json');
    const src = join(mkdtempSync(join(tmpdir(), 'src-')), 'm.glb');
    writeFileSync(src, 'glb');
    expect(() => installModel(root, buildRecord({ title: 'New One' }), src, false)).toThrow(CollectionError);
    expect(existsSync(join(root, 'models', 'new-one.glb'))).toBe(false);
  });

  it('rolls back the model when the collection swap fails', () => {
    const root = publicDir();
    mkdirSync(join(root, 'collection.json.tmp'));
    const src = join(mkdtempSync(join(tmpdir(), 'src-')), 'm.glb');
    writeFileSync(src, 'glb');
    expect(() => installModel(root, buildRecord({ title: 'Fresh' }), src, false)).toThrow(CollectionError);
    expect(existsSync(join(root, 'models', 'fresh.glb'))).toBe(false);
    expect(JSON.parse(readFileSync(join(root, 'collection.json'), 'utf8'))).toHaveLength(1);
  });
});
