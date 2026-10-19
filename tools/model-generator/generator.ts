import { execFile as nodeExecFile, execFileSync } from 'node:child_process';

export class GeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeneratorError';
  }
}

export type GenerateResult = { modelFile: string; creditsConsumed?: number };

/** Swappable: a REST-based implementation can replace the CLI later. */
export interface ModelGenerator {
  generate(imagePaths: string[], outDir: string): Promise<GenerateResult>;
}

type ExecFile = (
  file: string,
  args: string[],
  options: { env: NodeJS.ProcessEnv; maxBuffer: number; shell?: boolean },
  callback: (error: (Error & { code?: number | string; killed?: boolean }) | null, stdout: string, stderr: string) => void,
) => { pid?: number; kill: () => void } | undefined | void;

export type TripoCliOptions = {
  apiKey: string;
  execFile?: ExecFile;
  timeoutMs?: number;
  /** MVP is geometry only; flip to true when texturing is added. */
  texture?: boolean;
};

const EXIT_MESSAGES: Record<number, string> = {
  2: 'Tripo CLI rejected the parameters (invalid usage).',
  3: 'Tripo authentication failed. Check TRIPO_API_KEY.',
  4: 'Not enough Tripo credits.',
  5: 'Tripo rejected the images (content policy).',
  6: 'Tripo task failed (credits are refunded).',
  7: 'Network error while talking to Tripo.',
  8: 'Tripo resource not found.',
  9: 'Tripo rate limit reached; retry later.',
};

export function createTripoCliGenerator(options: TripoCliOptions): ModelGenerator {
  const run = options.execFile ?? (nodeExecFile as unknown as ExecFile);
  const timeout = options.timeoutMs ?? 10 * 60 * 1000;
  const binary = process.platform === 'win32' ? 'tripo.cmd' : 'tripo';

  return {
    generate(imagePaths, outDir) {
      const args = ['make', ...imagePaths];
      if (!options.texture) args.push('-p', 'texture=false', '-p', 'pbr=false');
      args.push('--json', '--yes', '--quiet', '-o', outDir);

      return new Promise((resolve, reject) => {
        // Node cannot launch an npm .cmd shim on Windows without a shell; arguments are validated file paths only.
        const shell = process.platform === 'win32' && options.execFile === undefined;
        const env = { ...process.env, TRIPO_API_KEY: options.apiKey };
        const finalArgs = shell ? args.map((arg) => (/[\s&()'^%!]/.test(arg) ? `"${arg}"` : arg)) : args;
        let timedOut = false;
        let timer: NodeJS.Timeout | undefined;
        const child = run(binary, finalArgs, { env, maxBuffer: 20 * 1024 * 1024, shell }, (error, stdout) => {
          if (timer) clearTimeout(timer);
          if (error) {
            if (error.code === 'ENOENT') return reject(new GeneratorError('Tripo CLI not found. Install it with: npm install -g tripo-cli'));
            if (timedOut) return reject(new GeneratorError(`Tripo CLI timed out after ${Math.round(timeout / 1000)}s.`));
            const known = typeof error.code === 'number' ? EXIT_MESSAGES[error.code] : undefined;
            return reject(new GeneratorError(known ?? 'Tripo CLI failed.'));
          }
          let parsed: { model_file?: unknown; credits_consumed?: unknown };
          try {
            parsed = JSON.parse(stdout.trim().split(/\r?\n/).filter(Boolean).pop() ?? '');
          } catch {
            return reject(new GeneratorError('Tripo CLI returned unexpected output.'));
          }
          if (typeof parsed.model_file !== 'string') return reject(new GeneratorError('Tripo CLI returned unexpected output.'));
          if (!parsed.model_file.toLowerCase().endsWith('.glb')) return reject(new GeneratorError('Tripo CLI did not produce a GLB file.'));
          resolve({ modelFile: parsed.model_file, creditsConsumed: typeof parsed.credits_consumed === 'number' ? parsed.credits_consumed : undefined });
        });
        timer = setTimeout(() => {
          timedOut = true;
          killTree(child);
        }, timeout);
      });
    },
  };
}

/** On Windows the shell wrapper hides the real process, so kill the whole tree. */
function killTree(child: { pid?: number; kill: () => void } | undefined | void): void {
  if (!child) return;
  if (process.platform === 'win32' && child.pid) {
    try {
      execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      return;
    } catch {
      // fall through to a plain kill
    }
  }
  child.kill();
}
