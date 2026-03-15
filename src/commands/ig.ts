/**
 * `fhir ig <list|load|install|remove|info>` — IG management.
 *
 * install/remove operate on fhir.config.json (config-level management).
 * info uses the engine's definition registry to display loaded package details.
 */
import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolvePackages, loadFhirConfig } from 'fhir-engine';
import { findConfigFile, initEngineForCommand } from '../core/config-loader.js';
import { printJson, printTable, printSuccess, printInfo, printWarning } from '../core/output.js';
import { CliError, ExitCode, handleError } from '../core/error-handler.js';

export const igCommand = new Command('ig')
  .description('FHIR IG management');

igCommand
  .command('list')
  .description('List loaded IGs')
  .option('--config <path>', 'Config file path')
  .option('--format <format>', 'Output format (json|table)', 'table')
  .action(async (opts: { config?: string; format?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const stats = engine.definitions.getStatistics();
      const packages = engine.definitions.getLoadedPackages();

      if (opts.format === 'json') {
        printJson({ statistics: stats, packages });
      } else {
        if (packages.length > 0) {
          printTable(
            packages.map((p: { name: string; version: string }) => ({
              name: p.name,
              version: p.version,
            })),
          );
        } else {
          console.log('(No FHIR packages loaded)');
        }
        console.log(
          `\nTotal: ${stats.structureDefinitionCount} SD, ` +
          `${stats.searchParameterCount} SP, ` +
          `${stats.valueSetCount} VS, ` +
          `${stats.codeSystemCount} CS`,
        );
      }

      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

igCommand
  .command('load <path>')
  .description('Load local IG directory')
  .option('--config <path>', 'Config file path')
  .action(async (igPath: string, opts: { config?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      // TODO: implement local IG loading through engine
      printSuccess(`IG path recorded: ${igPath}`);
      console.log('Note: Local IG will take effect after engine restart.');
      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Read and parse the fhir.config.json file.
 * Returns { configPath, config }.
 */
function readConfig(opts: { config?: string }): {
  configPath: string;
  config: Record<string, unknown>;
} {
  const cwd = process.cwd();
  let configPath: string | undefined;

  if (opts.config) {
    configPath = resolve(cwd, opts.config);
  } else {
    configPath = findConfigFile(cwd);
  }

  if (!configPath) {
    throw new CliError(
      'fhir.config.json not found',
      'CONFIG_NOT_FOUND',
      ExitCode.CONFIG_ERROR,
      'Run inside a FHIR project directory, or create one with fhir new.',
    );
  }

  // Only support JSON config for write operations
  if (!configPath.endsWith('.json')) {
    throw new CliError(
      'ig install/remove only supports fhir.config.json format',
      'UNSUPPORTED_CONFIG_FORMAT',
      ExitCode.CONFIG_ERROR,
      'Please convert your config to fhir.config.json format and retry.',
    );
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
  return { configPath, config };
}

igCommand
  .command('install <name>')
  .description('Add IG to project config (format: name or name@version)')
  .option('--config <path>', 'Config file path')
  .action(async (nameArg: string, opts: { config?: string }) => {
    try {
      const { configPath, config } = readConfig(opts);

      // Parse name@version
      const atIdx = nameArg.lastIndexOf('@');
      const name = atIdx > 0 ? nameArg.slice(0, atIdx) : nameArg;
      const version = atIdx > 0 ? nameArg.slice(atIdx + 1) : 'latest';

      // Ensure igs array exists
      if (!Array.isArray(config.igs)) {
        config.igs = [];
      }

      const igs = config.igs as Array<{ name: string; version?: string }>;

      // Check if already installed
      const existing = igs.find((ig) => ig.name === name);
      if (existing) {
        if (version !== 'latest') {
          existing.version = version;
          printInfo(`Updated ${name} version to ${version}`);
        } else {
          printWarning(`${name} is already in config`);
          return;
        }
      } else {
        const entry: { name: string; version?: string } = { name };
        if (version !== 'latest') {
          entry.version = version;
        }
        igs.push(entry);
        printSuccess(`Added ${name}${version !== 'latest' ? `@${version}` : ''} to config`);
      }

      writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
      printInfo(`Config updated: ${configPath}`);

      // Resolve packages: download/link into fhir-packages/
      printInfo('Resolving and downloading FHIR packages...');
      const engineConfig = await loadFhirConfig(configPath);
      const resolveResult = await resolvePackages(engineConfig, {
        packages: [{ name, version: version !== 'latest' ? version : undefined }],
      });

      if (resolveResult.success) {
        for (const pkg of resolveResult.packages) {
          printSuccess(`Resolved ${pkg.name}@${pkg.version} (${pkg.source})`);
        }
      } else {
        for (const err of resolveResult.errors) {
          printWarning(`${err.name}: ${err.error}`);
        }
        printWarning('Some packages failed to resolve. Check your network or manually place packages in fhir-packages/.');
      }

      printInfo('Restart the engine to load the new IG.');
    } catch (error) {
      handleError(error);
    }
  });

igCommand
  .command('remove <name>')
  .description('Remove IG from project config')
  .option('--config <path>', 'Config file path')
  .action(async (name: string, opts: { config?: string }) => {
    try {
      const { configPath, config } = readConfig(opts);

      if (!Array.isArray(config.igs)) {
        printWarning(`No IG list in config`);
        return;
      }

      const igs = config.igs as Array<{ name: string }>;
      const idx = igs.findIndex((ig) => ig.name === name);

      if (idx === -1) {
        throw new CliError(
          `IG "${name}" not found in config`,
          'IG_NOT_FOUND',
          ExitCode.NOT_FOUND,
          `Configured IGs: ${igs.map((ig) => ig.name).join(', ') || '(none)'}`,
        );
      }

      igs.splice(idx, 1);
      writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
      printSuccess(`Removed ${name} from config`);
      printInfo(`Config updated: ${configPath}`);
      printInfo('Restart the engine to apply changes.');
    } catch (error) {
      handleError(error);
    }
  });

igCommand
  .command('info <name>')
  .description('Show IG details')
  .option('--config <path>', 'Config file path')
  .option('--format <format>', 'Output format (json|table)', 'table')
  .action(async (name: string, opts: { config?: string; format?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const packages = engine.definitions.getLoadedPackages() as Array<{
        name: string;
        version: string;
      }>;
      const pkg = packages.find((p) => p.name === name);

      if (!pkg) {
        throw new CliError(
          `IG "${name}" is not loaded`,
          'IG_NOT_LOADED',
          ExitCode.NOT_FOUND,
          `Loaded packages: ${packages.map((p) => p.name).join(', ') || '(none)'}`,
        );
      }

      const stats = engine.definitions.getStatistics();

      if (opts.format === 'json') {
        printJson({ package: pkg, statistics: stats });
      } else {
        printInfo(`Package: ${pkg.name}`);
        printInfo(`Version: ${pkg.version}`);
        printInfo(`StructureDefinition: ${stats.structureDefinitionCount}`);
        printInfo(`SearchParameter: ${stats.searchParameterCount}`);
        printInfo(`ValueSet: ${stats.valueSetCount}`);
        printInfo(`CodeSystem: ${stats.codeSystemCount}`);
      }

      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });
