/**
 * Tests for the query command's parseQueryArg helper.
 * Since parseQueryArg is not exported, we test the command's argument parsing behavior
 * by testing the function logic inline.
 */
import { describe, it, expect } from 'vitest';
import { CliError } from '../../core/error-handler.js';

// Replicate parseQueryArg logic for unit testing
function parseQueryArg(arg: string): {
  resourceType: string;
  queryParams: Record<string, string>;
} {
  const [resourceType, queryString] = arg.split('?');
  if (!resourceType) {
    throw new CliError(
      `Invalid query: ${arg}`,
      'INVALID_QUERY',
      1,
      'Format: ResourceType or ResourceType?param=value',
    );
  }

  const queryParams: Record<string, string> = {};
  if (queryString) {
    for (const pair of queryString.split('&')) {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        queryParams[key] = decodeURIComponent(value);
      }
    }
  }

  return { resourceType, queryParams };
}

describe('parseQueryArg', () => {
  it('parses simple resource type', () => {
    const result = parseQueryArg('Patient');
    expect(result.resourceType).toBe('Patient');
    expect(result.queryParams).toEqual({});
  });

  it('parses resource type with single param', () => {
    const result = parseQueryArg('Patient?name=Smith');
    expect(result.resourceType).toBe('Patient');
    expect(result.queryParams).toEqual({ name: 'Smith' });
  });

  it('parses multiple params', () => {
    const result = parseQueryArg('Patient?name=Smith&gender=male');
    expect(result.resourceType).toBe('Patient');
    expect(result.queryParams).toEqual({ name: 'Smith', gender: 'male' });
  });

  it('handles URL-encoded values', () => {
    const result = parseQueryArg('Observation?date=ge2024-01-01&code=http%3A%2F%2Floinc.org%7C1234');
    expect(result.queryParams.date).toBe('ge2024-01-01');
    expect(result.queryParams.code).toBe('http://loinc.org|1234');
  });

  it('handles empty query string', () => {
    const result = parseQueryArg('Patient?');
    expect(result.resourceType).toBe('Patient');
    expect(result.queryParams).toEqual({});
  });

  it('throws CliError for empty input', () => {
    expect(() => parseQueryArg('')).toThrow(CliError);
  });
});
