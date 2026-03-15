/**
 * Output formatting utilities for CLI commands.
 * Supports JSON, table, and FHIR resource pretty-print formats.
 */
import chalk from 'chalk';

export type OutputFormat = 'json' | 'table' | 'text';

/**
 * Print a FHIR resource or arbitrary object as formatted JSON to stdout.
 */
export function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

/**
 * Print a simple key-value table to stdout.
 */
export function printTable(
  rows: Record<string, unknown>[],
  columns?: string[],
): void {
  if (rows.length === 0) {
    process.stdout.write('(空结果)\n');
    return;
  }

  const cols = columns ?? Object.keys(rows[0]!);

  // Compute column widths
  const widths = cols.map((col) =>
    Math.max(
      col.length,
      ...rows.map((r) => String(r[col] ?? '').length),
    ),
  );

  // Header
  const header = cols.map((c, i) => c.padEnd(widths[i]!)).join('  ');
  const separator = widths.map((w) => '─'.repeat(w)).join('──');

  process.stdout.write(chalk.bold(header) + '\n');
  process.stdout.write(separator + '\n');

  // Rows
  for (const row of rows) {
    const line = cols
      .map((c, i) => String(row[c] ?? '').padEnd(widths[i]!))
      .join('  ');
    process.stdout.write(line + '\n');
  }
}

/**
 * Print a success message.
 */
export function printSuccess(message: string): void {
  process.stdout.write(chalk.green('✓') + ' ' + message + '\n');
}

/**
 * Print an info message.
 */
export function printInfo(message: string): void {
  process.stdout.write(chalk.blue('ℹ') + ' ' + message + '\n');
}

/**
 * Print a warning message to stderr.
 */
export function printWarning(message: string): void {
  process.stderr.write(chalk.yellow('⚠') + ' ' + message + '\n');
}

/**
 * Print an error message to stderr.
 */
export function printError(message: string): void {
  process.stderr.write(chalk.red('✗') + ' ' + message + '\n');
}
