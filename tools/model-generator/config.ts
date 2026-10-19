import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const API_KEY_NAME = 'TRIPO_API_KEY';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const values: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || line.trimStart().startsWith('#')) continue;
    values[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return values;
}

/** Environment wins, then git-ignored .env.local, then .env. The key is never logged. */
export function loadApiKey(env: NodeJS.ProcessEnv, cwd: string): string {
  const key =
    env[API_KEY_NAME]?.trim() ||
    readEnvFile(join(cwd, '.env.local'))[API_KEY_NAME]?.trim() ||
    readEnvFile(join(cwd, '.env'))[API_KEY_NAME]?.trim();
  if (!key) {
    throw new ConfigError(`${API_KEY_NAME} is not set. Add it to .env.local (git-ignored) or your environment.`);
  }
  return key;
}
