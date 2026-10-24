// @vitest-environment node
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { describe, expect, it } from 'vitest';
import { measureGlb } from '../../tools/model-generator/measure';

async function writeBox(path: string, scale: number): Promise<void> {
  const doc = new Document();
  const buffer = doc.createBuffer();
  // A 1 x 2 x 1 box centred on the origin (y from -1 to 1).
  const corners = [-0.5, 0.5].flatMap((x) => [-1, 1].flatMap((y) => [-0.5, 0.5].map((z) => [x, y, z]))).flat();
  const position = doc.createAccessor().setType('VEC3').setArray(new Float32Array(corners)).setBuffer(buffer);
  const prim = doc.createPrimitive().setAttribute('POSITION', position);
  const node = doc.createNode().setMesh(doc.createMesh().addPrimitive(prim)).setScale([scale, scale, scale]);
  doc.createScene().addChild(node);
  await new NodeIO().write(path, doc);
}

describe('measureGlb', () => {
  it('returns the height and lowest point of the default scene, including node scale', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'measure-'));
    const file = join(dir, 'box.glb');
    await writeBox(file, 0.5);
    const { height, minY } = await measureGlb(file);
    expect(height).toBeCloseTo(1);
    expect(minY).toBeCloseTo(-0.5);
  });

  it('rejects a file that is not a GLB', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'measure-'));
    const file = join(dir, 'bad.glb');
    writeFileSync(file, 'not a glb');
    await expect(measureGlb(file)).rejects.toThrow();
  });
});
