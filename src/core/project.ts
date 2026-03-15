/**
 * Project scaffolding utilities for `fhir new`.
 */
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import fse from 'fs-extra';
import { CliError, ExitCode } from './error-handler.js';

export interface ProjectOptions {
  name: string;
  fhirVersion: 'R4';
  database: 'sqlite' | 'postgres';
  usCore: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn';
}

/**
 * Generate fhir.config.json content.
 */
function generateConfig(options: ProjectOptions): string {
  const config: Record<string, unknown> = {
    fhirVersion: options.fhirVersion,
    database: {
      type: options.database,
      ...(options.database === 'sqlite'
        ? { path: './data/fhir.db' }
        : { url: 'postgresql://user:pass@localhost:5432/fhir' }),
    },
    packages: {
      path: './fhir-packages',
    },
    igs: [
      { name: 'hl7.fhir.r4.core', version: '4.0.1' },
      ...(options.usCore
        ? [{ name: 'hl7.fhir.us.core', version: '6.1.0' }]
        : []),
    ],
  };
  return JSON.stringify(config, null, 2) + '\n';
}

/**
 * Generate package.json content for the new project.
 */
function generatePackageJson(options: ProjectOptions): string {
  const pkg = {
    name: options.name,
    version: '0.0.1',
    private: true,
    type: 'module',
    scripts: {
      start: 'fhir engine start',
    },
    dependencies: {
      'fhir-engine': '^0.2.0',
    },
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}

/**
 * Generate .gitignore content.
 */
function generateGitignore(): string {
  return [
    'node_modules/',
    'dist/',
    'data/*.db',
    'data/*.db-journal',
    'data/*.db-wal',
    '',
  ].join('\n');
}

/**
 * Generate example Patient resource.
 */
function generateExamplePatient(): string {
  const resource = {
    resourceType: 'Patient',
    name: [{ family: 'Smith', given: ['John'] }],
    gender: 'male',
    birthDate: '1990-01-01',
  };
  return JSON.stringify(resource, null, 2) + '\n';
}

/**
 * Create a new FHIR project directory with scaffolding.
 */
export async function createProject(
  targetDir: string,
  options: ProjectOptions,
): Promise<void> {
  const projectPath = resolve(targetDir);

  if (existsSync(projectPath)) {
    throw new CliError(
      `目录已存在: ${projectPath}`,
      'DIR_EXISTS',
      ExitCode.RUNTIME_ERROR,
      '请选择一个不存在的目录名称。',
    );
  }

  // Create directory structure
  await fse.ensureDir(join(projectPath, 'data'));
  await fse.ensureDir(join(projectPath, 'fhir-packages'));
  await fse.ensureDir(join(projectPath, 'resources'));

  // Write files
  await fse.writeFile(
    join(projectPath, 'fhir.config.json'),
    generateConfig(options),
  );
  await fse.writeFile(
    join(projectPath, 'package.json'),
    generatePackageJson(options),
  );
  await fse.writeFile(
    join(projectPath, '.gitignore'),
    generateGitignore(),
  );
  await fse.writeFile(
    join(projectPath, 'data', '.gitkeep'),
    '',
  );
  await fse.writeFile(
    join(projectPath, 'resources', 'Patient-example.json'),
    generateExamplePatient(),
  );
}
