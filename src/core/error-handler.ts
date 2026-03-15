/**
 * CLI error types and error handling utilities.
 */

/** Exit codes per ARCHITECTURE.md § 8.1 */
export const ExitCode = {
  SUCCESS: 0,
  RUNTIME_ERROR: 1,
  VALIDATION_FAILED: 2,
  NOT_FOUND: 3,
  CONFIG_ERROR: 4,
  IG_ERROR: 5,
} as const;

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];

/**
 * Typed CLI error with error code and optional hint.
 */
export class CliError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly exitCode: ExitCodeValue = ExitCode.RUNTIME_ERROR,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

/**
 * Format and print a CliError to stderr, then exit.
 */
export function handleError(error: unknown): never {
  if (error instanceof CliError) {
    process.stderr.write(
      `\n✗ ${error.message}\n` +
      `  Code: ${error.code}\n` +
      (error.hint ? `  Hint: ${error.hint}\n` : ''),
    );
    process.exit(error.exitCode);
  }

  // Upstream engine / persistence errors
  if (error instanceof Error) {
    process.stderr.write(`\n✗ ${error.message}\n`);
    process.exit(ExitCode.RUNTIME_ERROR);
  }

  // Unknown error shape
  process.stderr.write(`\n✗ Unknown error: ${String(error)}\n`);
  process.exit(ExitCode.RUNTIME_ERROR);
}
