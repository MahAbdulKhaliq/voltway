// Removes OCM stations that are already on the map from AFDC (docs/plan/DESIGN-6.md P3, B77).
// AFDC wins. Layers, in order:
//   skip list  an OCM id the owner marked as a duplicate (data/imported/ocm/skip.json)
//   place      an AFDC station within 150 m sharing a plug type at the same level
//   address    an AFDC station within 1 km with the same street number and street name, sharing a plug at the same level
//   name       an AFDC station within 300 m whose name shares two words, sharing a plug at the same level
// A match never removes an OCM station with a Level 3 port or a NACS plug its AFDC match lacks (audit 2026-11-18).
// Two Tesla Destination sites (one 16 kW wall connector each, usually a different hotel each) match at
// the place layer only when also within 25 m, or sharing a name or street address; the name layer
// ignores generic words ("tesla", "suites", "hotel"…). Owner decision 2026-11-18 (US data audit F1).
// (OCM's copies of AFDC records are never fetched.) What's kept but still within 500 m of an AFDC
// station is listed as a near miss, for the refresh summary and the audit agent.
// Pure: the caller reads the files.

import type { Station } from './afdc.ts';
import { OCM_ID_OFFSET, type OcmStation } from './ocm.ts';

export const PLACE_KM = 0.15;
export const ADDRESS_KM = 1;
export const NAME_KM = 0.3;
export const NEAR_MISS_KM = 0.5;
/** Two Tesla Destination sites closer than this are taken as the same place without other evidence. */
export const DESTINATION_PLACE_KM = 0.025;
const DESTINATION = 'Tesla Destination';

export type DuplicateLayer = 'skip' | 'place' | 'address' | 'name';

export interface SkipEntry {
  /** OCM's own POI id (not the map id). */
  ocm_id: number;
  reason: string;
}

export interface NearMiss {
  ocm: { id: number; name: string; street: string | null };
  afdc: { id: number; name: string; street: string | null };
  km: number;
}

export interface MergeResult {
  kept: OcmStation[];
  dropped: Record<DuplicateLayer, number>;
  /** Which AFDC station each dropped OCM record matched (map id → AFDC id; skip-list drops have none). */
  matches: { ocm: number; afdc: number | null; layer: DuplicateLayer }[];
  nearMisses: NearMiss[];
}

const R = 6371.0088;
const rad = Math.PI / 180;
export function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const STREET_TYPES = /\b(street|st|road|rd|avenue|ave|boulevard|blvd|drive|dr|highway|hwy|chemin|ch|rue|route|rte|unit|suite)\b/g;
/** Lower case, accents and punctuation removed, street types dropped. */
export function normText(x: string | null | undefined): string {
  return (x ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(STREET_TYPES, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
/** Words in many unrelated station names, so sharing them says nothing (audit 2026-11-18, F1). */
const GENERIC = new Set(['tesla', 'destination', 'hotel', 'hotels', 'suites', 'resort', 'parking', 'garage', 'airport', 'charging', 'charger', 'station']);
const longWords = (x: string | null | undefined) => new Set(normText(x).split(' ').filter((w) => w.length > 3 && !/^\d+$/.test(w) && !GENERIC.has(w)));
const streetNumber = (x: string | null | undefined) => normText(x).match(/^\d+/)?.[0] ?? null;

const DIRECTIONS = new Set(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw', 'north', 'south', 'east', 'west', 'nord', 'sud', 'est', 'ouest', 'o',
  // filler words that say nothing about which street it is
  'de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'of', 'the', 'a', 'au', 'aux', 'et', 'and']);
/** The street name's words after the street number: ordinals as plain numbers ("2nd", "3e", "1re" → "2", "3", "1"), directions left out. */
export function streetWords(x: string | null | undefined): Set<string> {
  const words = normText(x).split(' ').slice(1).map((w) => w.replace(/^(\d+)(st|nd|rd|th|e|er|re|eme|ieme)$/, '$1'));
  return new Set(words.filter((w) => w && !DIRECTIONS.has(w)));
}

/** Same street number and at least one street-name word in common (numbered streets and highways count). */
export function sameAddress(a: string | null, b: string | null): boolean {
  const n = streetNumber(a);
  if (!n || n !== streetNumber(b)) return false;
  const B = streetWords(b);
  for (const w of streetWords(a)) if (B.has(w)) return true;
  return false;
}

/** Names sharing at least two words of four letters or more. */
export function similarNames(a: string, b: string): boolean {
  const B = longWords(b);
  let n = 0;
  for (const w of longWords(a)) if (B.has(w) && ++n >= 2) return true;
  return false;
}

/** A plug type offered at the same level by both. */
export function sharePlug(a: Pick<Station, 'ports'>, b: Pick<Station, 'ports'>): boolean {
  return a.ports.some((p) => b.ports.some((q) => p.level === q.level && p.plug === q.plug));
}

/** True when the OCM station offers something the AFDC one doesn't: a Level 3 port, a NACS plug, or a CCS1/CHAdeMO fast charger. Then it isn't treated as a duplicate (audit 2026-11-18: DC fast and Tesla sites were lost). */
export function addsSomething(o: Pick<Station, 'ports'>, s: Pick<Station, 'ports'>): boolean {
  const has = (x: Pick<Station, 'ports'>, f: (p: Station['ports'][number]) => boolean) => x.ports.some(f);
  if (has(o, (p) => p.level === 3) && !has(s, (p) => p.level === 3)) return true;
  if (has(o, (p) => p.plug === 'nacs') && !has(s, (p) => p.plug === 'nacs')) return true;
  // A CCS1 or CHAdeMO fast charger next to an AFDC station with only Tesla fast charging (audit W1: Jule Port Union by a Supercharger).
  const dcOther = (x: Pick<Station, 'ports'>) => has(x, (p) => p.level === 3 && (p.plug === 'ccs1' || p.plug === 'chademo'));
  if (dcOther(o) && !dcOther(s)) return true;
  return false;
}

/** A coarse grid (0.01°, about 1.1 km north–south) so each OCM station only looks at nearby AFDC ones. */
function gridOf(stations: readonly Station[]) {
  const cell = (lat: number, lon: number) => `${Math.floor(lat * 100)},${Math.floor(lon * 100)}`;
  const grid = new Map<string, Station[]>();
  for (const s of stations) {
    const k = cell(s.lat, s.lon);
    const list = grid.get(k);
    if (list) list.push(s);
    else grid.set(k, [s]);
  }
  /** AFDC stations within `maxKm` (≤ 1 km), nearest first. */
  return (p: { lat: number; lon: number }, maxKm: number): [number, Station][] => {
    const a = Math.floor(p.lat * 100);
    const b = Math.floor(p.lon * 100);
    const out: [number, Station][] = [];
    // 1 km is under one cell of latitude; longitude cells are narrower in the north, so look 2 wide.
    for (let i = -1; i <= 1; i++) for (let j = -2; j <= 2; j++) {
      for (const s of grid.get(`${a + i},${b + j}`) ?? []) {
        const d = km(p, s);
        if (d <= maxKm) out.push([d, s]);
      }
    }
    return out.sort((x, y) => x[0] - y[0]);
  };
}

export function mergeOcm(ocm: readonly OcmStation[], afdc: readonly Station[], skip: readonly SkipEntry[] = []): MergeResult {
  const near = gridOf(afdc);
  const skipIds = new Set(skip.map((s) => s.ocm_id));
  const dropped: Record<DuplicateLayer, number> = { skip: 0, place: 0, address: 0, name: 0 };
  const matches: MergeResult['matches'] = [];
  const kept: OcmStation[] = [];
  const nearMisses: NearMiss[] = [];
  for (const o of ocm) {
    const ocmId = o.id - OCM_ID_OFFSET;
    if (skipIds.has(ocmId)) {
      dropped.skip++;
      matches.push({ ocm: o.id, afdc: null, layer: 'skip' });
      continue;
    }
    const around = near(o, ADDRESS_KM);
    const bothDestination = (s: Station) => o.network === DESTINATION && s.network === DESTINATION;
    const layers: [DuplicateLayer, (d: number, s: Station) => boolean][] = [
      ['place', (d, s) => d <= PLACE_KM && sharePlug(o, s) && (!bothDestination(s) || d <= DESTINATION_PLACE_KM || similarNames(o.name, s.name) || sameAddress(o.street, s.street))],
      ['address', (_, s) => sameAddress(o.street, s.street) && sharePlug(o, s)],
      ['name', (d, s) => d <= NAME_KM && similarNames(o.name, s.name) && sharePlug(o, s)],
    ];
    let matched = false;
    for (const [layer, test] of layers) {
      const m = around.find(([d, s]) => test(d, s) && !addsSomething(o, s));
      if (!m) continue;
      dropped[layer]++;
      matches.push({ ocm: o.id, afdc: m[1].id, layer });
      matched = true;
      break;
    }
    if (matched) continue;
    kept.push(o);
    const closest = around[0];
    if (closest && closest[0] <= NEAR_MISS_KM) {
      const [d, s] = closest;
      nearMisses.push({ ocm: { id: ocmId, name: o.name, street: o.street }, afdc: { id: s.id, name: s.name, street: s.street }, km: Math.round(d * 1000) / 1000 });
    }
  }
  return { kept, dropped, matches, nearMisses };
}
