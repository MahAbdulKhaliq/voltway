import { describe, expect, it } from 'vitest';
import { buildRoute, haversineKm, nearRoute, pointIndexAt, project, type LonLat } from '../src/lib/route-geo.ts';

const TORONTO: LonLat = [-79.3832, 43.6532];
const MONTREAL: LonLat = [-73.5674, 45.5019];

/** A straight east-west route along 45° N, from 76° W to 75° W, in `n` points. */
const line = (n = 11) => buildRoute(Array.from({ length: n }, (_, i) => [-76 + i / (n - 1), 45] as LonLat));

describe('haversineKm and buildRoute', () => {
  it('Toronto → Montréal is about 504 km in a straight line', () => {
    expect(Math.abs(haversineKm(TORONTO, MONTREAL) - 504) / 504).toBeLessThan(0.005);
  });

  it('adds up distance along the route', () => {
    const r = line();
    expect(r.cumKm[0]).toBe(0);
    expect(r.totalKm).toBeCloseTo(haversineKm([-76, 45], [-75, 45]), 1);
    expect(r.cumKm).toEqual([...r.cumKm].sort((a, b) => a - b));
  });

  it('keeps elevation in the coordinates', () => {
    const r = buildRoute([[-76, 45, 100], [-75, 45, 300]]);
    expect(r.coords[1][2]).toBe(300);
  });

  it('needs two points', () => {
    expect(() => buildRoute([[-76, 45]])).toThrow();
  });
});

describe('project', () => {
  const r = line();

  it('beside the route: distance off and along', () => {
    const p = project(r, [-75.5, 45.01])!;
    expect(p.offKm).toBeCloseTo(1.11, 1);
    expect(p.alongKm).toBeCloseTo(r.totalKm / 2, 0);
  });

  it('before the start: along is 0, off is the distance to the start', () => {
    const p = project(r, [-76.1, 45])!;
    expect(p.alongKm).toBe(0);
    expect(p.offKm).toBeCloseTo(haversineKm([-76.1, 45], [-76, 45]), 1);
  });

  it('past the end: along is the whole route', () => {
    const p = project(r, [-74.9, 45])!;
    expect(p.alongKm).toBeCloseTo(r.totalKm, 6);
  });

  it('with a limit, far points return null', () => {
    expect(project(r, [-75.5, 45.2], 2)).toBeNull();
    expect(project(r, [-75.5, 45.01], 2)).not.toBeNull();
  });
});

describe('nearRoute', () => {
  it('keeps points within the distance, sorted along the route', () => {
    const r = line();
    const pts: LonLat[] = [[-75.2, 45.005], [-75.8, 44.99], [-75.5, 45.5], [-80, 45]];
    const near = nearRoute(r, pts, (p) => p, 2);
    expect(near.map((n) => n.item)).toEqual([pts[1], pts[0]]);
    expect(near[0].alongKm).toBeLessThan(near[1].alongKm);
  });

  it('projects 3,000 stations onto a 4,000-point route quickly', () => {
    // A wiggly route from Windsor to Québec City, and stations scattered over southern Canada.
    const n = 4000;
    const coords: LonLat[] = Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      return [-83 + 12 * t, 42.3 + 4.5 * t + 0.05 * Math.sin(i / 7)] as LonLat;
    });
    const route = buildRoute(coords);
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const stations: LonLat[] = Array.from({ length: 3000 }, () => [-125 + 72 * rand(), 42 + 14 * rand()] as LonLat);
    const t0 = performance.now();
    const near = nearRoute(route, stations, (p) => p, 10);
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(200);
    // Spot-check the fast path against a brute-force projection.
    for (const s of stations.slice(0, 300)) {
      const full = project(route, s)!;
      const hit = near.find((x) => x.item === s);
      expect(Boolean(hit)).toBe(full.offKm <= 10);
    }
  });
});

describe('pointIndexAt', () => {
  it('finds the last point at or before a distance', () => {
    const r = line();
    expect(pointIndexAt(r, 0)).toBe(0);
    expect(pointIndexAt(r, r.cumKm[3] + 0.1)).toBe(3);
    expect(pointIndexAt(r, r.totalKm + 5)).toBe(10);
  });
});
