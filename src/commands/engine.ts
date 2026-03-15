/**
 * `fhir engine <status|start|stop>` — Engine lifecycle management.
 */
import { Command } from 'commander';
import { initEngineForCommand } from '../core/config-loader.js';
import { printJson, printSuccess, printInfo } from '../core/output.js';
import { handleError } from '../core/error-handler.js';

export const engineCommand = new Command('engine')
  .description('FHIR engine lifecycle management');

engineCommand
  .command('status')
  .description('Show engine status')
  .option('--config <path>', 'Config file path')
  .option('--format <format>', 'Output format (json|table)', 'table')
  .action(async (opts: { config?: string; format?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const status = engine.status();

      if (opts.format === 'json') {
        printJson(status);
      } else {
        printSuccess('FHIR Engine running');
        printInfo(`Database type: ${status.databaseType}`);
        printInfo(`FHIR version: ${status.fhirVersions.join(', ')}`);
        printInfo(`Resource types: ${status.resourceTypes.length}`);
        printInfo(`Started at: ${status.startedAt}`);
        printInfo(`IG action: ${status.igAction}`);

        if (status.loadedPackages.length > 0) {
          printInfo('Loaded packages:');
          for (const pkg of status.loadedPackages) {
            console.log(`    ${pkg}`);
          }
        }

        if (status.plugins.length > 0) {
          printInfo(`Plugins: ${status.plugins.join(', ')}`);
        }
      }

      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

engineCommand
  .command('start')
  .description('Start engine in foreground (Ctrl+C to stop)')
  .option('--config <path>', 'Config file path')
  .action(async (opts: { config?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const status = engine.status();

      printSuccess('FHIR Engine started');
      printInfo(`Database: ${status.databaseType}`);
      printInfo(`Resource types: ${status.resourceTypes.length}`);
      printInfo(`Loaded packages: ${status.loadedPackages.length}`);
      printInfo('Press Ctrl+C to stop the engine...');

      // Keep process alive until SIGINT
      await new Promise<void>((resolve) => {
        const shutdown = async () => {
          printInfo('\nStopping engine...');
          await engine.stop();
          printSuccess('Engine stopped');
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
  .description('Stop engine (connect and send stop signal)')
  .action(async () => {
    // In Phase 2, engine start runs in foreground — stop is done via Ctrl+C.
    // A background daemon mode with IPC-based stop is planned for Phase 3.
    printInfo('When the engine is running in foreground mode, use Ctrl+C to stop.');
    printInfo('Background daemon mode is planned for Phase 3.');
  });
