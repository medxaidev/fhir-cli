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
  .description('Create a new FHIR project')
  .argument('[project-name]', 'Project name')
  .option('--fhir-version <version>', 'FHIR version', 'R4')
  .option('--database <type>', 'Database type (sqlite|postgres)', 'sqlite')
  .option('--template <type>', 'Template type (minimal|full)', 'minimal')
  .action(async (projectName?: string, opts?: Record<string, string>) => {
    try {
      // Interactive prompts for missing options
      const answers = await prompts(
        [
          {
            type: projectName ? null : 'text',
            name: 'name',
            message: 'Project name:',
            initial: 'my-fhir-app',
          },
          {
            type: 'select',
            name: 'database',
            message: 'Database:',
            choices: [
              { title: 'SQLite (recommended)', value: 'sqlite' },
              { title: 'PostgreSQL', value: 'postgres' },
            ],
            initial: opts?.database === 'postgres' ? 1 : 0,
          },
          {
            type: 'confirm',
            name: 'usCore',
            message: 'Include US Core IG?',
            initial: false,
          },
          {
            type: 'select',
            name: 'packageManager',
            message: 'Package manager:',
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

      printSuccess(`Project ${name} created successfully.`);

      // Display package resolution results
      if (resolveResult.success) {
        for (const pkg of resolveResult.packages) {
          printInfo(`Resolved ${pkg.name}@${pkg.version} (${pkg.source})`);
        }
      } else {
        for (const pkg of resolveResult.packages) {
          printInfo(`Resolved ${pkg.name}@${pkg.version} (${pkg.source})`);
        }
        for (const err of resolveResult.errors) {
          printWarning(`${err.name}: ${err.error}`);
        }
        printWarning('Some FHIR packages failed to resolve. You can retry later with fhir ig install.');
      }

      console.log(`\nNext steps:`);
      console.log(`  cd ${name}`);
      console.log(`  ${options.packageManager} install`);
      console.log(`  fhir doctor`);
    } catch (error) {
      handleError(error);
    }
  });
