/**
 * `fhir resource <create|get|update|delete|history>` — Resource CRUD operations.
 */
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initEngineForCommand } from '../core/config-loader.js';
import { printJson, printSuccess, printTable } from '../core/output.js';
import { CliError, ExitCode, handleError } from '../core/error-handler.js';

export const resourceCommand = new Command('resource')
  .description('FHIR resource CRUD operations');

resourceCommand
  .command('create <file>')
  .description('Create resource from JSON file')
  .option('--config <path>', 'Config file path')
  .action(async (file: string, opts: { config?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const filePath = resolve(file);
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));

      const resourceType = content.resourceType;
      if (!resourceType) {
        throw new CliError(
          'JSON file is missing the resourceType field',
          'INVALID_RESOURCE',
          ExitCode.VALIDATION_FAILED,
          'Ensure the JSON file contains a valid FHIR resourceType.',
        );
      }

      const result = await engine.persistence.createResource(resourceType, content);
      printSuccess(`${resourceType}/${result.id} created (versionId: ${result.meta?.versionId ?? 'N/A'})`);
      printJson(result);
      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

resourceCommand
  .command('get <reference>')
  .description('Read resource (format: ResourceType/id)')
  .option('--config <path>', 'Config file path')
  .option('--format <format>', 'Output format (json|text)', 'json')
  .action(async (reference: string, opts: { config?: string; format?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const [resourceType, id] = reference.split('/');
      if (!resourceType || !id) {
        throw new CliError(
          `Invalid resource reference: ${reference}`,
          'INVALID_REFERENCE',
          ExitCode.RUNTIME_ERROR,
          'Format: ResourceType/id, e.g. Patient/123',
        );
      }

      const result = await engine.persistence.readResource(resourceType, id);
      printJson(result);
      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

resourceCommand
  .command('update <file>')
  .description('Update resource (id must be in file)')
  .option('--config <path>', 'Config file path')
  .action(async (file: string, opts: { config?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const filePath = resolve(file);
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));

      const resourceType = content.resourceType;
      const id = content.id;
      if (!resourceType || !id) {
        throw new CliError(
          'JSON file is missing resourceType or id field',
          'INVALID_RESOURCE',
          ExitCode.VALIDATION_FAILED,
        );
      }

      const result = await engine.persistence.updateResource(resourceType, content);
      printSuccess(`${resourceType}/${id} updated (versionId: ${result.meta?.versionId ?? 'N/A'})`);
      printJson(result);
      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

resourceCommand
  .command('delete <reference>')
  .description('Delete resource (format: ResourceType/id)')
  .option('--config <path>', 'Config file path')
  .action(async (reference: string, opts: { config?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const [resourceType, id] = reference.split('/');
      if (!resourceType || !id) {
        throw new CliError(
          `Invalid resource reference: ${reference}`,
          'INVALID_REFERENCE',
          ExitCode.RUNTIME_ERROR,
          'Format: ResourceType/id, e.g. Patient/123',
        );
      }

      await engine.persistence.deleteResource(resourceType, id);
      printSuccess(`${resourceType}/${id} deleted`);
      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

resourceCommand
  .command('history <reference>')
  .description('View resource version history (format: ResourceType/id)')
  .option('--config <path>', 'Config file path')
  .option('--format <format>', 'Output format (json|table)', 'json')
  .action(async (reference: string, opts: { config?: string; format?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const [resourceType, id] = reference.split('/');
      if (!resourceType || !id) {
        throw new CliError(
          `Invalid resource reference: ${reference}`,
          'INVALID_REFERENCE',
          ExitCode.RUNTIME_ERROR,
          'Format: ResourceType/id, e.g. Patient/123',
        );
      }

      const history = await engine.persistence.readHistory(resourceType, id);

      if (opts.format === 'table') {
        printTable(
          (history as Array<{ versionId: string; lastUpdated: string; deleted: boolean }>).map(
            (entry) => ({
              versionId: entry.versionId,
              lastUpdated: entry.lastUpdated,
              deleted: entry.deleted ? 'Yes' : 'No',
            }),
          ),
        );
      } else {
        printJson(history);
      }

      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });
