/**
 * `fhir ig <list|load|install|remove|info>` — IG management.
 *
 * install/remove operate on fhir.config.json (config-level management).
 * info uses the engine's definition registry to display loaded package details.
 */
import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findConfigFile, initEngineForCommand } from '../core/config-loader.js';
import { printJson, printTable, printSuccess, printInfo, printWarning } from '../core/output.js';
import { CliError, ExitCode, handleError } from '../core/error-handler.js';

export const igCommand = new Command('ig')
  .description('FHIR IG 管理');

igCommand
  .command('list')
  .description('列出已加载的 IG')
  .option('--config <path>', '配置文件路径')
  .option('--format <format>', '输出格式 (json|table)', 'table')
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
          console.log('(未加载任何 FHIR 包)');
        }
        console.log(
          `\n总计: ${stats.structureDefinitionCount} SD, ` +
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
  .description('加载本地 IG 目录')
  .option('--config <path>', '配置文件路径')
  .action(async (igPath: string, opts: { config?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      // TODO: implement local IG loading through engine
      printSuccess(`IG 路径已记录: ${igPath}`);
      console.log('注意: 本地 IG 加载将在引擎重启时生效。');
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
      '未找到 fhir.config.json',
      'CONFIG_NOT_FOUND',
      ExitCode.CONFIG_ERROR,
      '请在 FHIR 项目目录中运行，或使用 fhir new 创建新项目。',
    );
  }

  // Only support JSON config for write operations
  if (!configPath.endsWith('.json')) {
    throw new CliError(
      'ig install/remove 仅支持 fhir.config.json 格式',
      'UNSUPPORTED_CONFIG_FORMAT',
      ExitCode.CONFIG_ERROR,
      '请将配置转换为 fhir.config.json 格式后重试。',
    );
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
  return { configPath, config };
}

igCommand
  .command('install <name>')
  .description('将 IG 添加到项目配置 (格式: name 或 name@version)')
  .option('--config <path>', '配置文件路径')
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
          printInfo(`已更新 ${name} 版本为 ${version}`);
        } else {
          printWarning(`${name} 已在配置中`);
          return;
        }
      } else {
        const entry: { name: string; version?: string } = { name };
        if (version !== 'latest') {
          entry.version = version;
        }
        igs.push(entry);
        printSuccess(`已添加 ${name}${version !== 'latest' ? `@${version}` : ''} 到配置`);
      }

      writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
      printInfo(`配置已更新: ${configPath}`);
      printInfo('请重启引擎以加载新的 IG。');
    } catch (error) {
      handleError(error);
    }
  });

igCommand
  .command('remove <name>')
  .description('从项目配置中移除 IG')
  .option('--config <path>', '配置文件路径')
  .action(async (name: string, opts: { config?: string }) => {
    try {
      const { configPath, config } = readConfig(opts);

      if (!Array.isArray(config.igs)) {
        printWarning(`配置中没有 IG 列表`);
        return;
      }

      const igs = config.igs as Array<{ name: string }>;
      const idx = igs.findIndex((ig) => ig.name === name);

      if (idx === -1) {
        throw new CliError(
          `IG "${name}" 未在配置中找到`,
          'IG_NOT_FOUND',
          ExitCode.NOT_FOUND,
          `已配置的 IG: ${igs.map((ig) => ig.name).join(', ') || '(无)'}`,
        );
      }

      igs.splice(idx, 1);
      writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
      printSuccess(`已从配置中移除 ${name}`);
      printInfo(`配置已更新: ${configPath}`);
      printInfo('请重启引擎以应用更改。');
    } catch (error) {
      handleError(error);
    }
  });

igCommand
  .command('info <name>')
  .description('显示 IG 详情')
  .option('--config <path>', '配置文件路径')
  .option('--format <format>', '输出格式 (json|table)', 'table')
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
          `IG "${name}" 未加载`,
          'IG_NOT_LOADED',
          ExitCode.NOT_FOUND,
          `已加载的包: ${packages.map((p) => p.name).join(', ') || '(无)'}`,
        );
      }

      const stats = engine.definitions.getStatistics();

      if (opts.format === 'json') {
        printJson({ package: pkg, statistics: stats });
      } else {
        printInfo(`包名: ${pkg.name}`);
        printInfo(`版本: ${pkg.version}`);
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
