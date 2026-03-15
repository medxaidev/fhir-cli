import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExitCode, CliError, handleError } from '../error-handler.js';

describe('ExitCode', () => {
  it('defines all expected exit codes', () => {
    expect(ExitCode.SUCCESS).toBe(0);
    expect(ExitCode.RUNTIME_ERROR).toBe(1);
    expect(ExitCode.VALIDATION_FAILED).toBe(2);
    expect(ExitCode.NOT_FOUND).toBe(3);
    expect(ExitCode.CONFIG_ERROR).toBe(4);
    expect(ExitCode.IG_ERROR).toBe(5);
  });

  it('exit codes are readonly', () => {
    const codes = { ...ExitCode };
    expect(Object.keys(codes)).toHaveLength(6);
  });
});

describe('CliError', () => {
  it('creates error with all properties', () => {
    const err = new CliError('msg', 'CODE', ExitCode.CONFIG_ERROR, 'hint');
    expect(err.message).toBe('msg');
    expect(err.code).toBe('CODE');
    expect(err.exitCode).toBe(4);
    expect(err.hint).toBe('hint');
    expect(err.name).toBe('CliError');
  });

  it('extends Error', () => {
    const err = new CliError('test', 'TEST');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CliError);
  });

  it('defaults exitCode to RUNTIME_ERROR', () => {
    const err = new CliError('msg', 'CODE');
    expect(err.exitCode).toBe(ExitCode.RUNTIME_ERROR);
  });

  it('defaults hint to undefined', () => {
    const err = new CliError('msg', 'CODE');
    expect(err.hint).toBeUndefined();
  });

  it('has correct stack trace', () => {
    const err = new CliError('msg', 'CODE');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('CliError');
  });
});

describe('handleError', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles CliError with code and hint', () => {
    const err = new CliError('test message', 'TEST_CODE', ExitCode.CONFIG_ERROR, 'try this');
    handleError(err);
    expect(stderrSpy).toHaveBeenCalled();
    const output = stderrSpy.mock.calls[0]![0] as string;
    expect(output).toContain('test message');
    expect(output).toContain('TEST_CODE');
    expect(output).toContain('try this');
    expect(exitSpy).toHaveBeenCalledWith(ExitCode.CONFIG_ERROR);
  });

  it('handles CliError without hint', () => {
    const err = new CliError('no hint', 'CODE');
    handleError(err);
    const output = stderrSpy.mock.calls[0]![0] as string;
    expect(output).not.toContain('提示');
    expect(exitSpy).toHaveBeenCalledWith(ExitCode.RUNTIME_ERROR);
  });

  it('handles generic Error', () => {
    handleError(new Error('generic error'));
    const output = stderrSpy.mock.calls[0]![0] as string;
    expect(output).toContain('generic error');
    expect(exitSpy).toHaveBeenCalledWith(ExitCode.RUNTIME_ERROR);
  });

  it('handles unknown error (string)', () => {
    handleError('some string error');
    const output = stderrSpy.mock.calls[0]![0] as string;
    expect(output).toContain('some string error');
    expect(exitSpy).toHaveBeenCalledWith(ExitCode.RUNTIME_ERROR);
  });

  it('handles unknown error (number)', () => {
    handleError(42);
    const output = stderrSpy.mock.calls[0]![0] as string;
    expect(output).toContain('42');
    expect(exitSpy).toHaveBeenCalledWith(ExitCode.RUNTIME_ERROR);
  });
});
