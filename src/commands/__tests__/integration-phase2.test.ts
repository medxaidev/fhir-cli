/**
 * Phase 2 integration tests — history, engine.search(), engine lifecycle, IG management.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFhirEngine } from 'fhir-engine';
import type { FhirEngine } from 'fhir-engine';

let engine: FhirEngine;

beforeAll(async () => {
  engine = await createFhirEngine({
    database: { type: 'sqlite', path: ':memory:' },
    packages: { path: './fhir-packages' },
  });
}, 30_000);

afterAll(async () => {
  await engine?.stop();
});

describe('resource history', () => {
  let patientId: string;

  beforeAll(async () => {
    // Create and then update a patient to have multiple versions
    const created = await engine.persistence.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'HistoryTest', given: ['V1'] }],
    });
    patientId = created.id;

    const read = await engine.persistence.readResource('Patient', patientId) as any;
    await engine.persistence.updateResource('Patient', {
      ...read,
      name: [{ family: 'HistoryTest', given: ['V2'] }],
    });

    const read2 = await engine.persistence.readResource('Patient', patientId) as any;
    await engine.persistence.updateResource('Patient', {
      ...read2,
      name: [{ family: 'HistoryTest', given: ['V3'] }],
    });
  });

  it('returns version history for a resource', async () => {
    const history = await engine.persistence.readHistory('Patient', patientId) as any[];
    expect(history.length).toBe(3);
  });

  it('history entries have correct structure', async () => {
    const history = await engine.persistence.readHistory('Patient', patientId) as any[];
    for (const entry of history) {
      expect(entry.id).toBe(patientId);
      expect(entry.versionId).toBeDefined();
      expect(entry.lastUpdated).toBeDefined();
      expect(entry.resourceType).toBe('Patient');
      expect(typeof entry.deleted).toBe('boolean');
    }
  });

  it('history entries are in reverse chronological order (newest first)', async () => {
    const history = await engine.persistence.readHistory('Patient', patientId) as any[];
    const timestamps = history.map((e: any) => new Date(e.lastUpdated).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
    }
  });

  it('each version has the correct resource content', async () => {
    const history = await engine.persistence.readHistory('Patient', patientId) as any[];
    const givenNames = history.map((e: any) => e.resource.name[0].given[0]);
    // readHistory returns newest first
    expect(givenNames).toEqual(['V3', 'V2', 'V1']);
  });

  it('readVersion retrieves a specific version', async () => {
    const history = await engine.persistence.readHistory('Patient', patientId) as any[];
    // history[0] is newest (V3), history[2] is oldest (V1)
    const v1VersionId = history[history.length - 1].versionId;
    const v1 = await engine.persistence.readVersion('Patient', patientId, v1VersionId) as any;
    expect(v1.name[0].given[0]).toBe('V1');
  });
});

describe('engine.search() high-level API', () => {
  beforeAll(async () => {
    await engine.persistence.createResource('Observation', {
      resourceType: 'Observation',
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '1234-5' }] },
      subject: { reference: 'Patient/test-patient' },
    });
    await engine.persistence.createResource('Observation', {
      resourceType: 'Observation',
      status: 'preliminary',
      code: { coding: [{ system: 'http://loinc.org', code: '6789-0' }] },
      subject: { reference: 'Patient/test-patient' },
    });
  });

  it('searches without parameters', async () => {
    const result = await engine.search('Observation', {});
    expect(result.resources.length).toBeGreaterThanOrEqual(2);
  });

  it('returns resources and total', async () => {
    const result = await engine.search('Observation', {});
    expect(result.resources).toBeDefined();
    expect(Array.isArray(result.resources)).toBe(true);
  });

  it('searches with _count parameter', async () => {
    const result = await engine.search('Observation', { _count: '1' });
    expect(result.resources.length).toBe(1);
  });

  it('searches Patient resources', async () => {
    const result = await engine.search('Patient', {});
    // Should include the HistoryTest patient from above
    expect(result.resources.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty for non-matching search', async () => {
    const result = await engine.search('Condition', {});
    expect(result.resources.length).toBe(0);
  });
});

describe('engine status and lifecycle', () => {
  it('status includes expected fields', () => {
    const status = engine.status();
    expect(status.databaseType).toBe('sqlite');
    expect(status.fhirVersions).toBeDefined();
    expect(status.resourceTypes.length).toBeGreaterThan(0);
    expect(status.startedAt).toBeDefined();
    expect(status.igAction).toBeDefined();
  });

  it('status loadedPackages includes R4 core', () => {
    const status = engine.status();
    expect(status.loadedPackages.length).toBeGreaterThan(0);
    const hasR4 = status.loadedPackages.some(
      (p: string) => p.includes('hl7.fhir.r4.core'),
    );
    expect(hasR4).toBe(true);
  });

  it('can create a new engine and stop it', async () => {
    const tempEngine = await createFhirEngine({
      database: { type: 'sqlite', path: ':memory:' },
      packages: { path: './fhir-packages' },
    });
    expect(tempEngine.status().databaseType).toBe('sqlite');
    await tempEngine.stop();
  });

  it('stop is idempotent', async () => {
    const tempEngine = await createFhirEngine({
      database: { type: 'sqlite', path: ':memory:' },
      packages: { path: './fhir-packages' },
    });
    await tempEngine.stop();
    // second stop should not throw
    await tempEngine.stop();
  });
});
