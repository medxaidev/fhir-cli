/**
 * `fhir validate <file>` — Validate a FHIR resource.
 */
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initEngineForCommand } from '../core/config-loader.js';
import { printJson, printSuccess, printError } from '../core/output.js';
import { CliError, ExitCode, handleError } from '../core/error-handler.js';

export const validateCommand = new Command('validate')
  .description('验证 FHIR 资源')
  .argument('<file>', 'JSON 资源文件路径')
  .option('--profile <url>', 'Profile URL')
  .option('--format <format>', '输出格式 (json|text)', 'text')
  .option('--config <path>', '配置文件路径')
  .action(
    async (
      file: string,
      opts: { profile?: string; format?: string; config?: string },
    ) => {
      try {
        const engine = await initEngineForCommand(opts);
        const filePath = resolve(file);

        let resource: unknown;
        try {
          resource = JSON.parse(readFileSync(filePath, 'utf-8'));
        } catch {
          throw new CliError(
            `无法读取或解析文件: ${filePath}`,
            'INVALID_FILE',
            ExitCode.RUNTIME_ERROR,
            '请确保文件存在且为有效的 JSON 格式。',
          );
        }

        // Derive profile URL from resourceType if not explicitly provided
        const resourceObj = resource as Record<string, unknown>;
        const profileUrl =
          opts.profile ??
          (resourceObj.resourceType
            ? `http://hl7.org/fhir/StructureDefinition/${resourceObj.resourceType}`
            : undefined);

        if (!profileUrl) {
          throw new CliError(
            '无法确定验证 Profile：资源缺少 resourceType，且未指定 --profile',
            'MISSING_PROFILE',
            ExitCode.VALIDATION_FAILED,
            '请使用 --profile <url> 指定验证 Profile，或确保 JSON 文件包含 resourceType。',
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await engine.runtime.validate(resource as any, profileUrl);

        if (opts.format === 'json') {
          printJson(result);
        } else {
          // Text format output
          const issues = ((result as unknown) as { issues?: ReadonlyArray<{ severity: string; message: string; path?: string }> }).issues ?? [];
          if (issues.length === 0) {
            printSuccess('资源验证通过');
          } else {
            const errors = issues.filter((i) => i.severity === 'error');
            const warnings = issues.filter((i) => i.severity === 'warning');
            const infos = issues.filter((i) => i.severity === 'information');

            if (errors.length > 0) {
              printError(`验证失败（${issues.length} 个问题）`);
            } else {
              printSuccess(`验证通过（${warnings.length} 个警告, ${infos.length} 个信息）`);
            }

            for (const issue of issues) {
              const prefix =
                issue.severity === 'error'
                  ? '  ERROR  '
                  : issue.severity === 'warning'
                    ? '  WARNING'
                    : '  INFO   ';
              console.log(`${prefix} ${issue.path ?? ''}: ${issue.message}`);
            }

            // Exit with code 2 if there are errors
            if (errors.length > 0) {
              await engine.stop();
              process.exit(ExitCode.VALIDATION_FAILED);
            }
          }
        }

        await engine.stop();
      } catch (error) {
        handleError(error);
      }
    },
  );
