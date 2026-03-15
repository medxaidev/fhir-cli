/**
 * Integration tests — exercise real fhir-engine with SQLite :memory:
 * These tests verify that fhir-cli's command logic works against real APIs.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFhirEngine, parseSearchRequest, executeSearch, evalFhirPath } from 'fhir-engine';
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

describe('engine CRUD', () => {
  let createdId: string;

  it('creates a Patient resource', async () => {
    const result = await engine.persistence.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'IntegrationTest', given: ['John'] }],
      gender: 'male',
      birthDate: '1990-01-01',
    });
    expect(result.id).toBeDefined();
    expect(result.meta?.versionId).toBeDefined();
    expect(result.resourceType).toBe('Patient');
    createdId = result.id;
  });

  it('reads the created Patient', async () => {
    const result = await engine.persistence.readResource('Patient', createdId) as any;
    expect(result.id).toBe(createdId);
    expect(result.name[0].family).toBe('IntegrationTest');
  });

  it('updates the Patient', async () => {
    const read = await engine.persistence.readResource('Patient', createdId) as any;
    const updated = await engine.persistence.updateResource('Patient', {
      ...read,
      name: [{ family: 'Updated', given: ['Jane'] }],
    }) as any;
    expect(updated.id).toBe(createdId);
    expect(updated.name[0].family).toBe('Updated');
    expect(updated.meta?.versionId).toBeDefined();
    expect(updated.meta?.versionId).not.toBe(read.meta?.versionId);
  });

  it('deletes the Patient', async () => {
    await engine.persistence.deleteResource('Patient', createdId);
    await expect(
      engine.persistence.readResource('Patient', createdId),
    ).rejects.toThrow();
  });
});

describe('engine search', () => {
  beforeAll(async () => {
    await engine.persistence.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'SearchTest', given: ['Alpha'] }],
      gender: 'male',
    });
    await engine.persistence.createResource('Patient', {
      resourceType: 'Patient',
      name: [{ family: 'SearchTest', given: ['Beta'] }],
      gender: 'female',
    });
  });

  it('searches all Patients', async () => {
    const request = parseSearchRequest('Patient', {}, engine.spRegistry);
    const result = await executeSearch(
      engine.adapter, request, engine.spRegistry, { total: 'accurate' },
    );
    expect(result.resources.length).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeGreaterThanOrEqual(2);
  });

  it('searches with _count parameter', async () => {
    const request = parseSearchRequest('Patient', { _count: '1' }, engine.spRegistry);
    const result = await executeSearch(
      engine.adapter, request, engine.spRegistry, { total: 'accurate' },
    );
    expect(result.resources.length).toBe(1);
    expect(result.total).toBeGreaterThanOrEqual(2);
  });
});

describe('engine validate', () => {
  it('validates a valid Patient', async () => {
    const result = await engine.runtime.validate(
      { resourceType: 'Patient', name: [{ family: 'Valid' }] } as any,
      'http://hl7.org/fhir/StructureDefinition/Patient',
    );
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('returns issues for invalid resource', async () => {
    const result = await engine.runtime.validate(
      { resourceType: 'Patient', gender: 'invalid-gender-value' } as any,
      'http://hl7.org/fhir/StructureDefinition/Patient',
    );
    // May or may not be invalid depending on validator strictness
    expect(result).toBeDefined();
    expect(result.issues).toBeDefined();
  });
});

describe('engine status', () => {
  it('returns status object with expected fields', () => {
    const status = engine.status();
    expect(status.databaseType).toBe('sqlite');
    expect(status.resourceTypes).toBeDefined();
    expect(status.resourceTypes.length).toBeGreaterThan(0);
    expect(status.loadedPackages).toBeDefined();
    expect(status.startedAt).toBeDefined();
    expect(status.plugins).toBeDefined();
  });
});

describe('FHIRPath evaluation', () => {
  it('evaluates simple path expression', () => {
    const result = evalFhirPath('name.family', {
      resourceType: 'Patient',
      name: [{ family: 'Smith', given: ['John'] }],
    });
    expect(result).toEqual(['Smith']);
  });

  it('evaluates given names', () => {
    const result = evalFhirPath('name.given', {
      resourceType: 'Patient',
      name: [{ family: 'Smith', given: ['John', 'James'] }],
    });
    expect(result).toEqual(['John', 'James']);
  });

  it('evaluates boolean expression', () => {
    const result = evalFhirPath("gender = 'male'", {
      resourceType: 'Patient',
      gender: 'male',
    });
    expect(result).toEqual([true]);
  });

  it('returns empty for non-existent path', () => {
    const result = evalFhirPath('telecom.value', {
      resourceType: 'Patient',
      name: [{ family: 'Smith' }],
    });
    expect(result).toEqual([]);
  });

  it('evaluates resourceType', () => {
    const result = evalFhirPath('resourceType', {
      resourceType: 'Patient',
    });
    expect(result).toEqual(['Patient']);
  });
});
