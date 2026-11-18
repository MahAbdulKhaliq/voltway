// Shape of the charger-map files in public/data/map/ (written by scripts/lib/map-build.ts,
// read by the map). Short keys keep the files small; see map-build.ts for what each file holds.

import type { ChargerLevel, Plug } from './power-bands.ts';

/** [level, plug, rated kW or null (unknown), port count] */
export type MapPort = [ChargerLevel, Plug, number | null, number];

export interface MapStationProps {
  /** Station id: the AFDC id, or 100,000,000 + the Open Charge Map id (B77) */
  i: number;
  /** name */
  n: string;
  /** ports */
  p: MapPort[];
  /** source_id of the record this station comes from (src-afdc-ca, or src-ocm for Open Charge Map) */
  src: string;
  /** Open Charge Map only: data provider id (1 = OCM contributors, 24 = AddÉnergie, 45 = Greems) */
  op?: number;
  /** Open Charge Map only: date OCM last verified the record (YYYY-MM-DD) */
  v?: string;
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
  /** Open Charge Map, the second source (B77): when it was pulled and how many stations it adds. */
  ocm?: { source_id: string; fetched_at: string; updated: string; count: number };
  /** Stations on the map per source and country (B78): AFDC per file, OCM after duplicates. */
  sources?: { source_id: string; country: string; fetched_at: string; count: number }[];
}

/** The Open Charge Map data providers we use (B77, DESIGN-6 P2): names and licences as the providers give them. */
export const OCM_PROVIDERS: Record<number, { name: string; licence: string; licenceUrl: string }> = {
  1: { name: 'Open Charge Map contributors', licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  24: { name: 'AddÉnergie', licence: 'CC BY 3.0', licenceUrl: 'https://creativecommons.org/licenses/by/3.0/' },
  45: { name: 'Greems', licence: 'CC0', licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
};

/** Map ids from this number on are Open Charge Map stations (OCM id + offset). */
export const OCM_ID_OFFSET = 100_000_000;
/** source_id of Open Charge Map stations (data/sources/src-ocm.json). */
export const OCM_SOURCE_ID = 'src-ocm';
/** The Open Charge Map page for a station on the map. */
export const ocmUrl = (mapId: number) => `https://openchargemap.org/site/poi/details/${mapId - OCM_ID_OFFSET}`;
