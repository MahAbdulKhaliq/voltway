// "Stations in view" (charger-map.md §5, B34, DESIGN-map.md M12): a keyboard and screen-reader
// way into the stations, since pins are drawn on a canvas. Pure, so it is unit-tested: the
// stations matching the filters inside the view, nearest the map centre first, capped.

import type { ChargerLevel } from './power-bands.ts';
import { matchLevel, portMatches, type CarPlugRule, type MapFilters } from './map-filter.ts';
import type { MapFeature } from './map-data.ts';
import { haversineKm } from './route-geo.ts';

export const LIST_CAP = 50;

/** West, south, east, north in degrees (the map's visible bounds). */
export type Bounds = readonly [number, number, number, number];

export interface ListItem {
  i: number;
  name: string;
  city?: string;
  level: ChargerLevel;
  /** Highest rated kW among the matching ports at that level, or null when none is known. */
  maxKw: number | null;
  at: [number, number];
}

export function inBounds([lon, lat]: readonly [number, number], [w, s, e, n]: Bounds): boolean {
  // A view crossing the antimeridian has west > east; Canada never needs it, but it costs nothing.
  const inLon = w <= e ? lon >= w && lon <= e : lon >= w || lon <= e;
  return inLon && lat >= s && lat <= n;
}

/** Squared distance in "degrees of latitude", with longitude shrunk by cos(latitude): fine for sorting. */
function dist2([lon, lat]: readonly [number, number], [clon, clat]: readonly [number, number]): number {
  const k = Math.cos((clat * Math.PI) / 180);
  const dx = (lon - clon) * k;
  const dy = lat - clat;
  return dx * dx + dy * dy;
}

export function stationsInView(
  features: readonly MapFeature[],
  f: MapFilters,
  bounds: Bounds,
  center: readonly [number, number],
  cap = LIST_CAP,
  car?: CarPlugRule | null,
): { items: ListItem[]; total: number } {
  const hits: { item: ListItem; d: number }[] = [];
  for (const feat of features) {
    const at = feat.geometry.coordinates;
    if (!inBounds(at, bounds)) continue;
    const ports = feat.properties.p;
    const level = matchLevel(ports, f, car, feat.properties.nw);
    if (!level) continue;
    let maxKw: number | null = null;
    for (const p of ports) {
      const kw = p[2];
      if (p[0] !== level || !portMatches(p, f, car, feat.properties.nw) || kw == null || !Number.isFinite(kw) || kw <= 0) continue;
      if (maxKw == null || kw > maxKw) maxKw = kw;
    }
    const item: ListItem = { i: feat.properties.i, name: feat.properties.n, level, maxKw, at };
    if (feat.properties.c) item.city = feat.properties.c;
    hits.push({ item, d: dist2(at, center) });
  }
  hits.sort((a, b) => a.d - b.d || a.item.i - b.item.i);
  return { items: hits.slice(0, cap).map((h) => h.item), total: hits.length };
}

/** "N fast chargers within 25 km" for the "Where to?" place card (B50, 3.17): stations with a Level 3
 *  port matching the current filters (power, plugs, my car), whatever the Level 3 checkbox says. */
export const NEAR_PLACE_KM = 25;
export function fastNear(
  features: readonly MapFeature[],
  f: MapFilters,
  at: readonly [number, number],
  km = NEAR_PLACE_KM,
  car?: CarPlugRule | null,
): number {
  const l3: MapFilters = { ...f, levels: { ...f.levels, 3: true, 2: false } };
  let n = 0;
  for (const feat of features) {
    if (haversineKm(feat.geometry.coordinates as [number, number], at as [number, number]) > km) continue;
    if (matchLevel(feat.properties.p, l3, car, feat.properties.nw) === 3) n++;
  }
  return n;
}
