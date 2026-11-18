import { sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countryArg, importedFile, inCountryBox, rawDir } from '../scripts/lib/countries.ts';

describe('countries (B78, DESIGN-7 D1)', () => {
  it('reads --country from the arguments, Canada by default', () => {
    expect(countryArg(['node', 'x.ts'])).toBe('ca');
    expect(countryArg(['node', 'x.ts', '--country=us'])).toBe('us');
    expect(countryArg(['node', 'x.ts', '--country', 'US'])).toBe('us');
    expect(countryArg(['node', 'x.ts', '--skip-checks', '--country=ca'])).toBe('ca');
    expect(() => countryArg(['node', 'x.ts', '--country=mx'])).toThrow(/unknown country/);
  });
  it('puts each source and country in its own file', () => {
    expect(rawDir('/r', 'afdc', 'us').split(sep).join('/')).toBe('/r/sources/afdc-us');
    expect(importedFile('/r', 'ocm', 'ca').split(sep).join('/')).toBe('/r/data/imported/ocm/ca.json');
  });
  it('places stations in the right loose box', () => {
    expect(inCountryBox('ca', 43.65, -79.38)).toBe(true); // Toronto
    expect(inCountryBox('us', 43.65, -79.38)).toBe(true); // the boxes overlap near the border; the check is loose
    expect(inCountryBox('us', 61.22, -149.9)).toBe(true); // Anchorage
    expect(inCountryBox('us', 13.47, 144.75)).toBe(true); // Guam
    expect(inCountryBox('ca', 30.27, -97.74)).toBe(false); // Austin
    expect(inCountryBox('us', 51.5, -0.12)).toBe(false); // London
    expect(inCountryBox('us', Number.NaN, -97)).toBe(false);
  });
});
