// The countries the charger data covers (Canada since Phase 2, the US since Phase 7, B78).
// Each source is fetched, checked and imported per country, so a failed US pull never blocks
// Canada and the other way round (DESIGN-7 D1). One file per source and country:
//   sources/<source>-<cc>/            the raw pull (git-ignored) and its FETCHED.json
//   data/imported/<source>/<cc>.json  the normalised stations (committed)

import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type Country = 'ca' | 'us';
export const COUNTRIES: readonly Country[] = ['ca', 'us'];

export const COUNTRY_NAME: Record<Country, string> = { ca: 'Canada', us: 'US' };
/** What the change summaries call a country's regions. */
export const REGION_NAME: Record<Country, string> = { ca: 'Province', us: 'State' };

interface Box { latMin: number; latMax: number; lonMin: number; lonMax: number }
/**
 * Loose boxes around each country; a station outside them has bad coordinates.
 * The US boxes take in Alaska, Hawaii and the territories AFDC lists (Puerto Rico, the Virgin
 * Islands, Guam and the Northern Marianas).
 */
const BOXES: Record<Country, Box[]> = {
  ca: [{ latMin: 41, latMax: 84, lonMin: -142, lonMax: -52 }],
  us: [
    { latMin: 13, latMax: 72, lonMin: -180, lonMax: -64 },
    { latMin: 13, latMax: 21, lonMin: 144, lonMax: 146 },
  ],
};

export function inCountryBox(country: Country, lat: number, lon: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return BOXES[country].some((b) => lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax);
}

/** `--country=us` (or `--country us`) from a script's arguments; Canada when not given. */
export function countryArg(argv: readonly string[] = process.argv): Country {
  let value: string | undefined;
  argv.forEach((a, i) => {
    if (a.startsWith('--country=')) value = a.slice('--country='.length);
    else if (a === '--country') value = argv[i + 1];
  });
  if (value === undefined) return 'ca';
  const c = value.toLowerCase();
  if (!(COUNTRIES as readonly string[]).includes(c)) throw new Error(`unknown country "${value}" (use ${COUNTRIES.join(' or ')})`);
  return c as Country;
}

export type ChargerSource = 'afdc' | 'ocm';

/** sources/<source>-<cc>: the raw pull for one source and country. */
export const rawDir = (root: string, source: ChargerSource, country: Country) => join(root, 'sources', `${source}-${country}`);
/** data/imported/<source>/<cc>.json: the committed, normalised stations. */
export const importedFile = (root: string, source: ChargerSource, country: Country) =>
  join(root, 'data', 'imported', source, `${country}.json`);

/** The imported files that exist for a source, in COUNTRIES order. */
export function importedFiles(root: string, source: ChargerSource): { country: Country; path: string }[] {
  return COUNTRIES.map((country) => ({ country, path: importedFile(root, source, country) })).filter((f) => existsSync(f.path));
}
