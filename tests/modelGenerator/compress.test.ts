// @vitest-environment node
import { mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { describe, expect, it } from 'vitest';
import { compressGlb } from '../../tools/model-generator/compress';

async function writeSampleGlb(path: string): Promise<void> {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const n = 60;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let y = 0; y <= n; y += 1) {
    for (let x = 0; x <= n; x += 1) positions.push(x / n, y / n, Math.sin(x / 5) * Math.cos(y / 7) * 0.1);
  }
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const a = y * (n + 1) + x;
      indices.push(a, a + 1, a + n + 1, a + 1, a + n + 2, a + n + 1);
    }
  }
  const position = doc.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer);
  const index = doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)).setBuffer(buffer);
  const prim = doc.createPrimitive().setAttribute('POSITION', position).setIndices(index);
  const mesh = doc.createMesh().addPrimitive(prim);
  const node = doc.createNode().setMesh(mesh);
  doc.createScene().addChild(node);
  await new NodeIO().write(path, doc);
}

describe('compressGlb', () => {
  it('writes a smaller GLB that uses EXT_meshopt_compression and still decodes', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'compress-'));
    const input = join(dir, 'in.glb');
    const output = join(dir, 'out.glb');
    await writeSampleGlb(input);

    await compressGlb(input, output);

    expect(statSync(output).size).toBeLessThan(statSync(input).size);
    await MeshoptDecoder.ready;
    const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
    const doc = await io.read(output);
    const used = doc.getRoot().listExtensionsUsed().map((e) => e.extensionName);
    expect(used).toContain('EXT_meshopt_compression');
    expect(used).toContain('KHR_mesh_quantization');
    expect(doc.getRoot().listMeshes()).toHaveLength(1);
  });

  it('rejects a file that is not a GLB', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'compress-'));
    await expect(compressGlb(join(dir, 'missing.glb'), join(dir, 'out.glb'))).rejects.toThrow();
  });
});
