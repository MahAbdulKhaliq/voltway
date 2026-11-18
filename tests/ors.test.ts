import { describe, expect, it, vi } from 'vitest';
import { CACHE_OK, handleGeocode, handleRoute, parseAvoid, parseLonLat, thinLine, trimPlaces, trimRoute } from '../src/lib/ors.ts';

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

  it('searches Canada only, 5 results, cacheable', async () => {
    const f = reply(200, { features: [{ geometry: { coordinates: [-79.38, 43.65] }, properties: { label: '100 Queen St W, Toronto, ON, Canada' } }] });
    const r = await handleGeocode(geoUrl('100 Queen St W Toronto'), KEY, f);
    expect(r.status).toBe(200);
    expect(r.headers.get('Cache-Control')).toBe(CACHE_OK);
    const called = new URL(String((f.mock.calls[0] as unknown[])[0]));
    expect(called.pathname).toBe('/pelias/v1/search');
    expect(called.searchParams.get('boundary.country')).toBe('CA');
    expect(called.searchParams.get('size')).toBe('5');
    expect(await r.json()).toEqual({ places: [{ label: '100 Queen St W, Toronto, ON, Canada', lon: -79.38, lat: 43.65 }] });
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
  it.each([
    ['from', (lon: number) => lon > -75],
    ['to', (lon: number) => lon < -75],
    ['both', () => false],
  ] as const)('an end outside Canada (%s) → 422 outsideCanada, no ORS call, not cached', async (end, inCanada) => {
    const f = reply(200, orsRoute);
    const r = await handleRoute(url(''), KEY, f, inCanada);
    expect(r.status).toBe(422);
    expect(await r.json()).toEqual({ error: 'outsideCanada', end });
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(f).not.toHaveBeenCalled();
  });
  it('both ends in Canada → asks ORS', async () => {
    const f = reply(200, orsRoute);
    const r = await handleRoute(url(''), KEY, f, () => true);
    expect(r.status).toBe(200);
    expect(f).toHaveBeenCalledOnce();
  });
});
