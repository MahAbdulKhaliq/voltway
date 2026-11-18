// B78 (QA 2026-11-18, S1): a trip's stops stay in its country.
import { describe, expect, it } from 'vitest';
import type { MapFeature } from '../src/lib/map-data.ts';
import { inTripCountries, stationCountry } from '../src/lib/station-country.ts';

const st = (i: number, src: string, r?: string): MapFeature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-79, 43] },
  properties: { i, n: `S${i}`, p: [], src, ...(r ? { r } : {}) },
});

describe('stationCountry', () => {
  it('reads AFDC stations by source and OCM ones by province or state', () => {
    expect(stationCountry(st(1, 'src-afdc-ca', 'ON'))).toBe('ca');
    expect(stationCountry(st(2, 'src-afdc-us', 'NY'))).toBe('us');
    expect(stationCountry(st(3, 'src-ocm', 'ON'))).toBe('ca');
    expect(stationCountry(st(4, 'src-ocm', 'CA'))).toBe('us'); // California
    expect(stationCountry(st(5, 'src-ocm'))).toBeNull();
  });
});

describe('inTripCountries', () => {
  const all = [st(1, 'src-afdc-ca', 'ON'), st(2, 'src-afdc-us', 'NY'), st(3, 'src-ocm', 'NY'), st(4, 'src-ocm')];
  it('a Canadian trip (Fort Erie → Niagara Falls ON) never stops in New York', () => {
    expect(inTripCountries(all, ['ca']).map((f) => f.properties.i)).toEqual([1, 4]);
  });
  it('a US trip keeps US stations and unknowns', () => {
    expect(inTripCountries(all, ['us']).map((f) => f.properties.i)).toEqual([2, 3, 4]);
  });
  it('both countries (a border-town trip) or no list keeps everything', () => {
    expect(inTripCountries(all, ['ca', 'us'])).toHaveLength(4);
    expect(inTripCountries(all, undefined)).toHaveLength(4);
  });
});
