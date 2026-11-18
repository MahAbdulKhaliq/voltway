// Map data build (DESIGN-map.md M4): turns the AFDC files of every country (data/imported/afdc/<cc>.json,
// DESIGN-7 D1), plus the Open Charge
// Map stations that aren't duplicates of AFDC ones (B77, DESIGN-6 P3), into the compact files the
// charger map loads (B78, DESIGN-7 D2; formats in src/lib/map-tiles.ts):
//   Level 3 = stations with any Level 3 port (all their ports, so a mixed site carries its Level 2
//   ports too); Level 2 = Level 2-only stations. No station is in both, so the client can merge them.
//   public/data/map/o3.json, o2.json          overview per level (numbers only, for clusters and filters)
//   public/data/map/tiles/<level>/<key>.json  full records, cut by area (quadtree)
//   public/data/map/tiles/index.json          the tiles and their counts
//   public/data/map/meta.json                 updated dates, counts per source and country
// Power ranges are not stored: the map filters each port's kW with src/lib/power-bands.ts.
// Pure: the caller reads and writes files.

import type { Station, StationsFile } from './afdc.ts';
import type { OcmStation, OcmStationsFile } from './ocm.ts';
import { mergeOcm, type MergeResult, type SkipEntry } from './ocm-merge.ts';
import type { MapFeature, MapFeatureCollection, MapMeta, MapPort } from '../../src/lib/map-data.ts';
import type { ChargerLevel } from '../../src/lib/power-bands.ts';
import { encodeOverview, keyAt, MAX_DEPTH, rootKey, tilePath, type OverviewFile, type TileIndex } from '../../src/lib/map-tiles.ts';

/** Budgets (owner, 2026-11-18, DESIGN-7 D2): no detail tile over 300 KB, and the first map load (the
 * Level 3 overview, the tile index and the meta) under 1 MB, both raw. The data build fails otherwise. */
export const MAX_TILE_BYTES = 300_000;
export const MAX_FIRST_LOAD_BYTES = 1_000_000;

/** ~1 m precision; keeps the files small without moving any pin visibly. */
const round5 = (x: number) => Math.round(x * 1e5) / 1e5;

export function toFeature(s: Station | OcmStation, sourceId: string): MapFeature {
  const p: MapFeature['properties'] = {
    i: s.id,
    n: s.name,
    p: s.ports.map((x): MapPort => [x.level, x.plug, x.kw, x.count]),
    src: sourceId,
  };
  // Optional keys are left out when empty, to keep the files small.
  if (s.street) p.a = s.street;
  if (s.city) p.c = s.city;
  if (s.province) p.r = s.province;
  if (s.postal) p.z = s.postal;
  if (s.network) p.nw = s.network;
  if (s.status === 'T') p.t = 1;
  if (s.expected_date) p.ed = s.expected_date;
  if (s.restricted) p.rs = 1;
  if (s.access_detail) p.ad = s.access_detail;
  if (s.hours) p.h = s.hours;
  if (s.pricing) p.pr = s.pricing;
  if (s.pricing_fr) p.pf = s.pricing_fr;
  if (s.updated) p.u = s.updated;
  if ('provider' in s) {
    p.op = s.provider;
    if (s.verified) p.v = s.verified;
  }
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [round5(s.lon), round5(s.lat)] }, properties: p };
}

export interface MapBuild {
  l3: MapFeatureCollection;
  l2: MapFeatureCollection;
  meta: MapMeta;
  /** The duplicate check against AFDC, when OCM data was given. */
  ocm: MergeResult | null;
  /** B78 (DESIGN-7 D2): the overview per level, and the detail tiles per level with their index. */
  overview: Record<ChargerLevel, OverviewFile>;
  tiles: Record<ChargerLevel, Map<string, MapFeature[]>>;
  index: TileIndex;
}

/**
 * The B78 map files as text (tile path → JSON, the overviews, the index) and the budgets they break,
 * for the data build to write or refuse (DESIGN-7 D2).
 */
export function mapFiles(map: Pick<MapBuild, 'tiles' | 'overview' | 'index' | 'meta'>, budgets = { tile: MAX_TILE_BYTES, firstLoad: MAX_FIRST_LOAD_BYTES }) {
  const problems: string[] = [];
  const tileJson = new Map<string, string>();
  for (const lv of [3, 2] as const) {
    for (const [key, features] of map.tiles[lv]) {
      const json = JSON.stringify({ type: 'FeatureCollection', features });
      if (bytes(json) > budgets.tile) problems.push(`map/${tilePath(lv, key)} is ${(bytes(json) / 1e3).toFixed(0)} KB (budget ${budgets.tile / 1e3} KB)`);
      tileJson.set(tilePath(lv, key), json);
    }
  }
  const overviewJson = { 3: JSON.stringify(map.overview[3]), 2: JSON.stringify(map.overview[2]) };
  const indexJson = JSON.stringify(map.index);
  const firstLoad = bytes(overviewJson[3]) + bytes(indexJson) + bytes(JSON.stringify(map.meta));
  if (firstLoad > budgets.firstLoad) problems.push(`first map load is ${(firstLoad / 1e6).toFixed(2)} MB (budget ${budgets.firstLoad / 1e6} MB)`);
  return { problems, tileJson, overviewJson, indexJson, firstLoad };
}

/** Size on the wire: UTF-8 bytes, not characters (accented names take two; QA 2026-11-18, M1). */
const bytes = (s: string) => Buffer.byteLength(s, 'utf8');
const tileBytes = (features: readonly MapFeature[]) => bytes(JSON.stringify({ type: 'FeatureCollection', features }));

/**
 * Cuts stations into quadtree tiles: each 2° cell that is over `maxBytes` splits into quarters,
 * and so on down to MAX_DEPTH. A cell still over the budget at the smallest size stays as it is;
 * the data build reports it as a broken budget.
 */
export function buildTiles(features: readonly MapFeature[], maxBytes = MAX_TILE_BYTES): Map<string, MapFeature[]> {
  const out = new Map<string, MapFeature[]>();
  const split = (list: MapFeature[], depth: number) => {
    const groups = new Map<string, MapFeature[]>();
    for (const f of list) {
      const [lon, lat] = f.geometry.coordinates;
      const key = depth === 0 ? rootKey(lon, lat) : keyAt(lon, lat, depth);
      const g = groups.get(key);
      if (g) g.push(f);
      else groups.set(key, [f]);
    }
    for (const [key, g] of groups) {
      if (depth < MAX_DEPTH && tileBytes(g) > maxBytes) split(g, depth + 1);
      else out.set(key, g.sort((a, b) => a.properties.i - b.properties.i));
    }
  };
  split([...features], 0);
  return new Map([...out].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/**
 * `files`: the AFDC file of each country (Canada first; its date heads the meta). `ocmFiles`: the Open
 * Charge Map file of each country, checked for duplicates against the AFDC stations of all countries.
 */
export function buildMap(files: readonly StationsFile[], ocmFiles: readonly OcmStationsFile[] = [], skip: readonly SkipEntry[] = []): MapBuild {
  if (files.length === 0) throw new Error('map build: no AFDC file');
  const file = files[0];
  const l3: MapFeature[] = [];
  const l2: MapFeature[] = [];
  const add = (s: Station, src: string) => (s.ports.some((x) => x.level === 3) ? l3 : l2).push(toFeature(s, src));
  for (const f of files) for (const s of f.stations) add(s, f.source_id);
  const ocmFile = ocmFiles[0] ?? null;
  const ocm = ocmFile ? mergeOcm(ocmFiles.flatMap((f) => f.stations), files.flatMap((f) => f.stations), skip) : null;
  if (ocmFile && ocm) for (const s of ocm.kept) add(s, ocmFile.source_id);
  const ids = new Set<number>();
  for (const f of [...l3, ...l2]) {
    if (ids.has(f.properties.i)) throw new Error(`map build: station id ${f.properties.i} used twice`);
    ids.add(f.properties.i);
  }
  const fc = (features: MapFeature[]): MapFeatureCollection => ({ type: 'FeatureCollection', features });
  const tiles = { 3: buildTiles(l3), 2: buildTiles(l2) };
  const counts = (m: Map<string, MapFeature[]>) => Object.fromEntries([...m].map(([k, v]) => [k, v.length]));
  // Stations per source and country (B78): AFDC by file, OCM by the country file each kept station came from.
  const ocmKept = new Set(ocm?.kept.map((s) => s.id) ?? []);
  const sources = [
    ...files.map((f) => ({ source_id: f.source_id, country: f.source.slice(-2), fetched_at: f.fetched_at, count: f.stations.length })),
    ...ocmFiles.map((f) => ({ source_id: f.source_id, country: f.source.slice(-2), fetched_at: f.fetched_at, count: f.stations.filter((s) => ocmKept.has(s.id)).length })),
  ];
  return {
    l3: fc(l3),
    l2: fc(l2),
    meta: {
      source_id: file.source_id,
      fetched_at: file.fetched_at,
      updated: file.fetched_at.slice(0, 10),
      counts: { l3: l3.length, l2: l2.length, total: l3.length + l2.length },
      ...(ocmFile && ocm
        ? { ocm: { source_id: ocmFile.source_id, fetched_at: ocmFile.fetched_at, updated: ocmFile.fetched_at.slice(0, 10), count: ocm.kept.length } }
        : {}),
      sources,
    },
    ocm,
    overview: { 3: encodeOverview(3, l3), 2: encodeOverview(2, l2) },
    tiles,
    index: { v: 1, maxTileBytes: MAX_TILE_BYTES, tiles: { 3: counts(tiles[3]), 2: counts(tiles[2]) } },
  };
}
