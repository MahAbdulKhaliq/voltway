// openrouteservice client for the trip planner's server endpoints (route-planner.md §2, §6; S7, B44).
// The endpoints in src/pages/api/ pass in the key and fetch; everything here is plain and testable.
// Nothing here logs addresses or coordinates (§2: "doesn't log addresses").

export const ORS_BASE = 'https://api.heigit.org';
const DIRECTIONS = `${ORS_BASE}/openrouteservice/v2/directions/driving-car/geojson`;
const GEOCODE = `${ORS_BASE}/pelias/v1/search`;
const TIMEOUT_MS = 20_000;

/** Canada plus a margin for border crossings and US detours (lon, lat). */
export const AREA = { minLon: -142, maxLon: -50, minLat: 40, maxLat: 84 } as const;

/** CDN caching (§2): the same city pair and the same search are asked for again; routes change slowly. */
export const CACHE_OK = 'public, max-age=0, s-maxage=604800, stale-while-revalidate=86400';
const NO_STORE = 'no-store';

export type ApiError = 'badRequest' | 'busy' | 'noRoute' | 'notConfigured';

/** Parses "lon,lat", checks it is a number pair inside the area, and rounds to 3 decimals (~100 m) so near-identical requests share a cache entry. */
export function parseLonLat(raw: string | null): [number, number] | null {
  if (!raw) return null;
  const parts = raw.split(',');
  if (parts.length !== 2) return null;
  const [lon, lat] = parts.map((p) => (p.trim() === '' ? NaN : Number(p)));
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lon < AREA.minLon || lon > AREA.maxLon || lat < AREA.minLat || lat > AREA.maxLat) return null;
  const r = (x: number) => Math.round(x * 1000) / 1000;
  return [r(lon), r(lat)];
}

/** What /api/route returns: the route line with elevation, plus totals. */
export interface RouteBody {
  /** [lon, lat, elevation m] */
  coords: [number, number, number][];
  distanceKm: number;
  durationMin: number;
  ascentM: number;
  descentM: number;
}

export interface Place { label: string; lon: number; lat: number }

const R_KM = 6371.0088;
const RAD = Math.PI / 180;
const km = (a: number[], b: number[]) => {
  const h = Math.sin(((b[1] - a[1]) * RAD) / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(((b[0] - a[0]) * RAD) / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Keeps a point every `stepKm` (plus the last), with 5-decimal positions and whole-metre elevation. Smaller body, and less elevation noise. */
export function thinLine(coords: readonly number[][], stepKm = 0.2): [number, number, number][] {
  const out: [number, number, number][] = [];
  const keep = (p: number[]) => out.push([Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5, Math.round(p[2] ?? 0)]);
  let last: number[] | null = null;
  coords.forEach((p, i) => {
    if (!last || i === coords.length - 1 || km(last, p) >= stepKm) { keep(p); last = p; }
  });
  return out;
}

/** Picks the parts of an ORS GeoJSON directions response the site needs. null when it has no route. */
export function trimRoute(json: unknown): RouteBody | null {
  const f = (json as { features?: { geometry?: { coordinates?: number[][] }; properties?: { summary?: { distance?: number; duration?: number }; ascent?: number; descent?: number } }[] })?.features?.[0];
  const coords = f?.geometry?.coordinates;
  const s = f?.properties?.summary;
  if (!coords || coords.length < 2 || typeof s?.distance !== 'number' || typeof s?.duration !== 'number') return null;
  return {
    coords: thinLine(coords),
    distanceKm: s.distance / 1000,
    durationMin: s.duration / 60,
    ascentM: Math.round(f?.properties?.ascent ?? 0),
    descentM: Math.round(f?.properties?.descent ?? 0),
  };
}

/** Picks label + position from an ORS (Pelias) geocoding response. */
export function trimPlaces(json: unknown): Place[] {
  const feats = (json as { features?: { geometry?: { coordinates?: number[] }; properties?: { label?: string } }[] })?.features ?? [];
  return feats
    .filter((f) => typeof f.properties?.label === 'string' && Array.isArray(f.geometry?.coordinates))
    .slice(0, 5)
    .map((f) => ({ label: f.properties!.label!, lon: f.geometry!.coordinates![0], lat: f.geometry!.coordinates![1] }));
}

const json = (body: unknown, status: number, cache: string) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache } });
export const errorResponse = (error: ApiError, status: number) => json({ error }, status, NO_STORE);

/** ORS failures: over the daily (403) or per-minute (429) allowance, server trouble or a timeout → "busy" (S7). */
const orsFailure = (): Response => errorResponse('busy', 503);

type Fetch = typeof fetch;

/** GET /api/route?from=lon,lat&to=lon,lat */
export async function handleRoute(url: URL, key: string | undefined, fetchFn: Fetch = fetch): Promise<Response> {
  const from = parseLonLat(url.searchParams.get('from'));
  const to = parseLonLat(url.searchParams.get('to'));
  if (!from || !to) return errorResponse('badRequest', 400);
  if (!key) return errorResponse('notConfigured', 503);
  let res: Response;
  try {
    res = await fetchFn(DIRECTIONS, {
      method: 'POST',
      headers: { Authorization: key, 'Content-Type': 'application/json', Accept: 'application/geo+json, application/json' },
      body: JSON.stringify({ coordinates: [from, to], elevation: true, instructions: false }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return orsFailure();
  }
  if (res.status === 404 || res.status === 400) {
    // 2010: no road near a point; 2004: route too long; 2009: no route between the points.
    const body = (await res.json().catch(() => null)) as { error?: { code?: number } } | null;
    const code = body?.error?.code;
    if (code === 2010 || code === 2004 || code === 2009 || res.status === 404) return errorResponse('noRoute', 422);
    return errorResponse('badRequest', 400);
  }
  if (!res.ok) return orsFailure();
  const route = trimRoute(await res.json().catch(() => null));
  return route ? json(route, 200, CACHE_OK) : errorResponse('noRoute', 422);
}

/** GET /api/geocode?q=… (only when the visitor presses Search, §6) */
export async function handleGeocode(url: URL, key: string | undefined, fetchFn: Fetch = fetch): Promise<Response> {
  const q = (url.searchParams.get('q') ?? '').trim().replace(/\s+/g, ' ');
  if (q.length < 3 || q.length > 200) return errorResponse('badRequest', 400);
  if (!key) return errorResponse('notConfigured', 503);
  const target = new URL(GEOCODE);
  target.searchParams.set('text', q);
  target.searchParams.set('boundary.country', 'CA');
  target.searchParams.set('size', '5');
  let res: Response;
  try {
    res = await fetchFn(target, { headers: { Authorization: key, Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    return orsFailure();
  }
  if (res.status === 400) return errorResponse('badRequest', 400);
  if (!res.ok) return orsFailure();
  return json({ places: trimPlaces(await res.json().catch(() => null)) }, 200, CACHE_OK);
}
