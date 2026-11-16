// Route geometry for the trip planner (route-planner.md §4): distance along a route line, and which
// chargers sit near it. Pure and fast enough to project every Level 3 station in the browser.
// Coordinates are [lon, lat] or [lon, lat, elevation m], as GeoJSON and ORS give them.

export type LonLat = readonly [number, number] | readonly [number, number, number];

const R_KM = 6371.0088;
const RAD = Math.PI / 180;
/** Route segments are grouped into blocks with a bounding box, so far-away stations skip whole blocks. */
const BLOCK = 32;

export function haversineKm(a: LonLat, b: LonLat): number {
  const dLat = (b[1] - a[1]) * RAD;
  const dLon = (b[0] - a[0]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

interface Block { from: number; to: number; minLon: number; maxLon: number; minLat: number; maxLat: number }

export interface Route {
  coords: readonly LonLat[];
  /** Distance from the start to each point (km). */
  cumKm: number[];
  totalKm: number;
  blocks: Block[];
}

export function buildRoute(coords: readonly LonLat[]): Route {
  if (coords.length < 2) throw new Error('A route needs at least two points');
  const cumKm = [0];
  for (let i = 1; i < coords.length; i++) cumKm.push(cumKm[i - 1] + haversineKm(coords[i - 1], coords[i]));
  const blocks: Block[] = [];
  for (let s = 0; s < coords.length - 1; s += BLOCK) {
    const to = Math.min(s + BLOCK, coords.length - 1); // segments s..to-1 use points s..to
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (let i = s; i <= to; i++) {
      const [lon, lat] = coords[i];
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    blocks.push({ from: s, to, minLon, maxLon, minLat, maxLat });
  }
  return { coords, cumKm, totalKm: cumKm[cumKm.length - 1], blocks };
}

export interface Projection {
  /** Shortest distance from the point to the route (km). */
  offKm: number;
  /** Distance along the route to the nearest point on it (km), 0 … totalKm. */
  alongKm: number;
}

/** Degrees of latitude / longitude that `km` spans at `lat` (for widening boxes). */
function degSpan(km: number, lat: number): { dLat: number; dLon: number } {
  const dLat = km / 110.574;
  const dLon = km / (111.32 * Math.max(0.05, Math.cos(lat * RAD)));
  return { dLat, dLon };
}

/** Nearest point on one segment, in a flat local frame around the point (fine at these distances). */
function segment(route: Route, i: number, p: LonLat, kx: number, ky: number): Projection {
  const a = route.coords[i];
  const b = route.coords[i + 1];
  const ax = (a[0] - p[0]) * kx, ay = (a[1] - p[1]) * ky;
  const bx = (b[0] - p[0]) * kx, by = (b[1] - p[1]) * ky;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
  const x = ax + t * dx, y = ay + t * dy;
  return { offKm: Math.hypot(x, y), alongKm: route.cumKm[i] + t * (route.cumKm[i + 1] - route.cumKm[i]) };
}

/**
 * Projects a point onto the route. With `maxOffKm`, blocks further away than that are skipped and
 * null is returned when the route never comes that close.
 */
export function project(route: Route, p: LonLat, maxOffKm = Infinity): Projection | null {
  const kx = 111.32 * Math.cos(p[1] * RAD);
  const ky = 110.574;
  const { dLat, dLon } = Number.isFinite(maxOffKm) ? degSpan(maxOffKm, p[1]) : { dLat: Infinity, dLon: Infinity };
  let best: Projection | null = null;
  for (const b of route.blocks) {
    if (p[0] < b.minLon - dLon || p[0] > b.maxLon + dLon || p[1] < b.minLat - dLat || p[1] > b.maxLat + dLat) continue;
    for (let i = b.from; i < b.to; i++) {
      const s = segment(route, i, p, kx, ky);
      if (!best || s.offKm < best.offKm) best = s;
    }
  }
  return best && best.offKm <= maxOffKm ? best : null;
}

/** The route's bounding box widened by `km`. */
export function routeBox(route: Route, km: number): { minLon: number; maxLon: number; minLat: number; maxLat: number } {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const b of route.blocks) {
    minLon = Math.min(minLon, b.minLon); maxLon = Math.max(maxLon, b.maxLon);
    minLat = Math.min(minLat, b.minLat); maxLat = Math.max(maxLat, b.maxLat);
  }
  const { dLat, dLon } = degSpan(km, Math.max(Math.abs(minLat), Math.abs(maxLat)));
  return { minLon: minLon - dLon, maxLon: maxLon + dLon, minLat: minLat - dLat, maxLat: maxLat + dLat };
}

export interface NearPoint<T> { item: T; offKm: number; alongKm: number }

/** Every item within `maxOffKm` of the route, sorted by distance along it. */
export function nearRoute<T>(route: Route, items: readonly T[], at: (item: T) => LonLat, maxOffKm: number): NearPoint<T>[] {
  const box = routeBox(route, maxOffKm);
  const out: NearPoint<T>[] = [];
  for (const item of items) {
    const p = at(item);
    if (p[0] < box.minLon || p[0] > box.maxLon || p[1] < box.minLat || p[1] > box.maxLat) continue;
    const pr = project(route, p, maxOffKm);
    if (pr) out.push({ item, ...pr });
  }
  return out.sort((a, b) => a.alongKm - b.alongKm);
}

/** Index of the last route point at or before `km` along the route (binary search). */
export function pointIndexAt(route: Route, km: number): number {
  let lo = 0, hi = route.cumKm.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (route.cumKm[mid] <= km) lo = mid; else hi = mid - 1;
  }
  return lo;
}
