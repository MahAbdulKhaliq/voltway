// Land check for imported stations (owner decision 2026-11-18, US data audit F2): a station whose
// position isn't in its own country (on the Natural Earth outlines, data/imported/naturalearth/)
// is dropped as no_location. The simplified outlines cut a little off coasts and piers, so a
// station within LAND_SLACK_KM of its country's outline still counts.
// Catches: an Oregon lodge plotted in Alberta, points in the sea, Canadian records in OCM's US pull.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeCountriesOf, type CountryCode, type Outline } from '../../src/lib/country.ts';

export const LAND_SLACK_KM = 2;

export type OnLand = (country: CountryCode, lon: number, lat: number) => boolean;

/** The land check from a countriesOf function (src/lib/country.ts). */
export function makeOnLandFrom(countriesOf: (lon: number, lat: number) => CountryCode[], slackKm = LAND_SLACK_KM): OnLand {
  return (country, lon, lat) => {
    if (countriesOf(lon, lat).includes(country)) return true;
    // The point and eight around it at the slack distance.
    const d = slackKm / 111.32;
    const dl = d / Math.max(0.1, Math.cos((lat * Math.PI) / 180));
    for (const [a, b] of [[dl, 0], [-dl, 0], [0, d], [0, -d], [dl, d], [-dl, d], [dl, -d], [-dl, -d]]) {
      if (countriesOf(lon + a, lat + b).includes(country)) return true;
    }
    return false;
  };
}

/** The land check on the committed outlines. */
export function makeOnLand(root: string): OnLand {
  const read = (cc: CountryCode) =>
    JSON.parse(readFileSync(join(root, 'data', 'imported', 'naturalearth', `${cc}.json`), 'utf8')) as { polygons: Outline; border: string[][] };
  return makeOnLandFrom(makeCountriesOf({ ca: read('ca'), us: read('us') }));
}

/** Keeps the stations on land in their country; counts the rest into dropped.no_location. */
export function dropOffLand<T extends { lat: number; lon: number }>(
  stations: readonly T[],
  country: CountryCode,
  onLand: OnLand,
  dropped: { no_location: number },
): T[] {
  const kept = stations.filter((s) => onLand(country, s.lon, s.lat));
  dropped.no_location += stations.length - kept.length;
  return kept;
}
