// B79 (DESIGN-8 B2): the border crossings of a trip as itinerary rows: how far along the route each
// one is, the country entered, and the nearest listed town on the far side (when one is close).

import type { CountryCode } from './country.ts';
import type { Crossing } from './ors.ts';
import type { Route } from './route-geo.ts';
import type { PlaceSearch } from './place-search.ts';

export interface BorderRow { alongKm: number; to: CountryCode; place: string | null; /** Where the route crosses, [lon, lat] (B89: the row flies there). */ at: [number, number] }

export function borderRows(crossings: readonly Crossing[] | undefined, route: Route, places: Pick<PlaceSearch, 'placeNear'> | null): BorderRow[] {
  return (crossings ?? [])
    .filter((c) => c.i >= 0 && c.i < route.coords.length)
    .map((c) => {
      const [lon, lat] = route.coords[c.i];
      return { alongKm: route.cumKm[c.i], to: c.to, place: places ? places.placeNear(lat, lon, c.to) : null, at: [lon, lat] as [number, number] };
    })
    .sort((a, b) => a.alongKm - b.alongKm);
}

/** The rows that fall on leg `leg` (0: start → stop 1; k: stop k → stop k + 1 or the destination). */
export function rowsOnLeg(rows: readonly BorderRow[], stopKms: readonly number[], leg: number): BorderRow[] {
  const from = leg === 0 ? -Infinity : stopKms[leg - 1];
  const to = leg < stopKms.length ? stopKms[leg] : Infinity;
  return rows.filter((r) => r.alongKm >= from && r.alongKm < to);
}
