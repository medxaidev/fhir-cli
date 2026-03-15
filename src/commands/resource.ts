/**
 * `fhir resource <create|get|update|delete|history>` — Resource CRUD operations.
 */
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initEngineForCommand } from '../core/config-loader.js';
import { printJson, printSuccess } from '../core/output.js';
import { CliError, ExitCode, handleError } from '../core/error-handler.js';

export const resourceCommand = new Command('resource')
  .description('FHIR 资源 CRUD 操作');

resourceCommand
  .command('create <file>')
  .description('从 JSON 文件创建资源')
  .option('--config <path>', '配置文件路径')
  .action(async (file: string, opts: { config?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const filePath = resolve(file);
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));

      const resourceType = content.resourceType;
      if (!resourceType) {
        throw new CliError(
          'JSON 文件缺少 resourceType 字段',
          'INVALID_RESOURCE',
          ExitCode.VALIDATION_FAILED,
          '请确保 JSON 文件包含有效的 FHIR resourceType。',
        );
      }

      const result = await engine.persistence.createResource(resourceType, content);
      printSuccess(`${resourceType}/${result.id} 已创建 (versionId: ${result.meta?.versionId ?? 'N/A'})`);
      printJson(result);
      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

resourceCommand
  .command('get <reference>')
  .description('读取资源 (格式: ResourceType/id)')
  .option('--config <path>', '配置文件路径')
  .option('--format <format>', '输出格式 (json|text)', 'json')
  .action(async (reference: string, opts: { config?: string; format?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const [resourceType, id] = reference.split('/');
      if (!resourceType || !id) {
        throw new CliError(
          `无效的资源引用: ${reference}`,
          'INVALID_REFERENCE',
          ExitCode.RUNTIME_ERROR,
          '格式: ResourceType/id，例如: Patient/123',
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
  .description('更新资源 (id 在文件中)')
  .option('--config <path>', '配置文件路径')
  .action(async (file: string, opts: { config?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const filePath = resolve(file);
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));

      const resourceType = content.resourceType;
      const id = content.id;
      if (!resourceType || !id) {
        throw new CliError(
          'JSON 文件缺少 resourceType 或 id 字段',
          'INVALID_RESOURCE',
          ExitCode.VALIDATION_FAILED,
        );
      }

      const result = await engine.persistence.updateResource(resourceType, content);
      printSuccess(`${resourceType}/${id} 已更新 (versionId: ${result.meta?.versionId ?? 'N/A'})`);
      printJson(result);
      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

resourceCommand
  .command('delete <reference>')
  .description('删除资源 (格式: ResourceType/id)')
  .option('--config <path>', '配置文件路径')
  .action(async (reference: string, opts: { config?: string }) => {
    try {
      const engine = await initEngineForCommand(opts);
      const [resourceType, id] = reference.split('/');
      if (!resourceType || !id) {
        throw new CliError(
          `无效的资源引用: ${reference}`,
          'INVALID_REFERENCE',
          ExitCode.RUNTIME_ERROR,
          '格式: ResourceType/id，例如: Patient/123',
        );
      }

      await engine.persistence.deleteResource(resourceType, id);
      printSuccess(`${resourceType}/${id} 已删除`);
      await engine.stop();
    } catch (error) {
      handleError(error);
    }
  });

// history subcommand — Phase 2 (requires FhirStore API, not available on FhirPersistence facade)
