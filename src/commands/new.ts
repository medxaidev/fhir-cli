/**
 * `fhir new [project-name]` — Create a new FHIR project.
 */
import { Command } from 'commander';
import prompts from 'prompts';
import { createProject } from '../core/project.js';
import type { ProjectOptions } from '../core/project.js';
import { printSuccess, printInfo, printWarning } from '../core/output.js';
import { handleError } from '../core/error-handler.js';

export const newCommand = new Command('new')
  .description('创建新 FHIR 项目')
  .argument('[project-name]', '项目名称')
  .option('--fhir-version <version>', 'FHIR 版本', 'R4')
  .option('--database <type>', '数据库类型 (sqlite|postgres)', 'sqlite')
  .option('--template <type>', '模板类型 (minimal|full)', 'minimal')
  .action(async (projectName?: string, opts?: Record<string, string>) => {
    try {
      // Interactive prompts for missing options
      const answers = await prompts(
        [
          {
            type: projectName ? null : 'text',
            name: 'name',
            message: '项目名称:',
            initial: 'my-fhir-app',
          },
          {
            type: 'select',
            name: 'database',
            message: '数据库:',
            choices: [
              { title: 'SQLite (推荐)', value: 'sqlite' },
              { title: 'PostgreSQL', value: 'postgres' },
            ],
            initial: opts?.database === 'postgres' ? 1 : 0,
          },
          {
            type: 'confirm',
            name: 'usCore',
            message: '包含 US Core IG?',
            initial: false,
          },
          {
            type: 'select',
            name: 'packageManager',
            message: '包管理器:',
            choices: [
              { title: 'npm', value: 'npm' },
              { title: 'pnpm', value: 'pnpm' },
              { title: 'yarn', value: 'yarn' },
            ],
          },
        ],
        { onCancel: () => process.exit(0) },
      );

      const name = projectName ?? answers.name;
      const options: ProjectOptions = {
        name,
        fhirVersion: 'R4',
        database: answers.database ?? opts?.database ?? 'sqlite',
        usCore: answers.usCore ?? false,
        packageManager: answers.packageManager ?? 'npm',
      };

      const resolveResult = await createProject(name, options);

      printSuccess(`项目 ${name} 创建成功。`);

      // Display package resolution results
      if (resolveResult.success) {
        for (const pkg of resolveResult.packages) {
          printInfo(`已解析 ${pkg.name}@${pkg.version} (${pkg.source})`);
        }
      } else {
        for (const pkg of resolveResult.packages) {
          printInfo(`已解析 ${pkg.name}@${pkg.version} (${pkg.source})`);
        }
        for (const err of resolveResult.errors) {
          printWarning(`${err.name}: ${err.error}`);
        }
        printWarning('部分 FHIR 包解析失败，可稍后使用 fhir ig install 重试。');
      }

      console.log(`\n下一步:`);
      console.log(`  cd ${name}`);
      console.log(`  ${options.packageManager} install`);
      console.log(`  fhir doctor`);
    } catch (error) {
      handleError(error);
    }
  });
