// Route options from Settings (B73): avoid tolls, avoid highways. Kept in the browser like the
// other settings and sent to /api/route as `avoid=tolls,highways` (checked again there). "Stay in
// Canada" (B74) is always on and not stored. A change is announced with a "voltway:routeOptions" event.

import type { AvoidOption } from './ors.ts';
import { getJSON, setJSON, KEYS } from './storage.ts';

export const ROUTE_OPTIONS_EVENT = 'voltway:routeOptions';

export interface RouteOptions { avoidTolls: boolean; avoidHighways: boolean }
export const NO_AVOID: RouteOptions = { avoidTolls: false, avoidHighways: false };

/** Anything but `true` reads as off, so a damaged entry never avoids roads by surprise. */
export function readRouteOptions(saved: unknown): RouteOptions {
  const o = (saved && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  return { avoidTolls: o.avoidTolls === true, avoidHighways: o.avoidHighways === true };
}

export const routeOptions = (): RouteOptions => readRouteOptions(getJSON<unknown>(KEYS.routeOptions, null));

export function setRouteOptions(next: RouteOptions): void {
  const clean = readRouteOptions(next);
  setJSON(KEYS.routeOptions, clean);
  window.dispatchEvent(new CustomEvent(ROUTE_OPTIONS_EVENT, { detail: clean }));
}

/** The options as the API's `avoid` list, in its one order (so the CDN cache key is stable). */
export function avoidList(o: RouteOptions): AvoidOption[] {
  const out: AvoidOption[] = [];
  if (o.avoidTolls) out.push('tolls');
  if (o.avoidHighways) out.push('highways');
  return out;
}

/** `&avoid=tolls,highways`, or '' when nothing is avoided. */
export const avoidQuery = (o: RouteOptions): string => {
  const l = avoidList(o);
  return l.length ? `&avoid=${l.join(',')}` : '';
};
