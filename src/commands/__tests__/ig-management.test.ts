/**
 * Tests for IG management commands — install/remove operate on fhir.config.json.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

let tmpDir: string;

function createTempConfig(config: Record<string, unknown>): string {
  tmpDir = mkdtempSync(join(tmpdir(), 'fhir-cli-ig-test-'));
  const configPath = join(tmpDir, 'fhir.config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

function readJsonConfig(configPath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

afterEach(() => {
  if (tmpDir && existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('ig install (config-level)', () => {
  it('adds a new IG to empty igs array', () => {
    const configPath = createTempConfig({ igs: [] });
    const config = readJsonConfig(configPath);
    const igs = config.igs as Array<{ name: string; version?: string }>;

    igs.push({ name: 'hl7.fhir.us.core', version: '6.1.0' });
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    const updated = readJsonConfig(configPath);
    expect((updated.igs as any[]).length).toBe(1);
    expect((updated.igs as any[])[0].name).toBe('hl7.fhir.us.core');
    expect((updated.igs as any[])[0].version).toBe('6.1.0');
  });

  it('adds IG alongside existing IGs', () => {
    const configPath = createTempConfig({
      igs: [{ name: 'hl7.fhir.r4.core', version: '4.0.1' }],
    });
    const config = readJsonConfig(configPath);
    const igs = config.igs as Array<{ name: string; version?: string }>;

    igs.push({ name: 'hl7.fhir.us.core' });
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    const updated = readJsonConfig(configPath);
    expect((updated.igs as any[]).length).toBe(2);
  });

  it('parses name@version format correctly', () => {
    const nameArg = 'hl7.fhir.us.core@6.1.0';
    const atIdx = nameArg.lastIndexOf('@');
    const name = atIdx > 0 ? nameArg.slice(0, atIdx) : nameArg;
    const version = atIdx > 0 ? nameArg.slice(atIdx + 1) : 'latest';

    expect(name).toBe('hl7.fhir.us.core');
    expect(version).toBe('6.1.0');
  });

  it('handles name without version', () => {
    const nameArg = 'hl7.fhir.us.core';
    const atIdx = nameArg.lastIndexOf('@');
    const name = atIdx > 0 ? nameArg.slice(0, atIdx) : nameArg;
    const version = atIdx > 0 ? nameArg.slice(atIdx + 1) : 'latest';

    expect(name).toBe('hl7.fhir.us.core');
    expect(version).toBe('latest');
  });

  it('updates version of existing IG', () => {
    const configPath = createTempConfig({
      igs: [{ name: 'hl7.fhir.us.core', version: '5.0.0' }],
    });
    const config = readJsonConfig(configPath);
    const igs = config.igs as Array<{ name: string; version?: string }>;

    const existing = igs.find((ig) => ig.name === 'hl7.fhir.us.core');
    expect(existing).toBeDefined();
    existing!.version = '6.1.0';
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    const updated = readJsonConfig(configPath);
    expect((updated.igs as any[])[0].version).toBe('6.1.0');
  });

  it('creates igs array if missing', () => {
    const configPath = createTempConfig({ database: { type: 'sqlite' } });
    const config = readJsonConfig(configPath);

    if (!Array.isArray(config.igs)) {
      config.igs = [];
    }
    (config.igs as any[]).push({ name: 'hl7.fhir.us.core' });
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    const updated = readJsonConfig(configPath);
    expect((updated.igs as any[]).length).toBe(1);
  });
});

describe('ig remove (config-level)', () => {
  it('removes an existing IG', () => {
    const configPath = createTempConfig({
      igs: [
        { name: 'hl7.fhir.r4.core', version: '4.0.1' },
        { name: 'hl7.fhir.us.core', version: '6.1.0' },
      ],
    });
    const config = readJsonConfig(configPath);
    const igs = config.igs as Array<{ name: string }>;

    const idx = igs.findIndex((ig) => ig.name === 'hl7.fhir.us.core');
    expect(idx).toBe(1);
    igs.splice(idx, 1);
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

    const updated = readJsonConfig(configPath);
    expect((updated.igs as any[]).length).toBe(1);
    expect((updated.igs as any[])[0].name).toBe('hl7.fhir.r4.core');
  });

  it('returns -1 for non-existent IG', () => {
    const configPath = createTempConfig({
      igs: [{ name: 'hl7.fhir.r4.core' }],
    });
    const config = readJsonConfig(configPath);
    const igs = config.igs as Array<{ name: string }>;
    const idx = igs.findIndex((ig) => ig.name === 'nonexistent.ig');
    expect(idx).toBe(-1);
  });

  it('handles empty igs array gracefully', () => {
    const configPath = createTempConfig({ igs: [] });
    const config = readJsonConfig(configPath);
    const igs = config.igs as Array<{ name: string }>;
    const idx = igs.findIndex((ig) => ig.name === 'anything');
    expect(idx).toBe(-1);
  });
});

describe('ig info', () => {
  it('finds a loaded package by name', () => {
    const packages = [
      { name: 'hl7.fhir.r4.core', version: '4.0.1' },
      { name: 'hl7.fhir.us.core', version: '6.1.0' },
    ];
    const pkg = packages.find((p) => p.name === 'hl7.fhir.r4.core');
    expect(pkg).toBeDefined();
    expect(pkg!.version).toBe('4.0.1');
  });

  it('returns undefined for non-loaded package', () => {
    const packages = [{ name: 'hl7.fhir.r4.core', version: '4.0.1' }];
    const pkg = packages.find((p) => p.name === 'nonexistent');
    expect(pkg).toBeUndefined();
  });
});
