/**
 * `fhir path <file> <expression>` — FHIRPath expression evaluation.
 */
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evalFhirPath } from 'fhir-engine';
import { printJson } from '../core/output.js';
import { CliError, ExitCode, handleError } from '../core/error-handler.js';

export const pathCommand = new Command('path')
  .description('FHIRPath 表达式求值')
  .argument('<file>', 'JSON 资源文件路径')
  .argument('<expression>', 'FHIRPath 表达式')
  .option('--format <format>', '输出格式 (json|text|tree)', 'json')
  .action(
    async (
      file: string,
      expression: string,
      opts: { format?: string },
    ) => {
      try {
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

        // evalFhirPath is a standalone function — no engine needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = evalFhirPath(expression, resource as any);

        if (opts.format === 'text') {
          for (const item of result) {
            console.log(typeof item === 'object' ? JSON.stringify(item) : String(item));
          }
        } else {
          printJson(result);
        }
      } catch (error) {
        handleError(error);
      }
    },
  );
