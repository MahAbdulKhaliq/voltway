// B78 (DESIGN-7 D2, item 7.6): overview encoding, quadtree tiles, keys, index and budgets.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { StationsFile } from '../scripts/lib/afdc.ts';
import type { OcmStationsFile } from '../scripts/lib/ocm.ts';
import { buildMap, buildTiles, mapFiles } from '../scripts/lib/map-build.ts';
import type { MapFeature, MapPort } from '../src/lib/map-data.ts';
import {
  decodeOverview,
  decodePort,
  encodeOverview,
  encodePort,
  keyAt,
  MAX_DEPTH,
  rootKey,
  tileBox,
  tileFor,
  tilesIn,
  type TileIndex,
} from '../src/lib/map-tiles.ts';

const REPO = join(import.meta.dirname, '..');

function feat(i: number, lon: number, lat: number, p: MapPort[] = [[2, 'j1772', 7.2, 2]], extra: Partial<MapFeature['properties']> = {}): MapFeature {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { i, n: `Station ${i} with a fairly long name`, p, src: 'src-afdc-us', a: '123 Main Street', c: 'Somewhere', r: 'TX', ...extra } };
}

describe('overview encoding', () => {
  it('round-trips ports: level, plug and kW to 0.1 (unknown stays unknown, counts become 1)', () => {
    const ports: MapPort[] = [[3, 'ccs1', 350, 4], [3, 'nacs', 250, 8], [3, 'chademo', 62.5, 1], [2, 'j1772', 7.2, 2], [2, 'j1772', null, 1], [2, 'nacs', 11.5, 2]];
    for (const p of ports) expect(decodePort(encodePort(p))).toEqual([p[0], p[1], p[2], 1]);
  });

  it('round-trips stations: ids, positions to ~11 m, flags and ports, whatever the input order', () => {
    const feats = [
      feat(900, -97.7431, 30.2672, [[3, 'nacs', 250, 8]], { nw: 'Tesla' }),
      feat(5, -79.3832, 43.6532, [[3, 'ccs1', 50, 1], [2, 'j1772', 7.2, 2]], { t: 1 }),
      feat(100_000_123, -149.9003, 61.2181, [[2, 'nacs', 11.5, 2]], { nw: 'Tesla Destination' }),
    ];
    const back = decodeOverview(JSON.parse(JSON.stringify(encodeOverview(3, feats))));
    expect(back.map((f) => f.properties.i)).toEqual([5, 900, 100_000_123]);
    const byId = new Map(back.map((f) => [f.properties.i, f]));
    for (const f of feats) {
      const b = byId.get(f.properties.i)!;
      expect(b.geometry.coordinates[0]).toBeCloseTo(f.geometry.coordinates[0], 4);
      expect(b.geometry.coordinates[1]).toBeCloseTo(f.geometry.coordinates[1], 4);
      expect(b.properties.nw).toBe(f.properties.nw);
      expect(b.properties.t).toBe(f.properties.t);
      expect(b.properties.p.map((p) => p.slice(0, 3)).sort()).toEqual(f.properties.p.map((p) => p.slice(0, 3)).sort());
    }
    expect(byId.get(5)!.properties.n).toBe(''); // no names in the overview
  });

  it('a site with several kinds of port keeps a list; one kind is a single number', () => {
    const o = encodeOverview(3, [feat(1, 0, 0, [[3, 'ccs1', 50, 1]]), feat(2, 0, 0, [[3, 'ccs1', 50, 1], [2, 'j1772', 7.2, 1]])]);
    expect(typeof o.p[0]).toBe('number');
    expect(Array.isArray(o.p[1])).toBe(true);
  });
});

describe('tile keys', () => {
  it('root cells are 2° from 180° W / 90° S', () => {
    expect(rootKey(-180, -90)).toBe('0-0');
    expect(rootKey(-79.38, 43.65)).toBe('50-66');
    expect(rootKey(180, 90)).toBe('179-89'); // clamped into the last cell
  });

  it('each quadrant digit halves the cell (0 SW, 1 SE, 2 NW, 3 NE), and the box contains the point', () => {
    const pts: [number, number][] = [[-79.3832, 43.6532], [-118.2437, 34.0522], [-149.9003, 61.2181], [144.75, 13.47], [-0.0001, -0.0001]];
    for (const [lon, lat] of pts) {
      for (let d = 0; d <= MAX_DEPTH; d++) {
        const key = keyAt(lon, lat, d);
        const [w, s, e, n] = tileBox(key);
        expect(lon >= w && lon < e && lat >= s && lat < n).toBe(true);
        expect(e - w).toBeCloseTo(2 / 2 ** d, 10);
        if (d > 0) expect(key.startsWith(keyAt(lon, lat, d - 1).replace(/-$/, ''))).toBe(true);
      }
    }
    expect(keyAt(-179.5, -89.5, 1)).toBe('0-0-0');
    expect(keyAt(-179, -89, 1)).toBe('0-0-3'); // on the midlines: east and north
    expect(keyAt(-178.5, -88.5, 2)).toBe('0-0-33');
  });
});

describe('quadtree tiles', () => {
  // A dense block (downtown) and scattered stations elsewhere.
  const dense = Array.from({ length: 600 }, (_, k) => feat(k + 1, -118.25 + (k % 30) * 0.01, 34.05 + Math.floor(k / 30) * 0.01));
  const rural = Array.from({ length: 40 }, (_, k) => feat(10_000 + k, -110 + k * 0.7, 45 + (k % 5) * 0.3));
  const all = [...dense, ...rural];

  it('splits a cell over the budget into quarters until each fits, and leaves small cells whole', () => {
    const budget = 30_000;
    const tiles = buildTiles(all, budget);
    for (const [, list] of tiles) expect(JSON.stringify({ type: 'FeatureCollection', features: list }).length).toBeLessThanOrEqual(budget);
    const depths = [...tiles.keys()].map((k) => (k.split('-')[2] ?? '').length);
    expect(Math.max(...depths)).toBeGreaterThan(0); // downtown split
    expect(depths.filter((d) => d === 0).length).toBeGreaterThan(5); // rural cells stay 2°
  });

  it('puts every station in exactly one tile, inside that tile’s box', () => {
    const tiles = buildTiles(all, 30_000);
    const seen = new Map<number, string>();
    for (const [key, list] of tiles) {
      const [w, s, e, n] = tileBox(key);
      for (const f of list) {
        expect(seen.has(f.properties.i)).toBe(false);
        seen.set(f.properties.i, key);
        const [lon, lat] = f.geometry.coordinates;
        expect(lon >= w && lon < e && lat >= s && lat < n).toBe(true);
      }
    }
    expect(seen.size).toBe(all.length);
    // tileFor finds the same tile from the point alone.
    const index: TileIndex = { v: 1, maxTileBytes: 30_000, tiles: { 3: {}, 2: Object.fromEntries([...tiles].map(([k, v]) => [k, v.length])) } };
    for (const f of all) expect(tileFor(index, 2, f.geometry.coordinates[0], f.geometry.coordinates[1])).toBe(seen.get(f.properties.i));
    expect(tileFor(index, 2, 0, 0)).toBeNull();
    expect(tileFor(index, 3, -118.25, 34.05)).toBeNull();
  });

  it('a cell still over the budget at the smallest size stays whole, and the build reports it', () => {
    const pile = Array.from({ length: 300 }, (_, k) => feat(k + 1, -73.9857, 40.7484)); // one spot
    const tiles = buildTiles(pile, 5_000);
    expect(tiles.size).toBe(1);
    expect([...tiles.keys()][0].split('-')[2]).toHaveLength(MAX_DEPTH);
    const m = { tiles: { 3: new Map(), 2: tiles }, overview: { 3: encodeOverview(3, []), 2: encodeOverview(2, pile) }, index: { v: 1 as const, maxTileBytes: 5_000, tiles: { 3: {}, 2: {} } }, meta: { source_id: 'x', fetched_at: '', updated: '', counts: { l3: 0, l2: 300, total: 300 } } };
    expect(mapFiles(m, { tile: 5_000, firstLoad: 1e6 }).problems.join()).toMatch(/tiles\/2\/.*KB \(budget 5 KB\)/);
    expect(mapFiles(m, { tile: 1e6, firstLoad: 10 }).problems.join()).toMatch(/first map load/);
    expect(mapFiles(m, { tile: 1e6, firstLoad: 1e6 }).problems).toEqual([]);
  });

  it('tilesIn finds the tiles a box touches', () => {
    const index: TileIndex = { v: 1, maxTileBytes: 1, tiles: { 3: { [keyAt(-79.4, 43.6, 0)]: 1, [keyAt(-73.6, 45.5, 1)]: 1, [keyAt(-118.2, 34, 3)]: 1 }, 2: {} } };
    expect(tilesIn(index, 3, [-80, 43, -73, 46]).sort()).toEqual([keyAt(-79.4, 43.6, 0), keyAt(-73.6, 45.5, 1)].sort());
    expect(tilesIn(index, 3, [-120, 33, -117, 35])).toEqual([keyAt(-118.2, 34, 3)]);
    expect(tilesIn(index, 3, [0, 0, 1, 1])).toEqual([]);
  });
});

describe('map build with tiles (small data)', () => {
  it('every station is in the overview and in one tile of its level; counts per source and country', () => {
    const s = (id: number, lat: number, lon: number, level: 2 | 3) => ({
      id, name: `S${id}`, street: null, city: null, province: null, postal: null, lat, lon, network: null, status: 'E' as const,
      expected_date: null, restricted: false, access_detail: null, hours: null, pricing: null, pricing_fr: null, updated: null, confirmed: null,
      ports: [{ level, plug: level === 3 ? ('ccs1' as const) : ('j1772' as const), kw: level === 3 ? 150 : 7.2, count: 1 }],
    });
    const head = { fetched_at: '2026-11-18T00:00:00Z', raw_sha256: 'x', raw_count: 0, dropped: { private: 0, planned: 0, no_location: 0, no_l2_l3_ports: 0 }, ignored_ports: {} };
    const ca: StationsFile = { ...head, source: 'afdc-ca', source_id: 'src-afdc-ca', stations: [s(1, 43.65, -79.38, 3), s(2, 45.5, -73.57, 2)] };
    const us: StationsFile = { ...head, source: 'afdc-us', source_id: 'src-afdc-us', stations: [s(3, 34.05, -118.24, 3), s(4, 30.27, -97.74, 2), s(5, 30.28, -97.74, 2)] };
    const ocmUs: OcmStationsFile = { ...head, dropped: { provider: 0, unpublished: 0, not_operational: 0, private: 0, no_location: 0, no_port_data: 0, no_l2_l3_ports: 0 }, source: 'ocm-us', source_id: 'src-ocm', stations: [{ ...s(100_000_007, 47.6, -122.33, 3), provider: 1, verified: null }] };
    const m = buildMap([ca, us], [ocmUs]);
    for (const lv of [3, 2] as const) {
      const ids = decodeOverview(m.overview[lv]).map((f) => f.properties.i).sort((a, b) => a - b);
      const inTiles = [...m.tiles[lv].values()].flat().map((f) => f.properties.i).sort((a, b) => a - b);
      expect(inTiles).toEqual(ids);
      expect(Object.values(m.index.tiles[lv]).reduce((a, b) => a + b, 0)).toBe(ids.length);
    }
    expect(decodeOverview(m.overview[3]).map((f) => f.properties.i)).toEqual([1, 3, 100_000_007]);
    expect(m.meta.sources).toEqual([
      { source_id: 'src-afdc-ca', country: 'ca', fetched_at: head.fetched_at, count: 2 },
      { source_id: 'src-afdc-us', country: 'us', fetched_at: head.fetched_at, count: 3 },
      { source_id: 'src-ocm', country: 'us', fetched_at: head.fetched_at, count: 1 },
    ]);
  });
});

describe('map build with tiles (the real data)', () => {
  const paths = ['ca', 'us'].map((c) => join(REPO, 'data', 'imported', 'afdc', `${c}.json`));
  const ocmPaths = ['ca', 'us'].map((c) => join(REPO, 'data', 'imported', 'ocm', `${c}.json`)).filter(existsSync);
  it.skipIf(!paths.every(existsSync))('keeps the budgets, and every station is in one tile and the overview', () => {
    const read = <T,>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
    const skip = read<{ skip: { ocm_id: number; reason: string }[] }>(join(REPO, 'data', 'imported', 'ocm', 'skip.json')).skip;
    const m = buildMap(paths.map((p) => read<StationsFile>(p)), ocmPaths.map((p) => read<OcmStationsFile>(p)), skip);
    expect(mapFiles(m).problems).toEqual([]);
    for (const lv of [3, 2] as const) {
      const n = (lv === 3 ? m.l3 : m.l2).features.length;
      expect(m.overview[lv].i).toHaveLength(n);
      expect([...m.tiles[lv].values()].reduce((a, t) => a + t.length, 0)).toBe(n);
    }
  }, 60_000);
});
