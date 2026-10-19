// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { GeneratorError, createTripoCliGenerator } from '../../tools/model-generator/generator';

type Result = { stdout?: string; stderr?: string; code?: number | string; killed?: boolean };
const fakeExec = (result: Result) =>
  vi.fn((_file: string, _args: string[], _opts: object, cb: (e: unknown, o: string, s: string) => void) => {
    if (result.code === undefined && !result.killed) cb(null, result.stdout ?? '', '');
    else cb({ code: result.code, killed: result.killed }, result.stdout ?? '', result.stderr ?? '');
  });

const ok = JSON.stringify({ status: 'success', model_file: 'C:/tmp/out/model.glb', credits_consumed: 30 });

describe('createTripoCliGenerator', () => {
  it('runs tripo make with the exact geometry-only args, key in env, no shell', async () => {
    const exec = fakeExec({ stdout: `${ok}\n` });
    const gen = createTripoCliGenerator({ apiKey: 'SECRET', execFile: exec as never });
    const result = await gen.generate(['a.png', 'b.png'], 'C:/tmp/out');
    const [file, args, opts] = exec.mock.calls[0] as unknown as [string, string[], { env: Record<string, string>; shell?: boolean }];
    expect(file).toMatch(/tripo/);
    expect(args).toEqual(['make', 'a.png', 'b.png', '-p', 'texture=false', '-p', 'pbr=false', '--json', '--yes', '--quiet', '-o', 'C:/tmp/out']);
    expect(opts.env.TRIPO_API_KEY).toBe('SECRET');
    expect(opts.shell).toBeFalsy();
    expect(result).toEqual({ modelFile: 'C:/tmp/out/model.glb', creditsConsumed: 30 });
  });

  it('only changes texture params when texture is enabled', async () => {
    const exec = fakeExec({ stdout: ok });
    await createTripoCliGenerator({ apiKey: 'k', execFile: exec as never, texture: true }).generate(['a.png'], 'o');
    const args = (exec.mock.calls[0] as unknown as [string, string[]])[1];
    expect(args).not.toContain('texture=false');
  });

  it.each([
    [3, /authentication/i],
    [4, /credits/i],
    [5, /content policy/i],
    [6, /task failed/i],
    [7, /network/i],
    [9, /rate limit/i],
    [2, /invalid/i],
  ])('maps exit code %s', async (code, message) => {
    const gen = createTripoCliGenerator({ apiKey: 'SECRET', execFile: fakeExec({ code, stderr: 'leak SECRET' }) as never });
    const error = await gen.generate(['a.png'], 'o').catch((e) => e);
    expect(error).toBeInstanceOf(GeneratorError);
    expect(error.message).toMatch(message);
    expect(error.message).not.toContain('SECRET');
  });

  it('explains a missing tripo binary', async () => {
    const gen = createTripoCliGenerator({ apiKey: 'k', execFile: fakeExec({ code: 'ENOENT' }) as never });
    await expect(gen.generate(['a.png'], 'o')).rejects.toThrow(/npm install -g tripo-cli/);
  });

  it('kills the child and reports a timeout', async () => {
    const kill = vi.fn();
    let finish: (e: unknown, o: string, s: string) => void = () => {};
    const exec = vi.fn((_f: string, _a: string[], _o: object, cb: typeof finish) => {
      finish = cb;
      return { pid: undefined, kill: () => { kill(); finish({ killed: true }, '', ''); } };
    });
    const gen = createTripoCliGenerator({ apiKey: 'k', execFile: exec as never, timeoutMs: 10 });
    await expect(gen.generate(['a.png'], 'o')).rejects.toThrow(/timed out/i);
    expect(kill).toHaveBeenCalled();
  });

  it('rejects invalid JSON and non-GLB output', async () => {
    const bad = createTripoCliGenerator({ apiKey: 'k', execFile: fakeExec({ stdout: 'nope' }) as never });
    await expect(bad.generate(['a.png'], 'o')).rejects.toThrow(/unexpected output/i);
    const fbx = createTripoCliGenerator({ apiKey: 'k', execFile: fakeExec({ stdout: JSON.stringify({ status: 'success', model_file: 'm.fbx' }) }) as never });
    await expect(fbx.generate(['a.png'], 'o')).rejects.toThrow(/GLB/);
  });
});
