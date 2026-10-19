import { copyFileSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CollectionRecord } from '../../src/app/types';
import { validateCollectionRecord } from '../../src/data/collection';

export class CollectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CollectionError';
  }
}

export type RecordInput = {
  title: string;
  id?: string;
  category?: string;
  description?: string;
  tags?: string[];
  heightMeters?: number;
};

export function slugify(text: string): string {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) throw new CollectionError(`Cannot derive an id from "${text}". Pass --id.`);
  return slug;
}

export function buildRecord(input: RecordInput): CollectionRecord {
  const id = slugify(input.id ?? input.title);
  const record: Record<string, unknown> = {
    id,
    title: input.title,
    category: input.category ?? 'Figure',
    model: `/models/${id}.glb`,
  };
  if (input.description) record.description = input.description;
  if (input.tags?.length) record.tags = input.tags;
  if (input.heightMeters !== undefined) record.heightMeters = input.heightMeters;
  const valid = validateCollectionRecord(record);
  if (!valid) throw new CollectionError('Metadata is invalid (check title, category and --height).');
  return valid;
}

function readList(publicDir: string): CollectionRecord[] {
  try {
    const list: unknown = JSON.parse(readFileSync(join(publicDir, 'collection.json'), 'utf8'));
    if (!Array.isArray(list)) throw new Error('not an array');
    return list as CollectionRecord[];
  } catch {
    throw new CollectionError('public/collection.json is missing or not a valid JSON array; nothing was changed.');
  }
}

export function assertNoDuplicate(publicDir: string, record: CollectionRecord, force: boolean): void {
  if (force) return;
  const taken = readList(publicDir).some((item) => item.id === record.id) || existsSync(join(publicDir, 'models', `${record.id}.glb`));
  if (taken) throw new CollectionError(`Model "${record.id}" already exists. Use --force to overwrite.`);
}

/** Stages both files first, then swaps them in; any failure restores the previous state. */
export function installModel(publicDir: string, record: CollectionRecord, glbPath: string, force: boolean): void {
  const list = readList(publicDir);
  assertNoDuplicate(publicDir, record, force);
  const target = join(publicDir, 'models', `${record.id}.glb`);
  const file = join(publicDir, 'collection.json');
  const next = [...list.filter((item) => item.id !== record.id), record];
  const backup = `${target}.bak`;
  const hadModel = existsSync(target);
  try {
    copyFileSync(glbPath, `${target}.tmp`);
    writeFileSync(`${file}.tmp`, `${JSON.stringify(next, null, 2)}
`);
    if (hadModel) renameSync(target, backup);
    renameSync(`${target}.tmp`, target);
    renameSync(`${file}.tmp`, file);
  } catch (error) {
    rmSync(`${file}.tmp`, { recursive: true, force: true });
    rmSync(`${target}.tmp`, { recursive: true, force: true });
    if (hadModel && existsSync(backup)) {
      rmSync(target, { force: true });
      renameSync(backup, target);
    } else if (!hadModel) {
      rmSync(target, { force: true });
    }
    throw new CollectionError(`Could not install the model: ${(error as Error).message}`);
  }
  rmSync(backup, { force: true });
}
