// B79 (DESIGN-8 B1): cross-border trips: the `border=cross` option, the border rule with it,
// the ORS body, and the crossings found along a route on the real Canada and US outlines.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { makeCountriesOf, type Outline } from '../src/lib/country.ts';
import { borderProblem, findCrossings, handleRoute, parseBorder, routeBody, type CountriesOf } from '../src/lib/ors.ts';

const read = (cc: string) => JSON.parse(readFileSync(join(process.cwd(), 'data', 'imported', 'naturalearth', `${cc}.json`), 'utf8')) as { polygons: Outline; border: string[][] };
const countriesOf = makeCountriesOf({ ca: read('ca'), us: read('us') });

const P = {
  toronto: [-79.38, 43.65], london: [-81.25, 42.98], detroit: [-83.18, 42.32] /* Dearborn: downtown is inside the border slack */, buffalo: [-78.88, 42.89],
  vancouver: [-123.12, 49.28], princeGeorge: [-122.75, 53.92], watsonLake: [-128.7, 60.06], seattle: [-122.33, 47.61], whitehorse: [-135.05, 60.72],
  anchorage: [-149.9, 61.22], ottawa: [-75.7, 45.42], mexicoCity: [-99.13, 19.43], pacific: [-140, 40],
} as const;

/** A synthetic route through the given points, one point every ~0.2 km (like thinLine). */
function line(...pts: (readonly [number, number])[]): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let s = 0; s < pts.length - 1; s++) {
    const [a, b] = [pts[s], pts[s + 1]];
    const km = Math.hypot((b[0] - a[0]) * 111 * Math.cos((a[1] * Math.PI) / 180), (b[1] - a[1]) * 111);
    const n = Math.max(1, Math.round(km / 0.2));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n, 0]);
  }
  const last = pts[pts.length - 1];
  out.push([last[0], last[1], 0]);
  return out;
}

describe('parseBorder (B79)', () => {
  it.each([[null, false], ['', false], ['cross', true], [' cross ', true], ['open', null], ['all', null]] as const)('%s → %s', (raw, want) => {
    expect(parseBorder(raw)).toBe(want);
  });
});

describe('routeBody (B79)', () => {
  it('drops avoid_borders with cross, keeps the avoid options', () => {
    expect(routeBody([0, 0], [1, 1], []).options).toEqual({ avoid_borders: 'all' });
    expect(routeBody([0, 0], [1, 1], [], true).options).toEqual({});
    expect(routeBody([0, 0], [1, 1], ['tolls'], true).options).toEqual({ avoid_features: ['tollways'] });
  });
});

describe('borderProblem with cross (B79)', () => {
  it.each([
    ['Toronto → Buffalo', 'toronto', 'buffalo', null],
    ['Seattle → Anchorage (through Canada)', 'seattle', 'anchorage', null],
    ['Toronto → Ottawa', 'toronto', 'ottawa', null],
    ['Toronto → Mexico City', 'toronto', 'mexicoCity', { error: 'outsideArea' }],
    ['Mexico City → Toronto', 'mexicoCity', 'toronto', { error: 'outsideArea' }],
    ['Seattle → the Pacific', 'seattle', 'pacific', { error: 'outsideArea' }],
  ] as const)('%s', (_, a, b, want) => {
    expect(borderProblem(P[a], P[b], countriesOf, true)).toEqual(want);
  });
  it('without cross the B78 rule is unchanged', () => {
    expect(borderProblem(P.toronto, P.buffalo, countriesOf)).toEqual({ error: 'crossBorder', country: 'ca' });
  });
});

describe('findCrossings on the real outlines (B79)', () => {
  it('London ON → Detroit: one crossing into the US, near the Detroit River', () => {
    const coords = line(P.london, P.detroit);
    const { crossings, countries } = findCrossings(coords, countriesOf);
    expect(countries).toEqual(['ca', 'us']);
    expect(crossings).toHaveLength(1);
    expect(crossings[0].to).toBe('us');
    const [lon] = coords[crossings[0].i];
    expect(lon).toBeLessThan(-82.4); // at the Detroit River / Lake St. Clair, not mid-Ontario
    expect(countriesOf(coords[crossings[0].i][0], coords[crossings[0].i][1])).toEqual(['us']);
    expect(countriesOf(coords[crossings[0].i - 1][0], coords[crossings[0].i - 1][1])).not.toEqual(['us']);
  });
  it('Seattle → Vancouver → Prince George → Watson Lake → Whitehorse → Anchorage: into Canada, then into the US', () => {
    const { crossings, countries } = findCrossings(line(P.seattle, P.vancouver, P.princeGeorge, P.watsonLake, P.whitehorse, P.anchorage), countriesOf);
    expect(crossings.map((c) => c.to)).toEqual(['ca', 'us']);
    expect(crossings[0].i).toBeLessThan(crossings[1].i);
    expect(countries).toEqual(['ca', 'us']);
  });
  it('Toronto → Ottawa: no crossing, Canada only', () => {
    const r = findCrossings(line(P.toronto, P.ottawa), countriesOf);
    expect(r).toEqual({ crossings: [], countries: ['ca'] });
  });
  it('a road along the 49th parallel (inside the border slack): no crossing', () => {
    const r = findCrossings(line([-110, 49.0005], [-100, 49.0005]), countriesOf);
    expect(r.crossings).toEqual([]);
  });
  it('a 4,000 km route is checked quickly', () => {
    const coords = line(P.anchorage, P.whitehorse, P.watsonLake, P.princeGeorge, P.vancouver, P.seattle, [-104.99, 39.74], [-87.63, 41.88]);
    const t = performance.now();
    findCrossings(coords, countriesOf);
    expect(performance.now() - t).toBeLessThan(1000); // ~6,000 km; about 0.4 s locally
  });
});

describe('handleRoute with border=cross (B79)', () => {
  const orsRoute = { features: [{ geometry: { coordinates: line(P.london, P.detroit) }, properties: { summary: { distance: 190000, duration: 7200 } } }] };
  const reply = () => vi.fn(async () => new Response(JSON.stringify(orsRoute), { status: 200 }));
  const url = (q: string) => new URL(`https://x.test/api/route?from=${P.london.join(',')}&to=${P.detroit.join(',')}${q}`);
  it('a bad border value → 400 without calling ORS', async () => {
    const f = reply();
    expect((await handleRoute(url('&border=open'), 'k', f, countriesOf)).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it('without border=cross a cross-border trip is still refused (B78)', async () => {
    const f = reply();
    const r = await handleRoute(url(''), 'k', f, countriesOf);
    expect(r.status).toBe(422);
    expect(f).not.toHaveBeenCalled();
  });
  it('with border=cross: asks ORS without avoid_borders, returns the crossing and both countries', async () => {
    const f = reply();
    const r = await handleRoute(url('&border=cross'), 'k', f, countriesOf);
    expect(r.status).toBe(200);
    const sent = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent.options).toEqual({});
    const b = await r.json();
    expect(b.countries).toEqual(['ca', 'us']);
    expect(b.crossings).toHaveLength(1);
    expect(b.crossings[0].to).toBe('us');
  });
  it('with border=cross on a one-country route: no crossings, one country (stops stay in it)', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ features: [{ geometry: { coordinates: line(P.toronto, P.ottawa) }, properties: { summary: { distance: 450000, duration: 16000 } } }] }), { status: 200 }));
    const r = await handleRoute(new URL(`https://x.test/api/route?from=${P.toronto.join(',')}&to=${P.ottawa.join(',')}&border=cross`), 'k', f, countriesOf as CountriesOf);
    const b = await r.json();
    expect(b.crossings).toEqual([]);
    expect(b.countries).toEqual(['ca']);
  });
});
