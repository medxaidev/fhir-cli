import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createProject } from '../project.js';
import type { ProjectOptions } from '../project.js';
import { CliError } from '../error-handler.js';

const baseOptions: ProjectOptions = {
  name: 'test-project',
  fhirVersion: 'R4',
  database: 'sqlite',
  usCore: false,
  packageManager: 'npm',
};

let tmpDir: string;
let projectDir: string;

function setup() {
  tmpDir = mkdtempSync(join(tmpdir(), 'fhir-cli-project-test-'));
  projectDir = join(tmpDir, 'test-project');
}

afterEach(() => {
  if (tmpDir && existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('createProject', () => {
  it('creates project directory structure', async () => {
    setup();
    await createProject(projectDir, baseOptions);

    expect(existsSync(projectDir)).toBe(true);
    expect(existsSync(join(projectDir, 'data'))).toBe(true);
    expect(existsSync(join(projectDir, 'fhir-packages'))).toBe(true);
    expect(existsSync(join(projectDir, 'resources'))).toBe(true);
  });

  it('generates valid fhir.config.json', async () => {
    setup();
    await createProject(projectDir, baseOptions);

    const configPath = join(projectDir, 'fhir.config.json');
    expect(existsSync(configPath)).toBe(true);
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(config.fhirVersion).toBe('R4');
    expect(config.database.type).toBe('sqlite');
    expect(config.database.path).toBe('./data/fhir.db');
    expect(config.packages.path).toBe('./fhir-packages');
    expect(config.igs).toHaveLength(1);
    expect(config.igs[0].name).toBe('hl7.fhir.r4.core');
  });

  it('generates valid package.json', async () => {
    setup();
    await createProject(projectDir, baseOptions);

    const pkgPath = join(projectDir, 'package.json');
    expect(existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.name).toBe('test-project');
    expect(pkg.dependencies['fhir-engine']).toBe('^0.5.1');
  });

  it('includes US Core IG when usCore is true', async () => {
    setup();
    const result = await createProject(projectDir, { ...baseOptions, usCore: true });

    const config = JSON.parse(
      readFileSync(join(projectDir, 'fhir.config.json'), 'utf-8'),
    );
    expect(config.igs).toHaveLength(2);
    expect(config.igs[1].name).toBe('hl7.fhir.us.core');
    // resolvePackages runs — R4 core should resolve; US Core may fail if not cached
    expect(result).toBeDefined();
    expect(result.packages.length).toBeGreaterThanOrEqual(1);
  }, 30_000);

  it('generates example Patient resource', async () => {
    setup();
    await createProject(projectDir, baseOptions);

    const examplePath = join(projectDir, 'resources', 'Patient-example.json');
    expect(existsSync(examplePath)).toBe(true);
    const patient = JSON.parse(readFileSync(examplePath, 'utf-8'));
    expect(patient.resourceType).toBe('Patient');
    expect(patient.name[0].family).toBe('Smith');
  });

  it('throws CliError if directory already exists', async () => {
    setup();
    await createProject(projectDir, baseOptions);
    await expect(createProject(projectDir, baseOptions)).rejects.toThrow(CliError);
  });

  it('generates .gitignore', async () => {
    setup();
    await createProject(projectDir, baseOptions);

    const gitignorePath = join(projectDir, '.gitignore');
    expect(existsSync(gitignorePath)).toBe(true);
    const content = readFileSync(gitignorePath, 'utf-8');
    expect(content).toContain('node_modules/');
    expect(content).toContain('data/*.db');
  });

  it('generates postgres config when database is postgres', async () => {
    setup();
    await createProject(projectDir, { ...baseOptions, database: 'postgres' });

    const config = JSON.parse(
      readFileSync(join(projectDir, 'fhir.config.json'), 'utf-8'),
    );
    expect(config.database.type).toBe('postgres');
    expect(config.database.url).toContain('postgresql://');
  });
});
