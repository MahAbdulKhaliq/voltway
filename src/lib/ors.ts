// openrouteservice client for the trip planner's server endpoints (route-planner.md §2, §6; S7, B44).
// The endpoints in src/pages/api/ pass in the key and fetch; everything here is plain and testable.
// Nothing here logs addresses or coordinates (§2: "doesn't log addresses").

import { inServiceArea, usPart, type CountryCode } from './country.ts';

export const ORS_BASE = 'https://api.heigit.org';
const DIRECTIONS = `${ORS_BASE}/openrouteservice/v2/directions/driving-car/geojson`;
const GEOCODE = `${ORS_BASE}/pelias/v1/search`;
/** Lists the house numbers ORS knows on a street (a plain search only returns the street). */
const AUTOCOMPLETE = `${ORS_BASE}/pelias/v1/autocomplete`;
const TIMEOUT_MS = 20_000;



/** CDN caching (§2): the same city pair and the same search are asked for again; routes change slowly. */
export const CACHE_OK = 'public, max-age=0, s-maxage=604800, stale-while-revalidate=86400';
const NO_STORE = 'no-store';

export type ApiError = 'badRequest' | 'busy' | 'noRoute' | 'notConfigured' | 'outsideArea' | 'crossBorder';

/** Route options from Settings (B73), in the one order the URL uses (stable CDN cache keys). */
export const AVOID_OPTIONS = ['tolls', 'highways'] as const;
export type AvoidOption = (typeof AVOID_OPTIONS)[number];
const ORS_FEATURE: Record<AvoidOption, string> = { tolls: 'tollways', highways: 'highways' };

/** Parses `avoid=tolls,highways`: missing or empty → []; an unknown or repeated value → null (400). */
export function parseAvoid(raw: string | null): AvoidOption[] | null {
  if (raw === null || raw.trim() === '') return [];
  const parts = raw.split(',').map((p) => p.trim());
  if (parts.some((p) => !(AVOID_OPTIONS as readonly string[]).includes(p))) return null;
  if (new Set(parts).size !== parts.length) return null;
  return AVOID_OPTIONS.filter((o) => parts.includes(o));
}

/**
 * Parses `border=cross` (B79, DESIGN-8 B1): missing or empty → false (Stay within the border, the
 * default); `cross` → true; anything else → null (400).
 */
export function parseBorder(raw: string | null): boolean | null {
  if (raw === null || raw.trim() === '') return false;
  return raw.trim() === 'cross' ? true : null;
}

/** Every country a point may be in (src/lib/country.ts makeCountriesOf): none, one, or both on the border. */
export type CountriesOf = (lon: number, lat: number) => CountryCode[];

/**
 * Why a trip can't be planned under the border rule (B74, B78; DESIGN-7 D4), or null when it can:
 * the start is in neither country (`outsideArea`); the destination isn't in the start's country
 * (`crossBorder`, with that country when there is just one); or the trip joins Alaska and the Lower 48,
 * whose only roads pass through Canada (`crossBorder`, reason `alaska`).
 * With `cross` (B79: Stay within the border off), only an end in neither country stops the trip.
 */
export function borderProblem(from: readonly [number, number], to: readonly [number, number], countriesOf: CountriesOf, cross = false):
  | { error: 'outsideArea' }
  | { error: 'crossBorder'; country: CountryCode | null; reason?: 'alaska' }
  | null {
  const start = countriesOf(from[0], from[1]);
  if (start.length === 0) return { error: 'outsideArea' };
  const end = countriesOf(to[0], to[1]);
  // A destination in neither country: crossBorder with no country reads "Pick a destination in one of them" (QA 2026-11-18).
  if (cross) return end.length === 0 ? { error: 'crossBorder', country: null } : null;
  const shared = start.filter((c) => end.includes(c));
  if (shared.length === 0) return { error: 'crossBorder', country: start.length === 1 ? start[0] : null };
  if (shared.length === 1 && shared[0] === 'us') {
    const a = usPart(from[0], from[1]), b = usPart(to[0], to[1]);
    if ((a === 'alaska' && b === 'lower48') || (a === 'lower48' && b === 'alaska')) return { error: 'crossBorder', country: 'us', reason: 'alaska' };
  }
  return null;
}

/** Parses "lon,lat", checks it is a number pair inside the area, and rounds to 3 decimals (~100 m) so near-identical requests share a cache entry. */
export function parseLonLat(raw: string | null): [number, number] | null {
  if (!raw) return null;
  const parts = raw.split(',');
  if (parts.length !== 2) return null;
  const [lon, lat] = parts.map((p) => (p.trim() === '' ? NaN : Number(p)));
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (!inServiceArea(lon, lat)) return null;
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
  /**
   * B78: the countries both ends are in (usually one); the planner keeps its stops to them.
   * B79: with `border=cross`, the countries the route passes through.
   */
  countries?: CountryCode[];
  /** B79: where the route enters another country (index into `coords`); only with `border=cross`. */
  crossings?: Crossing[];
}

/** A border crossing: the route enters country `to` at `coords[i]` (B79, DESIGN-8 B1). */
export interface Crossing { i: number; to: CountryCode }

/** Route points checked for their country: every SAMPLE-th (~2 km apart), then each point between two samples that differ. A visit to the other country shorter than that can be missed; that is rare on a trip route. */
const SAMPLE = 10;

/**
 * The border crossings along a route line, and the countries it passes through (B79, DESIGN-8 B1).
 * Only points in exactly one country count: points within the border slack (in both) and points in
 * neither are skipped, so a road along the border doesn't flap. With no such points at all, `countries`
 * is empty and the caller falls back to the ends.
 */
export function findCrossings(coords: readonly (readonly number[])[], countriesOf: CountriesOf): { crossings: Crossing[]; countries: CountryCode[] } {
  const one = (i: number): CountryCode | null => {
    const c = countriesOf(coords[i][0], coords[i][1]);
    return c.length === 1 ? c[0] : null;
  };
  const crossings: Crossing[] = [];
  const seen = new Set<CountryCode>();
  if (coords.length === 0) return { crossings, countries: [] };
  let last: CountryCode | null = null;
  let lastAt = -1;
  const visit = (i: number, c: CountryCode) => {
    seen.add(c);
    if (last && c !== last) {
      // Find the first point of the new country after the last point of the old one.
      let at = i;
      for (let j = lastAt + 1; j < i; j++) {
        const cj = one(j);
        if (cj === c) { at = j; break; }
        if (cj === last) lastAt = j;
      }
      crossings.push({ i: at, to: c });
    }
    last = c;
    lastAt = i;
  };
  for (let i = 0; i < coords.length; i += SAMPLE) {
    const c = one(i);
    if (c) visit(i, c);
  }
  const end = coords.length - 1;
  if (end % SAMPLE !== 0) { const c = one(end); if (c) visit(end, c); }
  return { crossings, countries: (['ca', 'us'] as const).filter((c) => seen.has(c)) };
}

/** An address result; `cc` is its country when the service says (B78: lets the next search lean to it). */
export interface Place { label: string; lon: number; lat: number; cc?: CountryCode; estimated?: true }

const PELIAS_COUNTRY: Readonly<Record<string, CountryCode>> = { CAN: 'ca', USA: 'us' };

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
  const feats = (json as { features?: { geometry?: { coordinates?: number[] }; properties?: { label?: string; country_a?: string } }[] })?.features ?? [];
  return feats
    .filter((f) => typeof f.properties?.label === 'string' && Array.isArray(f.geometry?.coordinates))
    .slice(0, 5)
    .map((f) => {
      const cc = PELIAS_COUNTRY[f.properties!.country_a ?? ''];
      return { label: f.properties!.label!, lon: f.geometry!.coordinates![0], lat: f.geometry!.coordinates![1], ...(cc ? { cc } : {}) };
    });
}

const json = (body: unknown, status: number, cache: string) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache } });
export const errorResponse = (error: ApiError, status: number) => json({ error }, status, NO_STORE);

/** ORS failures: over the daily (403) or per-minute (429) allowance, server trouble or a timeout → "busy" (S7). */
const orsFailure = (): Response => errorResponse('busy', 503);

type Fetch = typeof fetch;

/** The ORS request body: no border crossings (B74) unless `cross` (B79), plus the avoid options (B73). */
export function routeBody(from: [number, number], to: [number, number], avoid: readonly AvoidOption[], cross = false) {
  return {
    coordinates: [from, to],
    elevation: true,
    instructions: false,
    options: { ...(cross ? {} : { avoid_borders: 'all' }), ...(avoid.length ? { avoid_features: avoid.map((a) => ORS_FEATURE[a]) } : {}) },
  };
}

/**
 * GET /api/route?from=lon,lat&to=lon,lat[&avoid=tolls,highways][&border=cross]
 * @param countriesOf the country check (src/lib/country.ts); a trip that breaks the border rule
 *   answers 422 outsideArea or crossBorder before any ORS call (B74, B78; borderProblem). With
 *   `border=cross` (B79) the answer also lists the crossings and the countries the route passes.
 */
export async function handleRoute(url: URL, key: string | undefined, fetchFn: Fetch = fetch, countriesOf?: CountriesOf): Promise<Response> {
  const from = parseLonLat(url.searchParams.get('from'));
  const to = parseLonLat(url.searchParams.get('to'));
  const avoid = parseAvoid(url.searchParams.get('avoid'));
  const cross = parseBorder(url.searchParams.get('border'));
  if (!from || !to || !avoid || cross === null) return errorResponse('badRequest', 400);
  let countries: CountryCode[] | undefined;
  if (countriesOf) {
    const problem = borderProblem(from, to, countriesOf, cross);
    if (problem) return json(problem, 422, NO_STORE);
    const start = countriesOf(from[0], from[1]);
    const end = countriesOf(to[0], to[1]);
    countries = cross ? [...new Set([...start, ...end])] : start.filter((c) => end.includes(c));
  }
  if (!key) return errorResponse('notConfigured', 503);
  let res: Response;
  try {
    res = await fetchFn(DIRECTIONS, {
      method: 'POST',
      headers: { Authorization: key, 'Content-Type': 'application/json', Accept: 'application/geo+json, application/json' },
      body: JSON.stringify(routeBody(from, to, avoid, cross)),
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
  if (!route) return errorResponse('noRoute', 422);
  if (cross && countriesOf) {
    // B79: where the route crosses, and the countries it passes (stops may be in any of them).
    const found = findCrossings(route.coords, countriesOf);
    return json({ ...route, countries: found.countries.length ? found.countries : countries, crossings: found.crossings }, 200, CACHE_OK);
  }
  return json(countries ? { ...route, countries } : route, 200, CACHE_OK);
}

/** GET /api/geocode?q=… (only when the visitor presses Search, §6) */
export async function handleGeocode(url: URL, key: string | undefined, fetchFn: Fetch = fetch): Promise<Response> {
  const q = (url.searchParams.get('q') ?? '').trim().replace(/\s+/g, ' ');
  if (q.length < 3 || q.length > 200) return errorResponse('badRequest', 400);
  if (!key) return errorResponse('notConfigured', 503);
  const target = new URL(GEOCODE);
  target.searchParams.set('text', q);
  // Canada and the US (B78, DESIGN-7 D5); with a trip start and Stay within the border on, only its
  // country (`country=ca|us`; B79: with it off the page sends no country). A focus point outweighed
  // the typed city in tests, so there is none.
  const country = url.searchParams.get('country');
  target.searchParams.set('boundary.country', country === 'ca' ? 'CA' : country === 'us' ? 'US' : 'CA,US');
  target.searchParams.set('size', '5');
  let res: Response;
  try {
    res = await fetchFn(target, { headers: { Authorization: key, Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    return orsFailure();
  }
  if (res.status === 400) return errorResponse('badRequest', 400);
  if (!res.ok) return orsFailure();
  const body = await res.json().catch(() => null);
  const places = trimPlaces(body);
  const boundary = target.searchParams.get('boundary.country')!;
  const guess = await estimateAddress(q, body, boundary, key, fetchFn);
  let found = guess ? [guess, ...places] : places;
  // No town typed ("184 Lynbrook Dr"): the best match may be a same-named street far away. With
  // `near` (the map's centre or the trip start, ~10 km), look for that street nearby too.
  const near = parseNear(url.searchParams.get('near'));
  if (near && !q.includes(',') && (!found.length || km([found[0].lon, found[0].lat], near) > NEAR_STREET_KM)) {
    // The street the far matches name ("Pike Street"): a nearby street of exactly that name wins over
    // a similar one ("East Pike Street").
    const feats = (body as { features?: PeliasFeature[] } | null)?.features ?? [];
    const name = feats.find((f) => f.properties?.street)?.properties?.street;
    const n = leadingNumber(q);
    const isClose = (f: PeliasFeature) => Array.isArray(f.geometry?.coordinates) && km(f.geometry!.coordinates!, near) <= NEAR_STREET_KM;
    const exactHere = (sameName: boolean) => feats.find((f) => f.properties?.layer === 'address' && isClose(f)
      && leadingNumber(f.properties.housenumber ?? '') === n && (!sameName || !name || f.properties.street === name));
    // 1. Already in the answer, same street name: move it up (no extra request).
    let close: Place | null = toPlace(exactHere(true));
    // 2. Otherwise look for the street nearby and find the number on it.
    close ??= await nearbyAddress(q, near, boundary, key, fetchFn, name);
    // 3. Otherwise a nearby match on a similar street from the answer.
    close ??= toPlace(exactHere(false));
    if (close) found = [close, ...found.filter((p) => p.label !== close.label)];
  }
  return json({ places: found.slice(0, 5) }, 200, CACHE_OK);
}

const toPlace = (f: PeliasFeature | undefined): Place | null => (f ? trimPlaces({ features: [f] })[0] ?? null : null);

/** A same-named street counts as "near" the visitor within this distance (km). */
export const NEAR_STREET_KM = 50;

/** `near=lon,lat` → a point rounded to 0.1° (~10 km: enough to rank streets, and few cache keys), or null. */
export function parseNear(raw: string | null): [number, number] | null {
  const p = parseLonLat(raw);
  return p ? [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10] : null;
}

/**
 * The typed street near `near`: search the street name (without the number) with a focus point, keep
 * the streets within NEAR_STREET_KM (one named exactly `name` first, then the closest), and find the
 * number on it (exact or estimated). Two extra requests at most, only when the best match was far away.
 */
async function nearbyAddress(q: string, near: [number, number], country: string, key: string, fetchFn: Fetch, name?: string): Promise<Place | null> {
  const n = leadingNumber(q);
  const street = q.replace(/^\s*\d{1,6}[a-z]?\b\s*/i, '');
  if (n === null || street.length < 3) return null;
  const find = new URL(GEOCODE);
  find.searchParams.set('text', street);
  find.searchParams.set('layers', 'street');
  find.searchParams.set('size', '10');
  find.searchParams.set('focus.point.lon', String(near[0]));
  find.searchParams.set('focus.point.lat', String(near[1]));
  find.searchParams.set('boundary.country', country);
  try {
    const res = await fetchFn(find, { headers: { Authorization: key, Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const feats = (((await res.json()) as { features?: PeliasFeature[] }).features ?? [])
      .filter((f) => f.properties?.layer === 'street' && f.properties.street && Array.isArray(f.geometry?.coordinates))
      .map((f) => ({ f, d: km(f.geometry!.coordinates!, near) }))
      .filter((x) => x.d <= NEAR_STREET_KM)
      .sort((a, b) => Number(b.f.properties!.street === name) - Number(a.f.properties!.street === name) || a.d - b.d);
    if (!feats.length) return null;
    return await estimateAddress(q, { features: [feats[0].f] }, country, key, fetchFn);
  } catch {
    return null;
  }
}

interface PeliasFeature {
  geometry?: { coordinates?: number[] };
  properties?: { layer?: string; label?: string; country_a?: string; housenumber?: string; street?: string; locality?: string; region_a?: string };
}

/** The house number a query starts with ("59 Paradise Rd S…" → 59; "59A …" → 59), or null. */
export function leadingNumber(q: string): number | null {
  const m = /^\s*(\d{1,6})(?:[a-z])?\b/i.exec(q);
  return m ? Number(m[1]) : null;
}

/**
 * The known house numbers just below and above `n` on one street ([number, lon, lat]), preferring
 * the same side of the street (same odd/even) when it has numbers on both sides; null unless `n` is
 * between two known numbers.
 */
export function bracket(n: number, known: readonly (readonly [number, number, number])[]): [readonly [number, number, number], readonly [number, number, number]] | null {
  const pick = (list: readonly (readonly [number, number, number])[]) => {
    let lo: (typeof list)[number] | null = null;
    let hi: (typeof list)[number] | null = null;
    for (const k of list) {
      if (k[0] < n && (!lo || k[0] > lo[0])) lo = k;
      if (k[0] > n && (!hi || k[0] < hi[0])) hi = k;
    }
    return lo && hi ? ([lo, hi] as [typeof lo, typeof hi]) : null;
  };
  return pick(known.filter((k) => k[0] % 2 === n % 2)) ?? pick(known);
}

/**
 * A house number ORS doesn't have: place it between the numbers ORS knows either side of it on the
 * same street ("59" between 41 and 81 → 45% of the way). The search may answer with the street
 * ("59 Paradise Rd S") or with nearby numbers on it ("59 Paradise Rd S, Hamilton"); either names the
 * street. Neighbours in that answer are used first; otherwise one extra request lists the numbers ORS
 * knows on the street. Any failure → null.
 */
async function estimateAddress(q: string, body: unknown, country: string, key: string, fetchFn: Fetch): Promise<Place | null> {
  const n = leadingNumber(q);
  if (n === null) return null;
  const feats = (body as { features?: PeliasFeature[] } | null)?.features ?? [];
  const isAddress = (f: PeliasFeature) => f.properties?.layer === 'address';
  if (feats.some((f) => isAddress(f) && leadingNumber(f.properties!.housenumber ?? '') === n)) return null;
  const anchor = feats.find((f) => (f.properties?.layer === 'street' || isAddress(f)) && f.properties?.street && f.properties?.label)?.properties;
  if (!anchor) return null;
  const onStreet = (f: PeliasFeature) => f.properties?.street === anchor.street && f.properties?.locality === anchor.locality && Array.isArray(f.geometry?.coordinates);
  const numbered = (list: PeliasFeature[]) => list
    .filter((f) => isAddress(f) && onStreet(f))
    .map((f) => [leadingNumber(f.properties!.housenumber ?? ''), f.geometry!.coordinates![0], f.geometry!.coordinates![1]] as const)
    .filter((k): k is readonly [number, number, number] => k[0] !== null);
  let pair = bracket(n, numbered(feats));
  let lastList: PeliasFeature[] | null = null;
  if (!pair) {
    const list = new URL(AUTOCOMPLETE);
    list.searchParams.set('text', [anchor.street, anchor.locality, anchor.region_a].filter(Boolean).join(', '));
    list.searchParams.set('layers', 'address');
    list.searchParams.set('size', '40');
    list.searchParams.set('boundary.country', country);
    try {
      const res = await fetchFn(list, { headers: { Authorization: key, Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) return null;
      const more = ((await res.json()) as { features?: PeliasFeature[] }).features ?? [];
      lastList = more;
      if (more.some((f) => isAddress(f) && onStreet(f) && leadingNumber(f.properties!.housenumber ?? '') === n)) pair = null;
      else pair = bracket(n, numbered([...feats, ...more]));
    } catch {
      return null;
    }
  }
  if (!pair) {
    const hit = (lastList ?? []).find((f) => isAddress(f) && onStreet(f) && leadingNumber(f.properties!.housenumber ?? '') === n);
    if (!hit) return null;
    const cc = PELIAS_COUNTRY[hit.properties!.country_a ?? anchor.country_a ?? ''];
    return { label: hit.properties!.label!, lon: hit.geometry!.coordinates![0], lat: hit.geometry!.coordinates![1], ...(cc ? { cc } : {}) };
  }
  const [lo, hi] = pair;
  const t = (n - lo[0]) / (hi[0] - lo[0]);
  const cc = PELIAS_COUNTRY[anchor.country_a ?? ''];
  // An address label starts with its number ("41 Paradise Road South, …"); a street label has none.
  const rest = anchor.layer === 'address' ? anchor.label!.replace(/^\S+\s+/, '') : anchor.label!;
  return {
    label: `${n} ${rest}`,
    lon: Math.round((lo[1] + t * (hi[1] - lo[1])) * 1e6) / 1e6,
    lat: Math.round((lo[2] + t * (hi[2] - lo[2])) * 1e6) / 1e6,
    ...(cc ? { cc } : {}),
    estimated: true,
  };
}
