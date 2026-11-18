// Drive mode's progress (B72, DESIGN-5 §1.3–1.4): which stops are reached, what comes next, how far
// it is and when the car gets there. Location is used only while the page is open; nothing about
// the position is stored. The trip and its progress are kept for the open tab only (sessionStorage,
// an owner-approved exception to B62) so a phone that reloads the page after the maps app comes back
// to Drive.

import { haversineKm, project, type Route } from './route-geo.ts';
import type { TripPlan } from './trip-plan.ts';
import { readTripLink, writeTripLink, type TripQuery } from './trip-link.ts';

/** A stop is reached within this distance of it… */
export const REACHED_NEAR_KM = 1;
/** …or once the car is this far past it along the route… */
export const REACHED_PAST_KM = 2;
/** …while within this distance of the route (a fix further away tells us nothing). */
export const ON_ROUTE_KM = 5;

export interface Fix { lon: number; lat: number }

/**
 * Ticks the stops a fix shows as reached. Reaching a stop ticks every stop before it, and nothing
 * is ever un-ticked here (only the visitor's "Not reached yet" does that).
 */
export function tickReached(plan: Pick<TripPlan, 'stops'>, route: Route, reached: readonly boolean[], fix: Fix): boolean[] {
  const out = plan.stops.map((_, i) => reached[i] === true);
  const p = project(route, [fix.lon, fix.lat], ON_ROUTE_KM);
  let last = -1;
  plan.stops.forEach((s, i) => {
    const near = haversineKm([fix.lon, fix.lat], s.lonLat) <= REACHED_NEAR_KM;
    const past = p !== null && p.alongKm >= s.alongKm + REACHED_PAST_KM;
    if (near || past) last = i;
  });
  for (let i = 0; i <= last; i++) out[i] = true;
  return out;
}

export type DriveTarget =
  | { kind: 'stop'; index: number; lonLat: [number, number]; alongKm: number; leg: number }
  | { kind: 'end'; index: -1; lonLat: [number, number]; alongKm: number; leg: number };

/** The first stop not yet reached, or the trip's end. `leg` is the plan leg that arrives there. */
export function nextTarget(plan: Pick<TripPlan, 'stops' | 'legs'>, route: Route, end: [number, number], reached: readonly boolean[]): DriveTarget {
  const i = plan.stops.findIndex((_, k) => !reached[k]);
  if (i === -1) return { kind: 'end', index: -1, lonLat: end, alongKm: route.totalKm, leg: plan.legs.length - 1 };
  const s = plan.stops[i];
  return { kind: 'stop', index: i, lonLat: s.lonLat, alongKm: s.alongKm, leg: i };
}

/**
 * Distance to the target and the expected arrival. With a fix on the route, from where the car is
 * (the leg's own speed); otherwise the whole planned leg, from now.
 */
export function toTarget(plan: Pick<TripPlan, 'legs'>, route: Route, target: DriveTarget, fix: Fix | null, now: Date): { distanceKm: number; arrive: Date; fromFix: boolean } {
  const leg = plan.legs[target.leg];
  const minPerKm = leg && leg.distanceKm > 0 ? leg.driveMin / leg.distanceKm : 0;
  const p = fix ? project(route, [fix.lon, fix.lat], ON_ROUTE_KM) : null;
  const distanceKm = p ? Math.max(0, target.alongKm - p.alongKm) : leg?.distanceKm ?? 0;
  return { distanceKm, arrive: new Date(now.getTime() + distanceKm * minPerKm * 60_000), fromFix: p !== null };
}

// The tab-only record.

export const DRIVE_KEY = 'voltway.drive';

export interface DriveRecord { trip: TripQuery; reached: boolean[] }

/** Parses a stored record; null when it is missing or damaged, or the trip has no ends. */
export function readDrive(raw: string | null): DriveRecord | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as { link?: unknown; reached?: unknown };
    if (typeof o.link !== 'string') return null;
    const trip = readTripLink(o.link.startsWith('?') ? o.link : `?${o.link}`);
    if (!trip?.from || !trip.to) return null;
    const reached = Array.isArray(o.reached) ? o.reached.slice(0, 50).map((x) => x === true) : [];
    return { trip, reached };
  } catch {
    return null;
  }
}

export const writeDrive = (r: DriveRecord): string => JSON.stringify({ link: writeTripLink(r.trip), reached: r.reached });

function tabStore(): Storage | null {
  try { return globalThis.sessionStorage ?? null; } catch { return null; }
}
export function loadDrive(): DriveRecord | null {
  try { return readDrive(tabStore()?.getItem(DRIVE_KEY) ?? null); } catch { return null; }
}
export function saveDrive(r: DriveRecord): void {
  try { tabStore()?.setItem(DRIVE_KEY, writeDrive(r)); } catch { /* blocked: Drive just won't survive a reload */ }
}
export function clearDrive(): void {
  try { tabStore()?.removeItem(DRIVE_KEY); } catch { /* nothing to clear */ }
}
