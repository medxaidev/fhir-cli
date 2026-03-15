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
  .description('Validate a FHIR resource')
  .argument('<file>', 'JSON resource file path')
  .option('--profile <url>', 'Profile URL')
  .option('--format <format>', 'Output format (json|text)', 'text')
  .option('--config <path>', 'Config file path')
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
            `Failed to read or parse file: ${filePath}`,
            'INVALID_FILE',
            ExitCode.RUNTIME_ERROR,
            'Ensure the file exists and contains valid JSON.',
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
            'Cannot determine validation profile: resource is missing resourceType and --profile was not specified',
            'MISSING_PROFILE',
            ExitCode.VALIDATION_FAILED,
            'Use --profile <url> to specify a validation profile, or ensure the JSON file contains resourceType.',
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
            printSuccess('Resource validation passed');
          } else {
            const errors = issues.filter((i) => i.severity === 'error');
            const warnings = issues.filter((i) => i.severity === 'warning');
            const infos = issues.filter((i) => i.severity === 'information');

            if (errors.length > 0) {
              printError(`Validation failed (${issues.length} issue(s))`);
            } else {
              printSuccess(`Validation passed (${warnings.length} warning(s), ${infos.length} info(s))`);
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
