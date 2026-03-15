/**
 * Smoke test — verify test infrastructure and basic imports work.
 */
import { describe, it, expect } from 'vitest';
import { ExitCode, CliError } from '../core/error-handler.js';
import { findConfigFile } from '../core/config-loader.js';

describe('smoke test', () => {
  it('ExitCode constants are correct', () => {
    expect(ExitCode.SUCCESS).toBe(0);
    expect(ExitCode.RUNTIME_ERROR).toBe(1);
    expect(ExitCode.VALIDATION_FAILED).toBe(2);
    expect(ExitCode.NOT_FOUND).toBe(3);
    expect(ExitCode.CONFIG_ERROR).toBe(4);
    expect(ExitCode.IG_ERROR).toBe(5);
  });

  it('CliError has correct properties', () => {
    const err = new CliError('test message', 'TEST_CODE', ExitCode.CONFIG_ERROR, 'some hint');
    expect(err.message).toBe('test message');
    expect(err.code).toBe('TEST_CODE');
    expect(err.exitCode).toBe(4);
    expect(err.hint).toBe('some hint');
    expect(err.name).toBe('CliError');
    expect(err).toBeInstanceOf(Error);
  });

  it('CliError defaults to RUNTIME_ERROR exit code', () => {
    const err = new CliError('msg', 'CODE');
    expect(err.exitCode).toBe(ExitCode.RUNTIME_ERROR);
  });

  it('findConfigFile returns undefined for non-project dir', () => {
    const result = findConfigFile('/tmp/nonexistent-fhir-test-dir');
    expect(result).toBeUndefined();
  });
});
