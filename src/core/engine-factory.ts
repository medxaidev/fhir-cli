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
        'Check the database configuration in fhir.config.json.',
      );
    }

    if (message.includes('config.packages')) {
      throw new CliError(
        message,
        'INVALID_CONFIG',
        ExitCode.CONFIG_ERROR,
        'Check that packages.path in fhir.config.json points to a valid FHIR package directory.',
      );
    }

    if (message.includes('ECONNREFUSED') || message.includes('connect ECONNREFUSED')) {
      throw new CliError(
        message,
        'DATABASE_CONNECTION_FAILED',
        ExitCode.CONFIG_ERROR,
        'Could not connect to PostgreSQL. Ensure the server is running and the connection URL in fhir.config.json is correct.',
      );
    }

    if (message.includes('password authentication failed') || message.includes('FATAL')) {
      throw new CliError(
        message,
        'DATABASE_AUTH_FAILED',
        ExitCode.CONFIG_ERROR,
        'PostgreSQL authentication failed. Check the username, password, and database name in your connection URL.',
      );
    }

    // Generic engine error
    throw new CliError(
      `Engine failed to start: ${message}`,
      'ENGINE_INIT_FAILED',
      ExitCode.RUNTIME_ERROR,
      'Run fhir doctor to check your environment.',
    );
  }
}
