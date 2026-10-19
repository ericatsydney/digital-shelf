// @vitest-environment node
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { API_KEY_NAME, ConfigError, loadApiKey } from '../../tools/model-generator/config';

const dir = () => mkdtempSync(join(tmpdir(), 'cfg-'));

describe('loadApiKey', () => {
  it('prefers the environment over .env.local', () => {
    const cwd = dir();
    writeFileSync(join(cwd, '.env.local'), 'TRIPO_API_KEY=from-file\n');
    expect(loadApiKey({ TRIPO_API_KEY: 'from-env' }, cwd)).toBe('from-env');
  });

  it('falls back to .env.local, ignoring quotes and comments', () => {
    const cwd = dir();
    writeFileSync(join(cwd, '.env.local'), '# note\nTRIPO_API_KEY="from-file"\n');
    expect(loadApiKey({}, cwd)).toBe('from-file');
  });

  it('falls back to .env when .env.local is absent', () => {
    const cwd = dir();
    writeFileSync(join(cwd, '.env'), 'TRIPO_API_KEY=from-dotenv\n');
    expect(loadApiKey({}, cwd)).toBe('from-dotenv');
  });

  it('throws a ConfigError that never contains key material when missing', () => {
    expect(() => loadApiKey({}, dir())).toThrow(ConfigError);
    expect(() => loadApiKey({}, dir())).toThrow(/TRIPO_API_KEY/);
  });

  it('never uses a browser-exposed VITE_ prefix', () => {
    expect(API_KEY_NAME.startsWith('VITE_')).toBe(false);
  });
});
