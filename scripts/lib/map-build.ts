// Map data build (DESIGN-map.md M4): turns data/imported/afdc/stations.json into the
// compact files the charger map loads:
//   public/data/map/l3.json   stations with any Level 3 port (all their ports, so a
//                             mixed site carries its Level 2 ports too)
//   public/data/map/l2.json   Level 2-only stations, loaded when Level 2 is first ticked
//   public/data/map/meta.json updated date, counts, source
// No station is in both files, so the client can merge them without duplicates.
// Bands are not stored: the map derives them from the ports with src/lib/power-bands.ts.
// Pure: the caller reads and writes files.

import type { Station, StationsFile } from './afdc.ts';
import type { MapFeature, MapFeatureCollection, MapMeta, MapPort } from '../../src/lib/map-data.ts';

/** ~1 m precision; keeps the files small without moving any pin visibly. */
const round5 = (x: number) => Math.round(x * 1e5) / 1e5;

export function toFeature(s: Station, sourceId: string): MapFeature {
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
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [round5(s.lon), round5(s.lat)] }, properties: p };
}

export interface MapBuild {
  l3: MapFeatureCollection;
  l2: MapFeatureCollection;
  meta: MapMeta;
}

export function buildMap(file: StationsFile): MapBuild {
  const l3: MapFeature[] = [];
  const l2: MapFeature[] = [];
  for (const s of file.stations) {
    (s.ports.some((x) => x.level === 3) ? l3 : l2).push(toFeature(s, file.source_id));
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
    },
  };
}
