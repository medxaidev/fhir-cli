/**
 * `fhir engine <status|start|stop>` — Engine lifecycle management.
 */
import { Command } from 'commander';
import { initEngineForCommand } from '../core/config-loader.js';
import { printJson, printSuccess, printInfo } from '../core/output.js';
import { handleError } from '../core/error-handler.js';

export const engineCommand = new Command('engine')
  .description('FHIR 引擎生命周期管理');

engineCommand
  .command('status')
  .description('显示引擎状态')
  .option('--config <path>', '配置文件路径')
  .option('--format <format>', '输出格式 (json|table)', 'table')
  .action(async (opts: { config?: string; format?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const status = engine.status();

      if (opts.format === 'json') {
        printJson(status);
      } else {
        printSuccess('FHIR Engine 运行中');
        printInfo(`数据库类型: ${status.databaseType}`);
        printInfo(`FHIR 版本: ${status.fhirVersions.join(', ')}`);
        printInfo(`资源类型: ${status.resourceTypes.length} 个`);
        printInfo(`启动时间: ${status.startedAt}`);
        printInfo(`IG 动作: ${status.igAction}`);

        if (status.loadedPackages.length > 0) {
          printInfo('已加载包:');
          for (const pkg of status.loadedPackages) {
            console.log(`    ${pkg}`);
          }
        }

        if (status.plugins.length > 0) {
          printInfo(`插件: ${status.plugins.join(', ')}`);
        }
      }

      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

engineCommand
  .command('start')
  .description('前台启动引擎 (Ctrl+C 停止)')
  .option('--config <path>', '配置文件路径')
  .action(async (opts: { config?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const status = engine.status();

      printSuccess('FHIR Engine 已启动');
      printInfo(`数据库: ${status.databaseType}`);
      printInfo(`资源类型: ${status.resourceTypes.length} 个`);
      printInfo(`已加载包: ${status.loadedPackages.length} 个`);
      printInfo('按 Ctrl+C 停止引擎...');

      // Keep process alive until SIGINT
      await new Promise<void>((resolve) => {
        const shutdown = async () => {
          printInfo('\n正在停止引擎...');
          await engine.stop();
          printSuccess('引擎已停止');
          resolve();
        };

        process.on('SIGINT', () => void shutdown());
        process.on('SIGTERM', () => void shutdown());
      });
    } catch (error) {
      handleError(error);
    }
  });

engineCommand
  .command('stop')
  .description('停止引擎（连接并发送停止信号）')
  .action(async () => {
    // In Phase 2, engine start runs in foreground — stop is done via Ctrl+C.
    // A background daemon mode with IPC-based stop is planned for Phase 3.
    printInfo('引擎在前台模式运行时，请使用 Ctrl+C 停止。');
    printInfo('后台守护进程模式将在 Phase 3 中实现。');
  });
