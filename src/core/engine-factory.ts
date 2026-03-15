/**
 * Engine factory — wraps createFhirEngine() with CLI-specific error handling.
 */
import { createFhirEngine } from 'fhir-engine';
import type { FhirEngine, FhirEngineConfig } from 'fhir-engine';
import { CliError, ExitCode } from './error-handler.js';

/**
 * Create a FhirEngine with CLI-friendly error wrapping.
 * Catches upstream engine errors and re-throws as CliError with actionable hints.
 */
export async function createEngineForCli(
  config: FhirEngineConfig,
): Promise<FhirEngine> {
  try {
    return await createFhirEngine(config);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    // Config validation errors from fhir-engine
    if (message.includes('config.database')) {
      throw new CliError(
        message,
        'INVALID_CONFIG',
        ExitCode.CONFIG_ERROR,
        '请检查 fhir.config.json 中的 database 配置。',
      );
    }

    if (message.includes('config.packages')) {
      throw new CliError(
        message,
        'INVALID_CONFIG',
        ExitCode.CONFIG_ERROR,
        '请检查 fhir.config.json 中的 packages.path 是否指向有效的 FHIR 包目录。',
      );
    }

    if (message.includes('PostgreSQL')) {
      throw new CliError(
        message,
        'UNSUPPORTED_DATABASE',
        ExitCode.CONFIG_ERROR,
        'fhir-cli MVP 仅支持 SQLite。请将 database.type 设为 "sqlite"。',
      );
    }

    // Generic engine error
    throw new CliError(
      `引擎启动失败: ${message}`,
      'ENGINE_INIT_FAILED',
      ExitCode.RUNTIME_ERROR,
      '请运行 fhir doctor 检查环境配置。',
    );
  }
}
