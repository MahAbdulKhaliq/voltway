// Which country a map station is in (B78), for keeping a trip's charging stops in the trip's
// country (Stay within the border, DESIGN-7 D4; QA 2026-11-18 S1: a Fort Erie → Niagara Falls trip
// planned a stop at a Supercharger in New York). AFDC records say it by their source; Open Charge
// Map records by their province or state code. Null when neither tells (a few OCM US records).

import type { CountryCode } from './country.ts';
import type { MapFeature } from './map-data.ts';

const PROVINCES = new Set(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']);
const STATES = new Set(
  'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR VI GU MP AS'.split(' '),
);

export function stationCountry(f: MapFeature): CountryCode | null {
  const { src, r } = f.properties;
  if (src === 'src-afdc-ca') return 'ca';
  if (src === 'src-afdc-us') return 'us';
  // "CA" is both California and nothing in Canada (Canadian codes never clash with states).
  if (r && PROVINCES.has(r)) return 'ca';
  if (r && STATES.has(r)) return 'us';
  return null;
}

/**
 * The stations a trip may stop at: those in one of the trip's countries (the countries both ends
 * share, from /api/route). Stations of unknown country are kept; an empty or missing list keeps all.
 */
export function inTripCountries(stations: readonly MapFeature[], countries: readonly CountryCode[] | undefined): MapFeature[] {
  if (!countries || countries.length === 0 || countries.length > 1) return [...stations];
  return stations.filter((f) => {
    const c = stationCountry(f);
    return c === null || c === countries[0];
  });
}
