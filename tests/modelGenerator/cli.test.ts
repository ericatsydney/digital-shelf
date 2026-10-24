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
  const compress = vi.fn(async (_input: string, output: string) => {
    writeFileSync(output, 'small');
  });
  const measure = vi.fn(async (_file: string) => ({ height: 1, minY: -0.5 }));
  const deps = { cwd: root, publicDir: pub, env: { TRIPO_API_KEY: 'SECRET' }, log: (m: string) => out.push(m), createGenerator: vi.fn((_apiKey: string, _options?: { texture: boolean }) => generator), compress, measure };
  return { root, pub, out, generator, compress, deps };
}

const list = (pub: string) => JSON.parse(readFileSync(join(pub, 'collection.json'), 'utf8'));

describe('runCli', () => {
  it('only enables texturing with --texture', async () => {
    const { deps } = setup();
    expect(await runCli(['front.png', '--title', 'Plain'], deps)).toBe(0);
    expect(deps.createGenerator).toHaveBeenLastCalledWith('SECRET', { texture: false });
    expect(await runCli(['front.png', '--title', 'Painted', '--texture'], deps)).toBe(0);
    expect(deps.createGenerator).toHaveBeenLastCalledWith('SECRET', { texture: true });
  });

  it('stores the measured scale and ground offset so the app never measures at runtime', async () => {
    const { pub, deps } = setup();
    deps.measure.mockResolvedValueOnce({ height: 2, minY: -1 });
    expect(await runCli(['front.png', '--title', 'Tall', '--height', '20'], deps)).toBe(0);
    expect(list(pub)[0].display).toEqual({ scale: 10, groundOffset: 1 });
    expect(await runCli(['front.png', '--title', 'Plain'], deps)).toBe(0);
    expect(list(pub)[1].display).toEqual({ groundOffset: 0.5 });
  });

  it('keeps the raw GLB and installs nothing when the model cannot be measured', async () => {
    const { pub, out, deps } = setup();
    deps.measure.mockRejectedValueOnce(new Error('no geometry'));
    expect(await runCli(['front.png', '--title', 'X'], deps)).not.toBe(0);
    expect(list(pub)).toEqual([]);
    const text = out.join(' ');
    expect(text).toMatch(/measure/i);
    expect(text).toMatch(/Raw GLB kept at/);
  });

  it('turns several images into one model and one record', async () => {
    const { root, pub, generator, deps } = setup();
    const code = await runCli(['front.png', 'back.png', '--title', 'Test Model', '--height', '18', '--tags', 'a,b'], deps);
    expect(code).toBe(0);
    expect(generator.generate.mock.calls[0][0]).toEqual([join(root, 'front.png'), join(root, 'back.png')]);
    expect(readFileSync(join(pub, 'models', 'test-model.glb'), 'utf8')).toBe('small');
    expect(list(pub)[0]).toMatchObject({ id: 'test-model', heightMeters: 18, tags: ['a', 'b'], model: '/models/test-model.glb' });
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
    await runCli(['front.png', '--title', 'Sample'], deps);
    expect(await runCli(['front.png', '--title', 'Sample'], deps)).not.toBe(0);
    expect(generator.generate).toHaveBeenCalledTimes(1);
    expect(await runCli(['front.png', '--title', 'Sample', '--force'], deps)).toBe(0);
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

  it('keeps the raw GLB and reports its path when compression fails', async () => {
    const { pub, out, deps } = setup();
    const failing = vi.fn(async () => { throw new Error('encoder crashed'); });
    expect(await runCli(['front.png', '--title', 'X'], { ...deps, compress: failing })).not.toBe(0);
    expect(list(pub)).toEqual([]);
    const text = out.join('\n');
    expect(text).toMatch(/compress/i);
    const kept = /Raw GLB kept at (.+)$/m.exec(text)?.[1];
    expect(kept && existsSync(kept)).toBe(true);
  });

  it('refuses a model still above the Cloudflare 25 MiB asset limit', async () => {
    const { pub, out, deps } = setup();
    const big = vi.fn(async (_i: string, output: string) => {
      writeFileSync(output, Buffer.alloc(26 * 1024 * 1024));
    });
    expect(await runCli(['front.png', '--title', 'X'], { ...deps, compress: big })).not.toBe(0);
    expect(out.join('\n')).toMatch(/25 MiB/);
    expect(list(pub)).toEqual([]);
  });
});
