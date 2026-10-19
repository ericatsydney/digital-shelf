import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

/**
 * Meshopt-compresses a GLB. The app's GLTFLoader decodes EXT_meshopt_compression with a bundled
 * decoder, so no extra runtime request is needed (unlike Draco, whose default decoder is a CDN).
 */
export async function compressGlb(inputPath: string, outputPath: string): Promise<void> {
  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
  const document = await io.read(inputPath);
  await document.transform(meshopt({ encoder: MeshoptEncoder, level: 'high' }));
  await io.write(outputPath, document);
}
