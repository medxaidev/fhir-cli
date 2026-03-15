import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  printJson,
  printTable,
  printSuccess,
  printInfo,
  printWarning,
  printError,
} from '../output.js';

describe('printJson', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints formatted JSON with newline', () => {
    printJson({ a: 1 });
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).toBe('{\n  "a": 1\n}\n');
  });

  it('prints arrays', () => {
    printJson([1, 2, 3]);
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).toContain('[');
    expect(output).toContain('1');
  });

  it('prints null', () => {
    printJson(null);
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).toBe('null\n');
  });

  it('prints strings', () => {
    printJson('hello');
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).toBe('"hello"\n');
  });

  it('prints nested objects', () => {
    printJson({ a: { b: { c: 1 } } });
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(JSON.parse(output)).toEqual({ a: { b: { c: 1 } } });
  });
});

describe('printTable', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints empty result message for empty array', () => {
    printTable([]);
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).toContain('空结果');
  });

  it('prints header and rows', () => {
    printTable([{ name: 'Alice', age: 30 }]);
    const calls = stdoutSpy.mock.calls.map((c: unknown[]) => c[0] as string);
    const allOutput = calls.join('');
    expect(allOutput).toContain('name');
    expect(allOutput).toContain('age');
    expect(allOutput).toContain('Alice');
    expect(allOutput).toContain('30');
  });

  it('aligns columns correctly', () => {
    printTable([
      { id: '1', name: 'Short' },
      { id: '2', name: 'LongerName' },
    ]);
    const calls = stdoutSpy.mock.calls.map((c: unknown[]) => c[0] as string);
    const allOutput = calls.join('');
    expect(allOutput).toContain('Short');
    expect(allOutput).toContain('LongerName');
  });

  it('respects custom columns parameter', () => {
    printTable([{ a: 1, b: 2, c: 3 }], ['a', 'c']);
    const calls = stdoutSpy.mock.calls.map((c: unknown[]) => c[0] as string);
    const allOutput = calls.join('');
    expect(allOutput).toContain('a');
    expect(allOutput).toContain('c');
    expect(allOutput).not.toContain('  b  ');
  });

  it('handles undefined values gracefully', () => {
    printTable([{ name: 'Alice', age: undefined }]);
    const calls = stdoutSpy.mock.calls.map((c: unknown[]) => c[0] as string);
    const allOutput = calls.join('');
    expect(allOutput).toContain('Alice');
  });
});

describe('printSuccess / printInfo / printWarning / printError', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('printSuccess writes to stdout', () => {
    printSuccess('done');
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).toContain('done');
  });

  it('printInfo writes to stdout', () => {
    printInfo('info msg');
    expect(stdoutSpy).toHaveBeenCalled();
    const output = stdoutSpy.mock.calls[0]![0] as string;
    expect(output).toContain('info msg');
  });

  it('printWarning writes to stderr', () => {
    printWarning('warn msg');
    expect(stderrSpy).toHaveBeenCalled();
    const output = stderrSpy.mock.calls[0]![0] as string;
    expect(output).toContain('warn msg');
  });

  it('printError writes to stderr', () => {
    printError('err msg');
    expect(stderrSpy).toHaveBeenCalled();
    const output = stderrSpy.mock.calls[0]![0] as string;
    expect(output).toContain('err msg');
  });
});
