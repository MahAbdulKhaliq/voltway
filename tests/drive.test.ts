// Drive mode (B72, 5.5–5.6): map-app links, whole-trip limits, reached stops, next target,
// distance and arrival, and the tab-only record.
import { describe, expect, it } from 'vitest';
import { directionsUrls, WHOLE_TRIP_MAX, wholeTripUrls } from '../src/lib/nav-links.ts';
import { buildRoute, type LonLat } from '../src/lib/route-geo.ts';
import { nextTarget, readDrive, tickReached, toTarget, writeDrive } from '../src/lib/drive.ts';
import type { TripPlan } from '../src/lib/trip-plan.ts';

describe('map-app links', () => {
  it('next stop: coordinates only, 5 decimals, driving, Google navigates', () => {
    const u = directionsUrls([-79.3832123, 43.6532456]);
    expect(u.google).toBe('https://www.google.com/maps/dir/?api=1&destination=43.65325,-79.38321&travelmode=driving&dir_action=navigate');
    expect(u.apple).toBe('https://maps.apple.com/directions?destination=43.65325,-79.38321&mode=driving');
  });
  it('Apple carries the avoid choices; Google has no such option', () => {
    const u = directionsUrls([-75.7, 45.42], { avoidTolls: true, avoidHighways: true, crossBorder: false });
    expect(u.apple).toBe('https://maps.apple.com/directions?destination=45.42,-75.7&mode=driving&avoid=tolls,highways');
    expect(u.google).not.toContain('avoid');
    expect(directionsUrls([-75.7, 45.42], { avoidTolls: false, avoidHighways: true, crossBorder: false }).apple).toMatch(/&avoid=highways$/);
  });
  it('whole trip: waypoints in plan order, end as destination, no origin, no dir_action on Google', () => {
    const stops: [number, number][] = [[-77, 44], [-76, 44.5], [-75, 45]];
    const u = wholeTripUrls(stops, [-73.5, 45.5], { avoidTolls: true, avoidHighways: false, crossBorder: false });
    expect(u.google).toBe('https://www.google.com/maps/dir/?api=1&destination=45.5,-73.5&waypoints=44,-77%7C44.5,-76%7C45,-75&travelmode=driving');
    expect(u.apple).toBe('https://maps.apple.com/directions?destination=45.5,-73.5&waypoint=44,-77&waypoint=44.5,-76&waypoint=45,-75&mode=driving&avoid=tolls');
    expect(u.google).not.toContain('origin');
    expect(u.google).not.toContain('dir_action');
  });
  it('whole trip with no stops left is a plain destination link', () => {
    const u = wholeTripUrls([], [-73.5, 45.5]);
    expect(u.google).toBe('https://www.google.com/maps/dir/?api=1&destination=45.5,-73.5&travelmode=driving');
    expect(u.apple).toBe('https://maps.apple.com/directions?destination=45.5,-73.5&mode=driving');
  });
  it('limits: Google up to 3 stops, Apple up to 9', () => {
    expect(WHOLE_TRIP_MAX).toEqual({ google: 3, apple: 9 });
    const n = (k: number) => Array.from({ length: k }, (_, i) => [-80 + i, 45] as [number, number]);
    expect(wholeTripUrls(n(3), [-70, 45]).google).not.toBeNull();
    expect(wholeTripUrls(n(4), [-70, 45]).google).toBeNull();
    expect(wholeTripUrls(n(4), [-70, 45]).apple).not.toBeNull();
    expect(wholeTripUrls(n(9), [-70, 45]).apple).not.toBeNull();
    expect(wholeTripUrls(n(10), [-70, 45])).toEqual({ google: null, apple: null });
  });
  it('a 9-stop Apple link stays under 2,048 characters', () => {
    const stops = Array.from({ length: 9 }, () => [-123.12345, 49.12345] as [number, number]);
    expect(wholeTripUrls(stops, [-63.12345, 44.12345]).apple!.length).toBeLessThan(2048);
  });
});

// A straight 300 km route east along 45° N; stops at 100 and 200 km.
const KM_PER_DEG = (Math.PI / 180) * 6371.0088 * Math.cos((45 * Math.PI) / 180);
const lonAt = (km: number) => -80 + km / KM_PER_DEG;
const route = buildRoute(Array.from({ length: 301 }, (_, i) => [lonAt(i), 45] as LonLat));
const stopAt = (km: number) => ({ lonLat: [lonAt(km), 45 + 0.3 / 110.574] as [number, number], alongKm: km });
const plan = {
  stops: [stopAt(100), stopAt(200)],
  legs: [
    { fromKm: 0, toKm: 100, distanceKm: 100, driveMin: 60, departSoc: 90, arriveSoc: 30 },
    { fromKm: 100, toKm: 200, distanceKm: 100, driveMin: 75, departSoc: 80, arriveSoc: 20 },
    { fromKm: 200, toKm: 300, distanceKm: 100, driveMin: 60, departSoc: 80, arriveSoc: 30 },
  ],
} as unknown as TripPlan;
const end: [number, number] = [lonAt(300), 45];
const fixAt = (km: number, northKm = 0) => ({ lon: lonAt(km), lat: 45 + northKm / 110.574 });

describe('reached stops', () => {
  it('ticks a stop within 1 km of it', () => {
    expect(tickReached(plan, route, [], fixAt(100.5))).toEqual([true, false]);
  });
  it('ticks a stop 2 km past it along the route, while on the route', () => {
    expect(tickReached(plan, route, [], fixAt(101.5))).toEqual([false, false]); // 1.5 km away, not 2 km past
    expect(tickReached(plan, route, [], fixAt(98))).toEqual([false, false]);
    expect(tickReached(plan, route, [], fixAt(102.5))).toEqual([true, false]);
  });
  it('a later stop ticks the earlier ones', () => {
    expect(tickReached(plan, route, [], fixAt(203))).toEqual([true, true]);
  });
  it('ignores a fix far off the route', () => {
    expect(tickReached(plan, route, [], fixAt(150, 20))).toEqual([false, false]);
  });
  it('never un-ticks by itself', () => {
    expect(tickReached(plan, route, [true, false], fixAt(10))).toEqual([true, false]);
  });
});

describe('next target and arrival', () => {
  it('is the first stop not reached, then the end', () => {
    expect(nextTarget(plan, route, end, [])).toMatchObject({ kind: 'stop', index: 0, leg: 0 });
    expect(nextTarget(plan, route, end, [true])).toMatchObject({ kind: 'stop', index: 1, leg: 1 });
    expect(nextTarget(plan, route, end, [true, true])).toMatchObject({ kind: 'end', index: -1, leg: 2 });
  });
  it('without a fix: the planned leg, from now', () => {
    const now = new Date('2026-11-17T12:00:00Z');
    const r = toTarget(plan, route, nextTarget(plan, route, end, [true]), null, now);
    expect(r).toMatchObject({ distanceKm: 100, fromFix: false });
    expect(r.arrive.toISOString()).toBe('2026-11-17T13:15:00.000Z');
  });
  it('with a fix on the route: what is left of the leg, at the leg speed', () => {
    const now = new Date('2026-11-17T12:00:00Z');
    const r = toTarget(plan, route, nextTarget(plan, route, end, [true]), fixAt(160), now);
    expect(r.fromFix).toBe(true);
    expect(r.distanceKm).toBeCloseTo(40, 0);
    expect(r.arrive.getTime() - now.getTime()).toBeCloseTo(30 * 60_000, -4);
  });
  it('a fix off the route falls back to the planned leg', () => {
    const r = toTarget(plan, route, nextTarget(plan, route, end, []), fixAt(50, 30), new Date());
    expect(r).toMatchObject({ distanceKm: 100, fromFix: false });
  });
});

describe('tab-only record', () => {
  const trip = { from: { label: 'Toronto, ON', lat: 43.65, lon: -79.38 }, to: { label: 'Montréal, QC', lat: 45.5, lon: -73.57 }, startSoc: 90, thresholdSoc: 15 };
  it('round-trips the trip and progress', () => {
    expect(readDrive(writeDrive({ trip, reached: [true, false] }))).toEqual({ trip, reached: [true, false] });
  });
  it('rejects missing, damaged or end-less records', () => {
    expect(readDrive(null)).toBeNull();
    expect(readDrive('{nope')).toBeNull();
    expect(readDrive('{"link":3}')).toBeNull();
    expect(readDrive(JSON.stringify({ link: 'from=43.65,-79.38,Toronto&start=90&min=15', reached: [] }))).toBeNull();
  });
  it('reads anything odd in the progress as not reached', () => {
    const raw = JSON.stringify({ link: writeDrive({ trip, reached: [] }) && JSON.parse(writeDrive({ trip, reached: [] })).link, reached: [true, 'yes', 1] });
    expect(readDrive(raw)?.reached).toEqual([true, false, false]);
  });
});
