// Route options from Settings (B73): avoid tolls, avoid highways, and (B79) Stay within the border.
// Kept in the browser like the other settings and sent to /api/route as `avoid=tolls,highways` and
// `border=cross` (checked again there). Stay within the border is off by default (B80): trips may
// cross unless a visitor turns it on, which stores `crossBorder: false`. A change is announced with a "voltway:routeOptions" event.

import type { AvoidOption } from './ors.ts';
import { getJSON, setJSON, KEYS } from './storage.ts';

export const ROUTE_OPTIONS_EVENT = 'voltway:routeOptions';

export interface RouteOptions {
  avoidTolls: boolean;
  avoidHighways: boolean;
  /** B79: Stay within the border is off, so trips may cross between Canada and the US. */
  crossBorder: boolean;
}
/** The defaults: no roads avoided, trips may cross the border (B80). */
export const NO_AVOID: RouteOptions = { avoidTolls: false, avoidHighways: false, crossBorder: true };

/** Anything but `true` reads as off for the avoid switches, so a damaged entry never avoids roads by
 *  surprise; only an explicit `crossBorder: false` keeps trips within the border (B80 default). */
export function readRouteOptions(saved: unknown): RouteOptions {
  const o = (saved && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  return { avoidTolls: o.avoidTolls === true, avoidHighways: o.avoidHighways === true, crossBorder: o.crossBorder !== false };
}

/** True when two option sets ask for different routes. */
export const sameRouteOptions = (a: RouteOptions, b: RouteOptions): boolean =>
  a.avoidTolls === b.avoidTolls && a.avoidHighways === b.avoidHighways && a.crossBorder === b.crossBorder;

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

/** `&avoid=tolls,highways` and `&border=cross` (B79), or '' for the defaults. */
export const avoidQuery = (o: RouteOptions): string => {
  const l = avoidList(o);
  return (l.length ? `&avoid=${l.join(',')}` : '') + (o.crossBorder ? '&border=cross' : '');
};
