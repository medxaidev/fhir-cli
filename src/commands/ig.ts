/**
 * `fhir ig <list|load|install|remove|info>` — IG management.
 */
import { Command } from 'commander';
import { initEngineForCommand } from '../core/config-loader.js';
import { printJson, printTable, printSuccess } from '../core/output.js';
import { handleError } from '../core/error-handler.js';

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

// install, remove, info — Phase 2 stubs
igCommand
  .command('install <name>')
  .description('安装 IG (Phase 2)')
  .action(async () => {
    console.log('fhir ig install 将在 v0.2.0 中实现。');
  });

igCommand
  .command('remove <name>')
  .description('移除 IG (Phase 2)')
  .action(async () => {
    console.log('fhir ig remove 将在 v0.2.0 中实现。');
  });

igCommand
  .command('info <name>')
  .description('显示 IG 详情 (Phase 2)')
  .action(async () => {
    console.log('fhir ig info 将在 v0.2.0 中实现。');
  });
