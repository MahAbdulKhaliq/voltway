import { describe, expect, it } from 'vitest';
import { AFDC_API, afdcQuery, responseProblem } from '../scripts/fetch-afdc';

describe('fetch-afdc', () => {
  it('uses the NLR host (developer.nrel.gov was retired 2026-05-29)', () => {
    expect(AFDC_API).toMatch(/^https:\/\/developer\.nlr\.gov\//);
  });

  it('asks for every electric station in one country, with no key in the query (B78)', () => {
    for (const [c, code] of [['ca', 'CA'], ['us', 'US']] as const) {
      const q = new URLSearchParams(afdcQuery(c));
      expect(q.get('country')).toBe(code);
      expect(q.get('fuel_type')).toBe('ELEC');
      expect(q.get('limit')).toBe('all');
      expect(q.get('status')).toBe('all');
      expect(q.get('access')).toBe('all');
      expect(afdcQuery(c)).not.toMatch(/api_key/i);
    }
  });

  it('accepts a full response', () => {
    expect(responseProblem({ total_results: 2, fuel_stations: [{}, {}] })).toBeNull();
  });

  it('rejects partial, empty or malformed responses', () => {
    expect(responseProblem({ total_results: 3, fuel_stations: [{}, {}] })).toMatch(/partial/);
    expect(responseProblem({ total_results: 0, fuel_stations: [] })).toMatch(/no stations/);
    expect(responseProblem({ error: 'x' })).toMatch(/fuel_stations/);
    expect(responseProblem(null)).toMatch(/not a JSON object/);
  });
});
