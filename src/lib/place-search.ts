// From/To suggestions on the trip planner (route-planner.md §6, B45): an in-browser search over
// the GeoNames Canadian places in public/data/places.json. No network request while typing; the
// address service (/api/geocode) is called only when the visitor presses "Search full address".

import MiniSearch from 'minisearch';

/** A row of public/data/places.json (short keys). */
export interface PlaceRow { n: string; p: string; lat: number; lon: number; pop: number }

/** A trip end: a label to show and a position. */
export interface TripEnd { label: string; lat: number; lon: number }

/** "Montréal" → "montreal": accents and case don't matter when matching. */
export const fold = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const placeLabel = (p: PlaceRow): string => `${p.n}, ${p.p}`;

export interface PlaceSearch { (query: string, limit?: number): TripEnd[] }

export function makePlaceSearch(rows: readonly PlaceRow[]): PlaceSearch {
  const ms = new MiniSearch<{ id: number; name: string; prov: string }>({
    fields: ['name', 'prov'],
    storeFields: [],
    tokenize: (text) => text.split(/[\s\-'’.,/()]+/).filter(Boolean),
    processTerm: (term) => fold(term),
    searchOptions: { prefix: true, fuzzy: 0.15, combineWith: 'AND', boost: { name: 3 } },
  });
  ms.addAll(rows.map((r, id) => ({ id, name: r.n, prov: r.p })));
  // Bigger places first among similar matches ("Richmond" → Richmond, BC before Richmond, QC).
  const weight = rows.map((r) => 1 + Math.log10(Math.max(r.pop, 1000)) / 3);
  return (query, limit = 8) => {
    const q = query.trim();
    if (!q) return [];
    return ms
      .search(q, { boostDocument: (id) => weight[id as number] })
      .slice(0, limit)
      .map((hit) => {
        const r = rows[hit.id as number];
        return { label: placeLabel(r), lat: r.lat, lon: r.lon };
      });
  };
}
