/**
 * CLI thin wrapper around fhir-engine's config system.
 *
 * Responsibilities (CLI-specific only):
 * 1. Find project root by walking up directory tree
 * 2. Delegate to fhir-engine's loadFhirConfig() / createFhirEngine()
 * 3. Provide CLI-friendly error messages when config is missing
 */
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { loadFhirConfig, createFhirEngine } from 'fhir-engine';
import type { FhirEngine } from 'fhir-engine';
import { CliError, ExitCode } from './error-handler.js';

const CONFIG_FILES = [
  'fhir.config.ts',
  'fhir.config.js',
  'fhir.config.mjs',
  'fhir.config.json',
] as const;

/**
 * Walk up from `startDir` looking for a directory containing a fhir.config.* file.
 * Returns the config file path or undefined.
 */
export function findConfigFile(startDir: string): string | undefined {
  let dir = resolve(startDir);
  const root = dirname(dir) === dir ? dir : undefined; // filesystem root guard

  // eslint-disable-next-line no-constant-condition
  while (true) {
    for (const name of CONFIG_FILES) {
      const candidate = resolve(dir, name);
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    const parent = dirname(dir);
    if (parent === dir || parent === root) {
      return undefined;
    }
    dir = parent;
  }
}

/**
 * Initialize a FhirEngine instance for a CLI command.
 *
 * @param options.config - Explicit config file path (--config flag)
 * @param options.cwd    - Working directory (defaults to process.cwd())
 */
export async function initEngineForCommand(
  options: { config?: string; cwd?: string } = {},
): Promise<FhirEngine> {
  const cwd = options.cwd ?? process.cwd();

  // 1. Explicit --config flag
  if (options.config) {
    const configPath = resolve(cwd, options.config);
    if (!existsSync(configPath)) {
      throw new CliError(
        `Config file not found: ${configPath}`,
        'CONFIG_NOT_FOUND',
        ExitCode.CONFIG_ERROR,
        'Check that the path specified by --config is correct.',
      );
    }
    const config = await loadFhirConfig(configPath);
    return createFhirEngine(config);
  }

  // 2. Auto-discover by walking up directory tree
  const configFile = findConfigFile(cwd);
  if (configFile) {
    const config = await loadFhirConfig(configFile);
    return createFhirEngine(config);
  }

  // 3. Not found
  throw new CliError(
    'fhir.config.json not found',
    'CONFIG_NOT_FOUND',
    ExitCode.CONFIG_ERROR,
    'Run inside a FHIR project directory, or create one with fhir new.',
  );
}
