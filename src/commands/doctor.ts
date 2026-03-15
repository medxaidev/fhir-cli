/**
 * `fhir doctor` — Environment diagnostics.
 */
import { Command } from 'commander';
import { initEngineForCommand } from '../core/config-loader.js';
import { printSuccess, printError, printWarning } from '../core/output.js';
import { CliError, ExitCode } from '../core/error-handler.js';

export const doctorCommand = new Command('doctor')
  .description('环境诊断')
  .option('--config <path>', '配置文件路径')
  .action(async (opts: { config?: string }) => {
    let hasErrors = false;

    // 1. Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1), 10);
    if (major >= 18) {
      printSuccess(`Node.js ${nodeVersion}`);
    } else {
      printError(`Node.js ${nodeVersion} — 需要 >=18.0.0`);
      hasErrors = true;
    }

    // 2. Config file
    try {
      const engine = await initEngineForCommand(opts);

      // 3. Engine status
      const status = engine.status();
      printSuccess(`FHIR Engine 已启动`);
      printSuccess(`数据库: ${status.databaseType}`);
      printSuccess(`FHIR 版本: ${status.fhirVersions.join(', ')}`);
      printSuccess(`已加载包: ${status.loadedPackages.length} 个`);
      for (const pkg of status.loadedPackages) {
        console.log(`    ${pkg}`);
      }
      printSuccess(`资源类型: ${status.resourceTypes.length} 个`);
      printSuccess(`IG 动作: ${status.igAction}`);

      if (status.plugins.length > 0) {
        printSuccess(`插件: ${status.plugins.join(', ')}`);
      }

      await engine.stop();
    } catch (error) {
      if (error instanceof CliError && error.code === 'CONFIG_NOT_FOUND') {
        printWarning('未找到 fhir.config.json — 请在 FHIR 项目目录中运行，或使用 fhir new 创建新项目。');
      } else {
        const message = error instanceof Error ? error.message : String(error);
        printError(`引擎启动失败: ${message}`);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      process.exit(ExitCode.RUNTIME_ERROR);
    }
  });
