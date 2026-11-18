import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { makeCountriesOf, type Outline } from '../src/lib/country.ts';
import { borderStatus } from '../src/components/useTrip.ts';
import { borderProblem, CACHE_OK, handleGeocode, handleRoute, parseAvoid, parseLonLat, thinLine, trimPlaces, trimRoute, type CountriesOf } from '../src/lib/ors.ts';

const KEY = 'test-key-123';
const routeUrl = (from: string, to: string) => new URL(`https://x.test/api/route?from=${from}&to=${to}`);
const orsRoute = {
  features: [{
    geometry: { coordinates: [[-79.38321, 43.65321, 76.4], [-79.0, 43.8, 120], [-73.56741, 45.50191, 30]] },
    properties: { summary: { distance: 550_000, duration: 21_060 }, ascent: 812.4, descent: 860.2 },
  }],
};
const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('parseLonLat', () => {
  it('accepts lon,lat inside the area and rounds to 3 decimals', () => {
    expect(parseLonLat('-79.38321,43.65321')).toEqual([-79.383, 43.653]);
  });
  it('accepts US points, Alaska to Hawaii and Guam (B78)', () => {
    for (const ok of ['-118.24,34.05', '-149.9,61.22', '-157.86,21.31', '-66.1,18.47', '144.75,13.47']) expect(parseLonLat(ok)).not.toBeNull();
  });
  it('rejects missing, malformed and out-of-area input', () => {
    for (const bad of [null, '', '-79.3', '-79.3,abc', '1,2,3', ',43', '2.35,48.85', '-79.3,95']) expect(parseLonLat(bad)).toBeNull();
  });
});

describe('trimming', () => {
  it('keeps coordinates with elevation, distance in km, duration in min, ascent/descent', () => {
    const r = trimRoute(orsRoute)!;
    expect(r.distanceKm).toBe(550);
    expect(r.durationMin).toBe(351);
    expect(r.ascentM).toBe(812);
    expect(r.coords[0]).toEqual([-79.38321, 43.65321, 76]);
    expect(r.coords.at(-1)).toEqual([-73.56741, 45.50191, 30]);
  });
  it('returns null without a route', () => {
    expect(trimRoute({ features: [] })).toBeNull();
    expect(trimRoute(null)).toBeNull();
  });
  it('thins points closer than 200 m, always keeping the last', () => {
    const line = Array.from({ length: 101 }, (_, i) => [-79 + i * 0.0001, 43.6, 100]); // ~8 m apart
    const out = thinLine(line);
    expect(out.length).toBeLessThan(10);
    expect(out.at(-1)![0]).toBeCloseTo(-78.99, 5);
  });
  it('places: label and position, at most 5', () => {
    const feats = Array.from({ length: 7 }, (_, i) => ({ geometry: { coordinates: [-79 - i, 43] }, properties: { label: `P${i}` } }));
    const p = trimPlaces({ features: [...feats, { properties: {} }] });
    expect(p).toHaveLength(5);
    expect(p[0]).toEqual({ label: 'P0', lon: -79, lat: 43 });
  });
});

describe('handleRoute', () => {
  it('400 on bad input, without calling ORS', async () => {
    const f = reply(200, orsRoute);
    const r = await handleRoute(routeUrl('abc', '-73.5,45.5'), KEY, f);
    expect(r.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
    expect(r.headers.get('Cache-Control')).toBe('no-store');
  });

  it('503 notConfigured with no key', async () => {
    const r = await handleRoute(routeUrl('-79.38,43.65', '-73.57,45.5'), undefined, reply(200, orsRoute));
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ error: 'notConfigured' });
  });

  it('asks ORS for a driving route with elevation and returns the trimmed, cacheable body', async () => {
    const f = reply(200, orsRoute);
    const r = await handleRoute(routeUrl('-79.38321,43.65321', '-73.5674,45.5019'), KEY, f);
    expect(r.status).toBe(200);
    expect(r.headers.get('Cache-Control')).toBe(CACHE_OK);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/v2/directions/driving-car/geojson');
    expect(JSON.parse(init.body as string)).toEqual({ coordinates: [[-79.383, 43.653], [-73.567, 45.502]], elevation: true, instructions: false, options: { avoid_borders: 'all' } });
    const text = await r.text();
    expect(text).not.toContain(KEY);
    expect(JSON.parse(text).distanceKm).toBe(550);
  });

  it.each([403, 429, 500, 502])('ORS %i → 503 busy', async (status) => {
    const r = await handleRoute(routeUrl('-79.38,43.65', '-73.57,45.5'), KEY, reply(status, { error: 'quota' }));
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ error: 'busy' });
  });

  it('a timeout or network error → 503 busy', async () => {
    const r = await handleRoute(routeUrl('-79.38,43.65', '-73.57,45.5'), KEY, vi.fn(async () => { throw new DOMException('timeout', 'TimeoutError'); }));
    expect(r.status).toBe(503);
  });

  it('no road near a point (ORS 2010) → 422 noRoute', async () => {
    const r = await handleRoute(routeUrl('-60,45', '-73.57,45.5'), KEY, reply(404, { error: { code: 2010, message: 'Could not find routable point' } }));
    expect(r.status).toBe(422);
    expect(await r.json()).toEqual({ error: 'noRoute' });
  });
});

describe('handleGeocode', () => {
  const geoUrl = (q: string) => new URL(`https://x.test/api/geocode?q=${encodeURIComponent(q)}`);

  it('400 on a too-short query, without calling ORS', async () => {
    const f = reply(200, {});
    expect((await handleGeocode(geoUrl(' a '), KEY, f)).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it('searches Canada and the US (B78), 5 results, cacheable, with each result\'s country', async () => {
    const f = reply(200, { features: [{ geometry: { coordinates: [-79.38, 43.65] }, properties: { label: '100 Queen St W, Toronto, ON, Canada', country_a: 'CAN' } }] });
    const r = await handleGeocode(geoUrl('100 Queen St W Toronto'), KEY, f);
    expect(r.status).toBe(200);
    expect(r.headers.get('Cache-Control')).toBe(CACHE_OK);
    const called = new URL(String((f.mock.calls[0] as unknown[])[0]));
    expect(called.pathname).toBe('/pelias/v1/search');
    expect(called.searchParams.get('boundary.country')).toBe('CA,US');
    expect(called.searchParams.get('size')).toBe('5');
    expect(called.searchParams.has('focus.point.lat')).toBe(false);
    expect(await r.json()).toEqual({ places: [{ label: '100 Queen St W, Toronto, ON, Canada', lon: -79.38, lat: 43.65, cc: 'ca' }] });
  });

  it.each([['us', 'US'], ['ca', 'CA'], ['fr', 'CA,US']])('country=%s (the trip start\'s) → boundary.country %s', async (cc, want) => {
    const f = reply(200, { features: [] });
    await handleGeocode(new URL(`https://x.test/api/geocode?q=Main%20St&country=${cc}`), KEY, f);
    expect(new URL(String((f.mock.calls[0] as unknown[])[0])).searchParams.get('boundary.country')).toBe(want);
  });

  it('ORS over its allowance → 503 busy', async () => {
    expect((await handleGeocode(geoUrl('Toronto'), KEY, reply(403, {}))).status).toBe(503);
  });
});

describe('route options (B73) and Canada only (B74)', () => {
  const url = (q: string) => new URL(`https://x.test/api/route?from=-79.38,43.65&to=-73.57,45.5${q}`);
  const body = (f: ReturnType<typeof reply>) => JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);

  it('parses avoid: empty, one, both in a fixed order', () => {
    expect(parseAvoid(null)).toEqual([]);
    expect(parseAvoid('')).toEqual([]);
    expect(parseAvoid('tolls')).toEqual(['tolls']);
    expect(parseAvoid('highways')).toEqual(['highways']);
    expect(parseAvoid('highways,tolls')).toEqual(['tolls', 'highways']);
  });
  it('rejects unknown and repeated avoid values', () => {
    for (const bad of ['ferries', 'tolls,tolls', 'tolls,', 'Tolls', 'tollways']) expect(parseAvoid(bad)).toBeNull();
  });
  it.each(['&avoid=ferries', '&avoid=tolls,tolls'])('%s → 400 without calling ORS', async (q) => {
    const f = reply(200, orsRoute);
    const r = await handleRoute(url(q), KEY, f);
    expect(r.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it('always avoids borders, and sends avoid_features per option', async () => {
    let f = reply(200, orsRoute);
    await handleRoute(url(''), KEY, f);
    expect(body(f).options).toEqual({ avoid_borders: 'all' });
    f = reply(200, orsRoute);
    await handleRoute(url('&avoid=highways,tolls'), KEY, f);
    expect(body(f).options).toEqual({ avoid_borders: 'all', avoid_features: ['tollways', 'highways'] });
    f = reply(200, orsRoute);
    await handleRoute(url('&avoid=highways'), KEY, f);
    expect(body(f).options.avoid_features).toEqual(['highways']);
  });
  // B78: the url() trip runs from lon -79.4 to lon -73.6; these fake checks place each end.
  it.each([
    ['a start in neither country', (lon: number) => (lon < -75 ? [] : ['ca']), { error: 'outsideArea' }],
    ['a Canadian start, a US end', (lon: number) => (lon < -75 ? ['ca'] : ['us']), { error: 'crossBorder', country: 'ca' }],
    ['a US start, an end in neither', (lon: number) => (lon < -75 ? ['us'] : []), { error: 'crossBorder', country: 'us' }],
    ['a start on the border, an end in neither', (lon: number) => (lon < -75 ? ['ca', 'us'] : []), { error: 'crossBorder', country: null }],
  ] as const)('%s → 422, no ORS call, not cached', async (_, countriesOf, want) => {
    const f = reply(200, orsRoute);
    const r = await handleRoute(url(''), KEY, f, countriesOf as CountriesOf);
    expect(r.status).toBe(422);
    expect(await r.json()).toEqual(want);
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(f).not.toHaveBeenCalled();
  });
  it('both ends in one country (or a border start whose end shares a country) → asks ORS', async () => {
    const f = reply(200, orsRoute);
    const r = await handleRoute(url(''), KEY, f, (lon) => (lon < -75 ? ['ca', 'us'] : ['ca']));
    expect(r.status).toBe(200);
    expect(f).toHaveBeenCalledOnce();
    // The countries both ends share go back with the route; the planner keeps its stops to them (QA S1).
    expect((await r.json()).countries).toEqual(['ca']);
  });
});

// B78 (DESIGN-7 D4): the border rule on the real Canada and US outlines.
describe('borderProblem with the real outlines (B78)', () => {
  const read = (cc: string) => JSON.parse(readFileSync(join(process.cwd(), 'data', 'imported', 'naturalearth', `${cc}.json`), 'utf8')) as { polygons: Outline; border: string[][] };
  const countriesOf = makeCountriesOf({ ca: read('ca'), us: read('us') });
  const P = {
    toronto: [-79.38, 43.65], vancouver: [-123.12, 49.28], whitehorse: [-135.05, 60.72],
    dearborn: [-83.18, 42.32], chicago: [-87.63, 41.88], seattle: [-122.33, 47.61],
    anchorage: [-149.9, 61.22], fairbanks: [-147.72, 64.84], honolulu: [-157.86, 21.31],
    stanstead: [-72.097, 45.009], paris: [2.35, 48.85], mexicoCity: [-99.13, 19.43],
  } as const;
  it.each([
    ['Toronto → Vancouver', 'toronto', 'vancouver', null],
    ['Chicago → Seattle', 'chicago', 'seattle', null],
    ['Anchorage → Fairbanks', 'anchorage', 'fairbanks', null],
    ['Stanstead (on the line) → Toronto', 'stanstead', 'toronto', null],
    ['Stanstead (on the line) → Chicago', 'stanstead', 'chicago', null],
    ['Toronto → Dearborn', 'toronto', 'dearborn', { error: 'crossBorder', country: 'ca' }],
    ['Dearborn → Toronto', 'dearborn', 'toronto', { error: 'crossBorder', country: 'us' }],
    ['Toronto → Mexico City', 'toronto', 'mexicoCity', { error: 'crossBorder', country: 'ca' }],
    ['Seattle → Anchorage (Lower 48 ↔ Alaska)', 'seattle', 'anchorage', { error: 'crossBorder', country: 'us', reason: 'alaska' }],
    ['Fairbanks → Chicago (Alaska ↔ Lower 48)', 'fairbanks', 'chicago', { error: 'crossBorder', country: 'us', reason: 'alaska' }],
    ['Whitehorse → Anchorage', 'whitehorse', 'anchorage', { error: 'crossBorder', country: 'ca' }],
    ['Mexico City → Chicago', 'mexicoCity', 'chicago', { error: 'outsideArea' }],
    ['Paris → Toronto', 'paris', 'toronto', { error: 'outsideArea' }],
  ] as const)('%s', (_, a, b, want) => {
    expect(borderProblem(P[a], P[b], countriesOf)).toEqual(want);
  });
  it('Honolulu → Honolulu-area trip stays in the US (islands are not Alaska)', () => {
    expect(borderProblem(P.honolulu, [-158.0, 21.4], countriesOf)).toBeNull();
  });
});

describe('borderStatus (useTrip, B78)', () => {
  it.each([
    [{ error: 'outsideArea' }, 'outsideArea'],
    [{ error: 'crossBorder', country: 'ca' }, 'crossBorderCa'],
    [{ error: 'crossBorder', country: 'us' }, 'crossBorderUs'],
    [{ error: 'crossBorder', country: null }, 'crossBorderAny'],
    [{ error: 'crossBorder', country: 'us', reason: 'alaska' }, 'crossBorderAlaska'],
    [{ error: 'noRoute' }, null],
    [null, null],
  ] as const)('%j → %s', (body, want) => {
    expect(borderStatus(body)).toBe(want);
  });
});
