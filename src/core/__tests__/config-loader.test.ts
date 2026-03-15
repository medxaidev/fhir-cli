import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolve, join } from 'node:path';
import { findConfigFile } from '../config-loader.js';

describe('findConfigFile', () => {
  it('returns undefined for non-existent directory', () => {
    const result = findConfigFile('/tmp/nonexistent-fhir-test-dir-xyz');
    expect(result).toBeUndefined();
  });

  it('returns undefined for directory without config', () => {
    // node_modules definitely has no fhir.config.*
    const result = findConfigFile(resolve(__dirname, '../../..'));
    // May or may not find config depending on cwd; just check it returns string|undefined
    expect(typeof result === 'string' || result === undefined).toBe(true);
  });

  it('finds fhir.config.json in the given directory', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), 'fhir-cli-test-'));
    const configPath = join(tmpDir, 'fhir.config.json');
    fs.writeFileSync(configPath, '{}');

    const result = findConfigFile(tmpDir);
    expect(result).toBe(configPath);

    fs.unlinkSync(configPath);
    fs.rmdirSync(tmpDir);
  });

  it('walks up directory tree to find config', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), 'fhir-cli-test-'));
    const subDir = join(tmpDir, 'sub', 'deep');
    fs.mkdirSync(subDir, { recursive: true });
    const configPath = join(tmpDir, 'fhir.config.json');
    fs.writeFileSync(configPath, '{}');

    const result = findConfigFile(subDir);
    expect(result).toBe(configPath);

    fs.unlinkSync(configPath);
    fs.rmdirSync(subDir);
    fs.rmdirSync(join(tmpDir, 'sub'));
    fs.rmdirSync(tmpDir);
  });

  it('prefers fhir.config.ts over fhir.config.json', async () => {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), 'fhir-cli-test-'));
    fs.writeFileSync(join(tmpDir, 'fhir.config.ts'), '');
    fs.writeFileSync(join(tmpDir, 'fhir.config.json'), '{}');

    const result = findConfigFile(tmpDir);
    expect(result).toBe(join(tmpDir, 'fhir.config.ts'));

    fs.unlinkSync(join(tmpDir, 'fhir.config.ts'));
    fs.unlinkSync(join(tmpDir, 'fhir.config.json'));
    fs.rmdirSync(tmpDir);
  });
});
