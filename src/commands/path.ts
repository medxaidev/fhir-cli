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
  .description('FHIRPath expression evaluation')
  .argument('<file>', 'JSON resource file path')
  .argument('<expression>', 'FHIRPath expression')
  .option('--format <format>', 'Output format (json|text|tree)', 'json')
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
            `Failed to read or parse file: ${filePath}`,
            'INVALID_FILE',
            ExitCode.RUNTIME_ERROR,
            'Ensure the file exists and contains valid JSON.',
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
