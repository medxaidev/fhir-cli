/**
 * `fhir query <ResourceType[?params]>` — FHIR search.
 *
 * Uses engine.search() high-level API (fhir-engine v0.3.0+).
 */
import { Command } from 'commander';
import { initEngineForCommand } from '../core/config-loader.js';
import { printJson, printTable } from '../core/output.js';
import { CliError, ExitCode, handleError } from '../core/error-handler.js';

/**
 * Parse a query string like "Patient?name=Smith&birthdate=ge1990-01-01"
 * into { resourceType, queryParams }.
 */
function parseQueryArg(arg: string): {
  resourceType: string;
  queryParams: Record<string, string>;
} {
  const [resourceType, queryString] = arg.split('?');
  if (!resourceType) {
    throw new CliError(
      `无效的查询: ${arg}`,
      'INVALID_QUERY',
      ExitCode.RUNTIME_ERROR,
      '格式: ResourceType 或 ResourceType?param=value',
    );
  }

  const queryParams: Record<string, string> = {};
  if (queryString) {
    for (const pair of queryString.split('&')) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        queryParams[key] = decodeURIComponent(value);
      }
    }
  }

  return { resourceType, queryParams };
}

export const queryCommand = new Command('query')
  .description('FHIR 搜索')
  .argument('<query>', '查询表达式 (例: Patient?name=Smith)')
  .option('--format <format>', '输出格式 (json|table)', 'json')
  .option('--count <n>', '结果数量限制', '20')
  .option('--config <path>', '配置文件路径')
  .action(
    async (
      query: string,
      opts: { format?: string; count?: string; config?: string },
    ) => {
      try {
        const engine = await initEngineForCommand(opts);
        const { resourceType, queryParams } = parseQueryArg(query);

        // Add _count if specified
        if (opts.count && !queryParams['_count']) {
          queryParams['_count'] = opts.count;
        }

        // Use engine.search() high-level API
        const result = await engine.search(resourceType, queryParams);

        if (opts.format === 'table') {
          const rows = (result.resources ?? []).map(
            (r: Record<string, unknown>) => ({
              id: r.id,
              resourceType: r.resourceType,
              lastUpdated: r.lastUpdated ?? '',
            }),
          );
          printTable(rows);
        } else {
          printJson(result);
        }

        await engine.stop();
      } catch (error) {
        handleError(error);
      }
    },
  );
