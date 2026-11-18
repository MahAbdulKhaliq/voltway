// Map data build (DESIGN-map.md M4): turns the AFDC files of every country (data/imported/afdc/<cc>.json,
// DESIGN-7 D1), plus the Open Charge
// Map stations that aren't duplicates of AFDC ones (B77, DESIGN-6 P3), into the compact files the
// charger map loads:
//   public/data/map/l3.json   stations with any Level 3 port (all their ports, so a
//                             mixed site carries its Level 2 ports too)
//   public/data/map/l2.json   Level 2-only stations, loaded when Level 2 is first ticked
//   public/data/map/meta.json updated date, counts, source
// No station is in both files, so the client can merge them without duplicates.
// Power ranges are not stored: the map filters each port's kW with src/lib/power-bands.ts.
// Pure: the caller reads and writes files.

import type { Station, StationsFile } from './afdc.ts';
import type { OcmStation, OcmStationsFile } from './ocm.ts';
import { mergeOcm, type MergeResult, type SkipEntry } from './ocm-merge.ts';
import type { MapFeature, MapFeatureCollection, MapMeta, MapPort } from '../../src/lib/map-data.ts';

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
    },
    ocm,
  };
}
