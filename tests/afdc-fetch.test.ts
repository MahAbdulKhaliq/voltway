import { describe, expect, it } from 'vitest';
import { AFDC_API, AFDC_QUERY, responseProblem } from '../scripts/fetch-afdc';

describe('fetch-afdc', () => {
  it('uses the NLR host (developer.nrel.gov was retired 2026-05-29)', () => {
    expect(AFDC_API).toMatch(/^https:\/\/developer\.nlr\.gov\//);
  });

  it('asks for every Canadian electric station, with no key in the query', () => {
    expect(AFDC_QUERY).toContain('country=CA');
    expect(AFDC_QUERY).toContain('fuel_type=ELEC');
    expect(AFDC_QUERY).toContain('limit=all');
    expect(AFDC_QUERY).not.toMatch(/api_key/i);
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
