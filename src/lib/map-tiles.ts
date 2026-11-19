// Charger map data in two layers (B78, DESIGN-7 D2), shared by the build (scripts/lib/map-build.ts)
// and the map:
//
// 1. Overview, one file per level for both countries (public/data/map/o3.json, o2.json): every
//    station as columns of numbers (id, position, flags, ports), no names or addresses. It is what
//    the zoomed-out map, its clusters and its filters use, so cluster counts stay true to the filters.
// 2. Detail tiles (public/data/map/tiles/<level>/<key>.json): the full station records, cut by area
//    into a quadtree over lat/lon. They load when a pin is opened, when the map is zoomed in, for
//    Stations in view and along a planned trip. public/data/map/tiles/index.json lists them.
//
// Level 3 files hold every station with a Level 3 port (with all its ports); Level 2 files the
// Level 2-only ones, as before, so no station is in both.

import type { ChargerLevel, Plug } from './power-bands.ts';
import type { MapFeature, MapPort } from './map-data.ts';

// ---- Overview encoding

/** Port plug codes (any order would do; stored in the files, so never reorder). */
const PLUG_CODES: readonly Plug[] = ['j1772', 'ccs1', 'nacs', 'chademo'];

/**
 * One port as a number: (level-3 flag × 4 + plug code) × 10,000 + rated kW × 10 (0 = unknown).
 * Port counts aren't kept: the overview only filters and clusters.
 */
export function encodePort([level, plug, kw]: MapPort): number {
  const code = (level === 3 ? 4 : 0) + PLUG_CODES.indexOf(plug);
  const tenths = kw != null && Number.isFinite(kw) && kw > 0 ? Math.min(9999, Math.round(kw * 10)) : 0;
  return code * 10000 + tenths;
}

export function decodePort(n: number): MapPort {
  const code = Math.floor(n / 10000);
  const tenths = n % 10000;
  return [code >= 4 ? 3 : 2, PLUG_CODES[code % 4], tenths ? tenths / 10 : null, 1];
}

/** Flags: 1 = temporarily unavailable, 2 = Tesla Supercharger network, 4 = Tesla Destination. */
export const FLAG = { unavailable: 1, supercharger: 2, destination: 4 } as const;
const SUPERCHARGER = 'Tesla';
const DESTINATION = 'Tesla Destination';

/** Coordinates are stored as integers of 1/10,000 degree (~11 m), enough for a pin. */
const COORD = 1e4;

/**
 * The overview file: parallel columns, stations sorted by id. Ids and coordinates are stored as the
 * difference from the previous station's, which keeps the numbers short. `p` holds a station's
 * ports as one number, or a list when it has several kinds.
 */
export interface OverviewFile {
  v: 1;
  level: ChargerLevel;
  i: number[];
  x: number[];
  y: number[];
  f: number[];
  p: (number | number[])[];
}

export function encodeOverview(level: ChargerLevel, features: readonly MapFeature[]): OverviewFile {
  const out: OverviewFile = { v: 1, level, i: [], x: [], y: [], f: [], p: [] };
  let pi = 0, px = 0, py = 0;
  for (const feat of [...features].sort((a, b) => a.properties.i - b.properties.i)) {
    const s = feat.properties;
    const x = Math.round(feat.geometry.coordinates[0] * COORD);
    const y = Math.round(feat.geometry.coordinates[1] * COORD);
    out.i.push(s.i - pi);
    out.x.push(x - px);
    out.y.push(y - py);
    pi = s.i; px = x; py = y;
    out.f.push((s.t ? FLAG.unavailable : 0) | (s.nw === SUPERCHARGER ? FLAG.supercharger : 0) | (s.nw === DESTINATION ? FLAG.destination : 0));
    const ports = [...new Set(s.p.map(encodePort))].sort((a, b) => b - a);
    out.p.push(ports.length === 1 ? ports[0] : ports);
  }
  return out;
}

/**
 * The overview as light map features: id, position, ports (count 1 each), the Tesla network name
 * when the filters need it, and the unavailable flag. Enough for the filters and the clusters, not
 * for the station panel (that comes from a detail tile).
 */
export function decodeOverview(file: OverviewFile): MapFeature[] {
  const out: MapFeature[] = new Array(file.i.length);
  let i = 0, x = 0, y = 0;
  for (let k = 0; k < file.i.length; k++) {
    i += file.i[k]; x += file.x[k]; y += file.y[k];
    const flags = file.f[k];
    const raw = file.p[k];
    const props: MapFeature['properties'] = { i, n: '', p: (Array.isArray(raw) ? raw : [raw]).map(decodePort), src: '' };
    if (flags & FLAG.unavailable) props.t = 1;
    if (flags & FLAG.supercharger) props.nw = SUPERCHARGER;
    else if (flags & FLAG.destination) props.nw = DESTINATION;
    out[k] = { type: 'Feature', geometry: { type: 'Point', coordinates: [x / COORD, y / COORD] }, properties: props };
  }
  return out;
}

// ---- Detail tiles: a quadtree over lat/lon

/** Top-level cells are 2° square; a cell over the budget splits into quarters, down to MIN_DEG. */
export const ROOT_DEG = 2;
/** The smallest cell: 2° / 2^6 ≈ 3.5 km north–south. The densest downtowns need it at Level 2. */
export const MAX_DEPTH = 6;
export const MIN_DEG = ROOT_DEG / 2 ** MAX_DEPTH;

/** The tile index: per level, each tile's key and station count. A key gives its own box (tileBox). */
export interface TileIndex {
  v: 1;
  /** Budget the build kept to, for the record. */
  maxTileBytes: number;
  tiles: Record<ChargerLevel, Record<string, number>>;
}

const clampLon = (lon: number) => Math.min(Math.max(lon, -180), 180 - 1e-9);
const clampLat = (lat: number) => Math.min(Math.max(lat, -90), 90 - 1e-9);

/** The top-level cell of a point: "x-y", counted in 2° steps from 180° W and 90° S. */
export function rootKey(lon: number, lat: number): string {
  return `${Math.floor((clampLon(lon) + 180) / ROOT_DEG)}-${Math.floor((clampLat(lat) + 90) / ROOT_DEG)}`;
}

/** The key of a point's cell at a depth: the root key, then one quadrant digit per level (0 SW, 1 SE, 2 NW, 3 NE). */
export function keyAt(lon: number, lat: number, depth: number): string {
  lon = clampLon(lon);
  lat = clampLat(lat);
  let key = rootKey(lon, lat);
  if (depth === 0) return key;
  let [w, s] = rootBox(key);
  let size = ROOT_DEG;
  key += '-';
  for (let d = 0; d < depth; d++) {
    size /= 2;
    const east = lon >= w + size ? 1 : 0;
    const north = lat >= s + size ? 1 : 0;
    key += String(north * 2 + east);
    w += east * size;
    s += north * size;
  }
  return key;
}

function rootBox(root: string): [number, number] {
  const [x, y] = root.split('-').map(Number);
  return [x * ROOT_DEG - 180, y * ROOT_DEG - 90];
}

/** [west, south, east, north] of a tile key. */
export function tileBox(key: string): [number, number, number, number] {
  const [x, y, path = ''] = key.split('-');
  let [w, s] = rootBox(`${x}-${y}`);
  let size = ROOT_DEG;
  for (const c of path) {
    size /= 2;
    const q = Number(c);
    w += (q % 2) * size;
    s += Math.floor(q / 2) * size;
  }
  return [w, s, w + size, s + size];
}

/** The tile of a level that holds a point, or null when no station of that level is in its area. */
export function tileFor(index: TileIndex, level: ChargerLevel, lon: number, lat: number): string | null {
  const tiles = index.tiles[level];
  for (let d = 0; d <= MAX_DEPTH; d++) {
    const key = keyAt(lon, lat, d);
    if (key in tiles) return key;
  }
  return null;
}

/** The tiles of a level whose area meets a box [west, south, east, north]. */
export function tilesIn(index: TileIndex, level: ChargerLevel, [w, s, e, n]: readonly [number, number, number, number]): string[] {
  return Object.keys(index.tiles[level]).filter((key) => {
    const [tw, ts, te, tn] = tileBox(key);
    return tw < e && te > w && ts < n && tn > s;
  });
}

/** Where a tile's file is, under the map data folder. */
export const tilePath = (level: ChargerLevel, key: string) => `tiles/${level}/${key}.json`;

// ---- Loading on the map (7.7, 7.8)

/** From this zoom, the tiles behind the single pins on screen load, so opening one is instant. */
export const DETAIL_ZOOM = 9;
/** The trip planner looks at stations within 10 km of the route (trip-plan WIDE_KM); its tiles load within this distance. */
export const CORRIDOR_KM = 25;

/** Detail tiles fetched once each per visit; a failed tile can be asked for again. */
export function createTileLoader(baseUrl: string, fetchJson: (url: string) => Promise<unknown>) {
  const cache = new Map<string, Promise<MapFeature[]>>();
  const one = (level: ChargerLevel, key: string): Promise<MapFeature[]> => {
    const path = tilePath(level, key);
    let p = cache.get(path);
    if (!p) {
      p = fetchJson(`${baseUrl}/${path}`).then((body) => {
        const features = (body as { features?: unknown }).features;
        if (!Array.isArray(features)) throw new Error(`${path}: not a tile`);
        return features as MapFeature[];
      });
      p.catch(() => cache.delete(path));
      cache.set(path, p);
    }
    return p;
  };
  return {
    /** The full records of these tiles (each fetched at most once). */
    load: async (level: ChargerLevel, keys: readonly string[]) => (await Promise.all([...new Set(keys)].map((k) => one(level, k)))).flat(),
    /** Whether a tile was asked for already (loading or loaded). */
    has: (level: ChargerLevel, key: string) => cache.has(tilePath(level, key)),
  };
}
export type TileLoader = ReturnType<typeof createTileLoader>;

/** Overview stations with any loaded full records swapped in (same id). Returns the same list when nothing changes. */
export function mergeDetails(list: MapFeature[], details: ReadonlyMap<number, MapFeature>): MapFeature[] {
  let changed = false;
  const out = list.map((f) => {
    const d = details.get(f.properties.i);
    if (d && d !== f) { changed = true; return d; }
    return f;
  });
  return changed ? out : list;
}

/** A full record (from a detail tile), not an overview one (which has no source or name). */
export const isFull = (f: MapFeature): boolean => f.properties.src !== '';

/**
 * The tiles of a level within `km` of a route (7.8): the route is sampled every few km and each
 * sample's box is looked up, so a long trip only asks for the cells it passes.
 */
export function corridorTiles(index: TileIndex, level: ChargerLevel, coords: readonly (readonly number[])[], km = CORRIDOR_KM): string[] {
  const boxes = Object.keys(index.tiles[level]).map((key) => ({ key, b: tileBox(key) }));
  const keys = new Set<string>();
  const dLat = km / 111.32;
  const near = (lon: number, lat: number) => {
    const dLon = km / (111.32 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));
    for (const { key, b } of boxes) if (b[0] < lon + dLon && b[2] > lon - dLon && b[1] < lat + dLat && b[3] > lat - dLat) keys.add(key);
  };
  // Samples no further apart than km/2, so the boxes overlap along the line.
  const step = km / 2 / 111.32;
  for (let i = 0; i < coords.length; i++) {
    const [lon, lat] = coords[i];
    near(lon, lat);
    const next = coords[i + 1];
    if (!next) break;
    const span = Math.hypot(next[0] - lon, next[1] - lat);
    for (let t = step; t < span; t += step) near(lon + ((next[0] - lon) * t) / span, lat + ((next[1] - lat) * t) / span);
  }
  return [...keys].sort();
}
