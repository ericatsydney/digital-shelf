import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { CollectionError, assertNoDuplicate, buildRecord, installModel } from './collection';
import { ConfigError, loadApiKey } from './config';
import { GeneratorError, createTripoCliGenerator, type ModelGenerator } from './generator';

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const UNSAFE_PATH = /["&|<>^%`$;]/;

export type CliDeps = {
  cwd: string;
  publicDir: string;
  env: NodeJS.ProcessEnv;
  log: (message: string) => void;
  createGenerator: (apiKey: string) => ModelGenerator;
};

class UsageError extends Error {}

const USAGE =
  'Usage: npm run model:generate -- <image> [<image>...] --title "..." [--id --category --description --tags a,b --height <m> --force]';

function validateImages(paths: string[], cwd: string): string[] {
  if (paths.length === 0) throw new UsageError(`Provide at least one image.\n${USAGE}`);
  if (paths.length > MAX_IMAGES) throw new UsageError(`Tripo accepts 1 image, or up to ${MAX_IMAGES} for multi-view.`);
  const resolved = paths.map((path) => resolve(cwd, path));
  if (new Set(resolved).size !== resolved.length) throw new UsageError('Duplicate image paths are not allowed.');
  for (const [index, file] of resolved.entries()) {
    if (UNSAFE_PATH.test(file)) throw new UsageError(`Image path contains unsupported characters: ${paths[index]}`);
    if (!IMAGE_EXTENSIONS.has(extname(file).toLowerCase())) throw new UsageError(`Images must be png, jpg, jpeg or webp: ${paths[index]}`);
    if (!existsSync(file)) throw new UsageError(`Image not found: ${paths[index]}`);
    if (statSync(file).size > MAX_IMAGE_BYTES) throw new UsageError(`Image is larger than 20 MB: ${paths[index]}`);
  }
  return resolved;
}

export async function runCli(argv: string[], deps: CliDeps): Promise<number> {
  let tempDir: string | undefined;
  let secret: string | undefined;
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        title: { type: 'string' },
        id: { type: 'string' },
        category: { type: 'string' },
        description: { type: 'string' },
        tags: { type: 'string' },
        height: { type: 'string' },
        force: { type: 'boolean', default: false },
      },
    });

    const images = validateImages(positionals, deps.cwd);
    if (!values.title?.trim()) throw new UsageError(`--title is required.\n${USAGE}`);
    const heightMeters = values.height === undefined ? undefined : Number(values.height);
    if (heightMeters !== undefined && !(Number.isFinite(heightMeters) && heightMeters > 0)) {
      throw new UsageError('--height must be a positive number of meters.');
    }

    const record = buildRecord({
      title: values.title.trim(),
      id: values.id,
      category: values.category,
      description: values.description,
      tags: values.tags?.split(',').map((tag) => tag.trim()).filter(Boolean),
      heightMeters,
    });
    assertNoDuplicate(deps.publicDir, record, values.force);
    const apiKey = loadApiKey(deps.env, deps.cwd);
    secret = apiKey;

    tempDir = mkdtempSync(join(tmpdir(), 'tripo-'));
    deps.log(`Generating "${record.title}" from ${images.length} image(s)...`);
    const result = await deps.createGenerator(apiKey).generate(images, tempDir);
    installModel(deps.publicDir, record, result.modelFile, values.force);
    deps.log(`Saved public${record.model} and added "${record.id}" to public/collection.json.`);
    if (result.creditsConsumed !== undefined) deps.log(`Credits used: ${result.creditsConsumed}`);
    return 0;
  } catch (error) {
    const known = error instanceof UsageError || error instanceof ConfigError || error instanceof CollectionError || error instanceof GeneratorError;
    const message = known ? error.message : error instanceof TypeError || (error as { code?: string }).code?.startsWith('ERR_PARSE_ARGS') ? (error as Error).message : 'Unexpected error.';
    deps.log(`Error: ${secret ? message.split(secret).join('[redacted]') : message}`);
    return known && error instanceof UsageError ? 2 : 1;
  } finally {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  }
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const cwd = process.cwd();
  runCli(process.argv.slice(2), {
    cwd,
    publicDir: join(cwd, 'public'),
    env: process.env,
    log: (message) => console.log(message),
    createGenerator: (apiKey) => createTripoCliGenerator({ apiKey }),
  }).then((code) => process.exit(code));
}
