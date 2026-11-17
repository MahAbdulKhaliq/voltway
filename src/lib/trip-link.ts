// Trip settings in a link and in browser storage (route-planner.md §7 "Saving and sharing").
// The last trip is saved in the browser; the share link is opt-in because it holds the places.
// Link format: /trip?from=<lat>,<lon>,<label>&to=<lat>,<lon>,<label>&start=<%>&min=<%>
// (positions first, so "Plan a trip to here" can pass a station as to=<lat>,<lon>,<name>).

import { TRIP } from '../config.ts';
import type { TripEnd } from './place-search.ts';

export interface TripQuery {
  from: TripEnd | null;
  to: TripEnd | null;
  startSoc: number;
  thresholdSoc: number;
}

export const SOC_LIMITS = { startMin: 20, startMax: 100, thresholdMin: 5, thresholdMax: 40 } as const;

const round = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

/** "43.65,-79.38,Toronto, ON" → an end; null when it is malformed or far outside Canada. */
export function readEnd(raw: string | null | undefined): TripEnd | null {
  if (!raw) return null;
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:,(.*))?$/s.exec(raw);
  if (!m) return null;
  const lat = Number(m[1]), lon = Number(m[2]);
  if (!(lat >= 40 && lat <= 84 && lon >= -142 && lon <= -50)) return null;
  const label = (m[3] ?? '').trim().slice(0, 120) || `${round(lat, 4)}, ${round(lon, 4)}`;
  return { label, lat, lon };
}

export const writeEnd = (e: TripEnd): string => `${round(e.lat, 5)},${round(e.lon, 5)},${e.label}`;

const pct = (raw: unknown, min: number, max: number, fallback: number) => {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : fallback;
};

/** Start must stay above the threshold; otherwise both fall back to the defaults. */
function socPair(start: unknown, min: unknown): { startSoc: number; thresholdSoc: number } {
  const startSoc = pct(start, SOC_LIMITS.startMin, SOC_LIMITS.startMax, TRIP.defaultStartSoc);
  const thresholdSoc = pct(min, SOC_LIMITS.thresholdMin, SOC_LIMITS.thresholdMax, TRIP.defaultThresholdSoc);
  return startSoc > thresholdSoc ? { startSoc, thresholdSoc } : { startSoc: TRIP.defaultStartSoc, thresholdSoc: TRIP.defaultThresholdSoc };
}

/** Reads a trip from a page's query string. null when the link holds no trip at all. */
export function readTripLink(search: string): TripQuery | null {
  const q = new URLSearchParams(search);
  if (!q.has('from') && !q.has('to')) return null;
  return { from: readEnd(q.get('from')), to: readEnd(q.get('to')), ...socPair(q.get('start'), q.get('min')) };
}

/** The share link's query string (without "?"). */
export function writeTripLink(t: TripQuery): string {
  const q = new URLSearchParams();
  if (t.from) q.set('from', writeEnd(t.from));
  if (t.to) q.set('to', writeEnd(t.to));
  q.set('start', String(t.startSoc));
  q.set('min', String(t.thresholdSoc));
  return q.toString();
}

/** A saved last trip, checked; anything odd counts as none. */
export function readSavedTrip(saved: unknown): TripQuery | null {
  if (!saved || typeof saved !== 'object') return null;
  const s = saved as Record<string, unknown>;
  const end = (x: unknown) => {
    if (!x || typeof x !== 'object') return null;
    const e = x as Record<string, unknown>;
    return typeof e.label === 'string' && typeof e.lat === 'number' && typeof e.lon === 'number' ? readEnd(writeEnd(e as unknown as TripEnd)) : null;
  };
  const from = end(s.from), to = end(s.to);
  if (!from && !to) return null;
  return { from, to, ...socPair(s.startSoc, s.thresholdSoc) };
}

/** The API's "lon,lat" form, rounded to 3 decimals (~100 m) as the function does, so the CDN cache key is shared. */
export const apiPoint = (e: TripEnd): string => `${round(e.lon, 3)},${round(e.lat, 3)}`;

/** The charging window in a "See the charging curve for this stop" link (?from=&to=, whole %); null when absent or odd. */
export function linkWindowFrom(params: URLSearchParams): { start: number; end: number } | null {
  if (!params.has('from') || !params.has('to')) return null;
  const start = Number(params.get('from')), end = Number(params.get('to'));
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const s = Math.round(start), e = Math.round(end);
  return s >= 0 && e <= 100 && s < e ? { start: s, end: e } : null;
}

/** "Plan a trip to here" from a charger (3.13): To = the station, labelled with its name and city. */
export function tripToHref(station: { geometry: { coordinates: [number, number] }; properties: { n: string; c?: string } }): string {
  const [lon, lat] = station.geometry.coordinates;
  const { n, c } = station.properties;
  const label = c && !n.includes(c) ? `${n}, ${c}` : n;
  return `/trip?${new URLSearchParams({ to: writeEnd({ label, lat, lon }) }).toString()}`;
}
