// @vitest-environment node
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runCli } from '../../tools/model-generator/cli';
import { GeneratorError } from '../../tools/model-generator/generator';

function setup() {
  const root = mkdtempSync(join(tmpdir(), 'cli-'));
  const pub = join(root, 'public');
  mkdirSync(join(pub, 'models'), { recursive: true });
  writeFileSync(join(pub, 'collection.json'), '[]');
  for (const name of ['front.png', 'back.png']) writeFileSync(join(root, name), 'img');
  writeFileSync(join(root, 'notes.txt'), 'x');
  const out: string[] = [];
  const generator = {
    generate: vi.fn(async (_images: string[], outDir: string) => {
      const file = join(outDir, 'model.glb');
      writeFileSync(file, 'glb');
      return { modelFile: file, creditsConsumed: 30 };
    }),
  };
  const deps = { cwd: root, publicDir: pub, env: { TRIPO_API_KEY: 'SECRET' }, log: (m: string) => out.push(m), createGenerator: () => generator };
  return { root, pub, out, generator, deps };
}

const list = (pub: string) => JSON.parse(readFileSync(join(pub, 'collection.json'), 'utf8'));

describe('runCli', () => {
  it('turns several images into one model and one record', async () => {
    const { root, pub, generator, deps } = setup();
    const code = await runCli(['front.png', 'back.png', '--title', 'Haro Blue', '--height', '18', '--tags', 'a,b'], deps);
    expect(code).toBe(0);
    expect(generator.generate.mock.calls[0][0]).toEqual([join(root, 'front.png'), join(root, 'back.png')]);
    expect(existsSync(join(pub, 'models', 'haro-blue.glb'))).toBe(true);
    expect(list(pub)[0]).toMatchObject({ id: 'haro-blue', heightMeters: 18, tags: ['a', 'b'], model: '/models/haro-blue.glb' });
  });

  it.each([
    [['--title', 'X'], /at least one image/i],
    [['front.png'], /--title/],
    [['notes.txt', '--title', 'X'], /png, jpg/i],
    [['missing.png', '--title', 'X'], /not found/i],
    [['front.png', 'front.png', '--title', 'X'], /duplicate/i],
    [['front.png', '--title', 'X', '--height', 'abc'], /--height/],
    [['a.png', 'b.png', 'c.png', 'd.png', 'e.png', '--title', 'X'], /up to 4/i],
  ])('rejects bad input %j without touching files', async (argv, message) => {
    const { pub, out, generator, deps } = setup();
    for (const n of ['a', 'b', 'c', 'd', 'e']) writeFileSync(join(deps.cwd, `${n}.png`), 'i');
    expect(await runCli(argv as string[], deps)).not.toBe(0);
    expect(out.join('\n')).toMatch(message);
    expect(generator.generate).not.toHaveBeenCalled();
    expect(list(pub)).toEqual([]);
  });

  it('stops on a duplicate id before spending credits, force overrides', async () => {
    const { pub, generator, deps } = setup();
    await runCli(['front.png', '--title', 'Haro'], deps);
    expect(await runCli(['front.png', '--title', 'Haro'], deps)).not.toBe(0);
    expect(generator.generate).toHaveBeenCalledTimes(1);
    expect(await runCli(['front.png', '--title', 'Haro', '--force'], deps)).toBe(0);
    expect(list(pub)).toHaveLength(1);
  });

  it('fails cleanly when the key is missing', async () => {
    const { pub, out, generator, deps } = setup();
    expect(await runCli(['front.png', '--title', 'X'], { ...deps, env: {} })).not.toBe(0);
    expect(out.join('\n')).toMatch(/TRIPO_API_KEY/);
    expect(generator.generate).not.toHaveBeenCalled();
    expect(list(pub)).toEqual([]);
  });

  it('leaves collection and models untouched when generation fails, and never prints the key', async () => {
    const { pub, out, deps } = setup();
    const failing = { generate: vi.fn(async () => { throw new GeneratorError('Tripo task failed SECRET'); }) };
    expect(await runCli(['front.png', '--title', 'X'], { ...deps, createGenerator: () => failing })).not.toBe(0);
    expect(list(pub)).toEqual([]);
    expect(existsSync(join(pub, 'models', 'x.glb'))).toBe(false);
    expect(out.join('\n')).not.toContain('SECRET');
  });
});
