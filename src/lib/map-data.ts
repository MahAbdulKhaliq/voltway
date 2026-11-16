// Shape of the charger-map files in public/data/map/ (written by scripts/lib/map-build.ts,
// read by the map). Short keys keep the files small; see map-build.ts for what each file holds.

import type { ChargerLevel, Plug } from './power-bands.ts';

/** [level, plug, rated kW or null (unknown), port count] */
export type MapPort = [ChargerLevel, Plug, number | null, number];

export interface MapStationProps {
  /** AFDC station id */
  i: number;
  /** name */
  n: string;
  /** ports */
  p: MapPort[];
  /** source_id of the record this station comes from (src-afdc-ca) */
  src: string;
  /** street, city, province, postal code */
  a?: string;
  c?: string;
  r?: string;
  z?: string;
  /** network as the source names it ("Tesla" = Supercharger, "Tesla Destination") */
  nw?: string;
  /** 1 = temporarily unavailable */
  t?: 1;
  /** expected date (YYYY-MM-DD) for a temporarily unavailable station; show only if in the future */
  ed?: string;
  /** 1 = restricted access (customers only, limited hours, …) */
  rs?: 1;
  /** AFDC access detail code (e.g. CALL, KEY_ALWAYS) */
  ad?: string;
  /** hours text */
  h?: string;
  /** pricing text (English, French) as given */
  pr?: string;
  pf?: string;
  /** date the source last updated this station (YYYY-MM-DD) */
  u?: string;
}

export interface MapFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: MapStationProps;
}

export interface MapFeatureCollection {
  type: 'FeatureCollection';
  features: MapFeature[];
}

export interface MapMeta {
  source_id: string;
  fetched_at: string;
  /** fetched_at as YYYY-MM-DD, for the "updated" footer */
  updated: string;
  counts: { l3: number; l2: number; total: number };
}
