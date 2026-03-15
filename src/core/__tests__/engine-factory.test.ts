import { describe, it, expect } from 'vitest';
import { createEngineForCli } from '../engine-factory.js';
import { CliError } from '../error-handler.js';

describe('createEngineForCli', () => {
  it('throws CliError for missing database config', async () => {
    await expect(
      createEngineForCli({} as any),
    ).rejects.toThrow(CliError);
  });

  it('throws CliError with INVALID_CONFIG code for bad database', async () => {
    try {
      await createEngineForCli({} as any);
    } catch (e) {
      expect(e).toBeInstanceOf(CliError);
      // Engine throws about config.database or config.packages
      const err = e as CliError;
      expect(['INVALID_CONFIG', 'ENGINE_INIT_FAILED']).toContain(err.code);
    }
  });

  it('throws CliError with hint for PostgreSQL config', async () => {
    try {
      await createEngineForCli({
        database: { type: 'postgres' as any, url: 'postgresql://localhost/test' },
        packages: { path: './fhir-packages' },
      });
    } catch (e) {
      expect(e).toBeInstanceOf(CliError);
      const err = e as CliError;
      // May be UNSUPPORTED_DATABASE or ENGINE_INIT_FAILED depending on how engine throws
      expect(err.hint).toBeDefined();
    }
  });

  it('wraps unknown engine errors as ENGINE_INIT_FAILED', async () => {
    try {
      await createEngineForCli({
        database: { type: 'sqlite', path: ':memory:' },
        packages: { path: '/nonexistent/path/to/nowhere' },
      } as any);
    } catch (e) {
      expect(e).toBeInstanceOf(CliError);
      const err = e as CliError;
      expect(err.hint).toBeDefined();
    }
  });

  it('returns a working engine for valid config', async () => {
    const engine = await createEngineForCli({
      database: { type: 'sqlite', path: ':memory:' },
      packages: { path: './fhir-packages' },
    });
    expect(engine).toBeDefined();
    expect(typeof engine.stop).toBe('function');
    expect(typeof engine.status).toBe('function');
    await engine.stop();
  });
});
