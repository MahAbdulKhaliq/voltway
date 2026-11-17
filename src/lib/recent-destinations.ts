// Previous destinations (owner, B62): the last few places a trip was planned TO, kept only in this
// browser. Where a trip started is never saved. Newest first, no repeats, at most RECENT_MAX.

import { readEnd, writeEnd } from './trip-link.ts';
import type { TripEnd } from './place-search.ts';

export const RECENT_MAX = 5;

/** Two ends are the same place when they share a label and sit within ~100 m. */
const same = (a: TripEnd, b: TripEnd) =>
  a.label === b.label && Math.abs(a.lat - b.lat) < 0.001 && Math.abs(a.lon - b.lon) < 0.001;

/** The stored list, checked; anything odd is dropped. */
export function readRecent(saved: unknown): TripEnd[] {
  if (!Array.isArray(saved)) return [];
  const out: TripEnd[] = [];
  for (const x of saved) {
    if (!x || typeof x !== 'object') continue;
    const e = x as Record<string, unknown>;
    if (typeof e.label !== 'string' || typeof e.lat !== 'number' || typeof e.lon !== 'number') continue;
    const end = readEnd(writeEnd(e as unknown as TripEnd));
    if (end && !out.some((o) => same(o, end))) out.push(end);
  }
  return out.slice(0, RECENT_MAX);
}

/** The list with `to` added at the top. */
export const addRecent = (list: TripEnd[], to: TripEnd): TripEnd[] =>
  [to, ...list.filter((e) => !same(e, to))].slice(0, RECENT_MAX);
