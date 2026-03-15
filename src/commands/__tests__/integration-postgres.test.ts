/**
 * PostgreSQL Integration tests — exercise real fhir-engine with PostgreSQL.
 *
 * These tests require a running PostgreSQL instance. They are skipped
 * when the FHIR_PG_URL environment variable is not set.
 *
 * To run:
 *   FHIR_PG_URL="postgresql://user:pass@localhost:5432/fhir_test" npx vitest run src/commands/__tests__/integration-postgres.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFhirEngine, parseSearchRequest, executeSearch } from 'fhir-engine';
import type { FhirEngine } from 'fhir-engine';

const PG_URL = process.env.FHIR_PG_URL;
const describeIfPg = PG_URL ? describe : describe.skip;

let engine: FhirEngine;

describeIfPg('PostgreSQL integration', () => {
  beforeAll(async () => {
    engine = await createFhirEngine({
      database: { type: 'postgres', url: PG_URL! } as any,
      packages: { path: './fhir-packages' },
    });
  }, 60_000);

  afterAll(async () => {
    await engine?.stop();
  });

  it('engine starts with PostgreSQL and loads resource types', () => {
    const status = engine.status();
    expect(status.databaseType).toBe('postgres');
    expect(status.resourceTypes.length).toBeGreaterThan(0);
    expect(status.loadedPackages.length).toBeGreaterThan(0);
  });

  describe('CRUD operations', () => {
    let createdId: string;

    it('creates a Patient resource', async () => {
      const result = await engine.persistence.createResource('Patient', {
        resourceType: 'Patient',
        name: [{ family: 'PgTest', given: ['Alice'] }],
        gender: 'female',
        birthDate: '1985-06-15',
      });
      expect(result.id).toBeDefined();
      expect(result.meta?.versionId).toBeDefined();
      createdId = result.id;
    });

    it('reads the created Patient', async () => {
      const result = await engine.persistence.readResource('Patient', createdId) as any;
      expect(result.id).toBe(createdId);
      expect(result.name[0].family).toBe('PgTest');
    });

    it('updates the Patient', async () => {
      const read = await engine.persistence.readResource('Patient', createdId) as any;
      const updated = await engine.persistence.updateResource('Patient', {
        ...read,
        name: [{ family: 'PgUpdated', given: ['Alice'] }],
      }) as any;
      expect(updated.id).toBe(createdId);
      expect(updated.name[0].family).toBe('PgUpdated');
      expect(updated.meta?.versionId).not.toBe(read.meta?.versionId);
    });

    it('deletes the Patient', async () => {
      await engine.persistence.deleteResource('Patient', createdId);
      await expect(
        engine.persistence.readResource('Patient', createdId),
      ).rejects.toThrow();
    });
  });

  describe('search operations', () => {
    beforeAll(async () => {
      await engine.persistence.createResource('Patient', {
        resourceType: 'Patient',
        name: [{ family: 'PgSearch', given: ['Bob'] }],
        gender: 'male',
      });
      await engine.persistence.createResource('Patient', {
        resourceType: 'Patient',
        name: [{ family: 'PgSearch', given: ['Carol'] }],
        gender: 'female',
      });
    });

    it('searches all Patients', async () => {
      const request = parseSearchRequest('Patient', {}, engine.spRegistry);
      const result = await executeSearch(
        engine.adapter, request, engine.spRegistry, { total: 'accurate' },
      );
      expect(result.resources.length).toBeGreaterThanOrEqual(2);
    });

    it('searches with _count parameter', async () => {
      const request = parseSearchRequest('Patient', { _count: '1' }, engine.spRegistry);
      const result = await executeSearch(
        engine.adapter, request, engine.spRegistry, { total: 'accurate' },
      );
      expect(result.resources.length).toBe(1);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('searches by name (lookup table query)', async () => {
      const result = await engine.search('Patient', { name: 'PgSearch' });
      expect(result.resources.length).toBeGreaterThanOrEqual(2);
    });
  });
});
