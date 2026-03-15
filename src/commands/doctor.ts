/**
 * `fhir doctor` — Environment diagnostics.
 */
import { Command } from 'commander';
import { initEngineForCommand } from '../core/config-loader.js';
import { printSuccess, printError, printWarning } from '../core/output.js';
import { CliError, ExitCode } from '../core/error-handler.js';

export const doctorCommand = new Command('doctor')
  .description('Environment diagnostics')
  .option('--config <path>', 'Config file path')
  .action(async (opts: { config?: string }) => {
    let hasErrors = false;

    // 1. Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1), 10);
    if (major >= 18) {
      printSuccess(`Node.js ${nodeVersion}`);
    } else {
      printError(`Node.js ${nodeVersion} — requires >=18.0.0`);
      hasErrors = true;
    }

    // 2. Config file
    try {
      const engine = await initEngineForCommand(opts);

      // 3. Engine status
      const status = engine.status();
      printSuccess(`FHIR Engine started`);
      printSuccess(`Database: ${status.databaseType}`);
      printSuccess(`FHIR version: ${status.fhirVersions.join(', ')}`);
      printSuccess(`Loaded packages: ${status.loadedPackages.length}`);
      for (const pkg of status.loadedPackages) {
        console.log(`    ${pkg}`);
      }
      printSuccess(`Resource types: ${status.resourceTypes.length}`);
      printSuccess(`IG action: ${status.igAction}`);

      if (status.plugins.length > 0) {
        printSuccess(`Plugins: ${status.plugins.join(', ')}`);
      }

      await engine.stop();
    } catch (error) {
      if (error instanceof CliError && error.code === 'CONFIG_NOT_FOUND') {
        printWarning('fhir.config.json not found — run inside a FHIR project directory, or create one with fhir new.');
      } else {
        const message = error instanceof Error ? error.message : String(error);
        printError(`Engine failed to start: ${message}`);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      process.exit(ExitCode.RUNTIME_ERROR);
    }
  });
