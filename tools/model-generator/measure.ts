import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';

export type GlbMeasurement = { height: number; minY: number };

/** Height and lowest point of a GLB's default scene, node transforms included. */
export async function measureGlb(path: string): Promise<GlbMeasurement> {
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const document = await io.read(path);
  const scene = document.getRoot().getDefaultScene() ?? document.getRoot().listScenes()[0];
  if (!scene) throw new Error('the GLB has no scene');
  const { min, max } = getBounds(scene);
  const height = max[1] - min[1];
  if (!Number.isFinite(height) || height <= 0) throw new Error('the GLB has no measurable height');
  return { height, minY: min[1] };
}
