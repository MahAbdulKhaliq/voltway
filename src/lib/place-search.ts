// From/To suggestions on the trip planner (route-planner.md §6, B45): an in-browser search over
// the GeoNames places in public/data/places-ca.json and, once loaded, places-us.json (B78, DESIGN-7
// D5). Town names never reach the network; the address service (/api/geocode) is called when the
// visitor presses "Search full address", or for text that reads like a street address (B147).

import MiniSearch from 'minisearch';

/** A row of public/data/places-<cc>.json (short keys). */
export interface PlaceRow { n: string; p: string; lat: number; lon: number; pop: number }

export type PlaceCountry = 'ca' | 'us';

/** A trip end: a label to show and a position; `cc` is its country when known (from a place or address pick). */
export interface TripEnd { label: string; lat: number; lon: number; cc?: PlaceCountry; estimated?: true }

/** "Montréal" → "montreal": accents and case don't matter when matching. */
export const fold = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const placeLabel = (p: PlaceRow): string => `${p.n}, ${p.p}`;

/** Search the places; `prefer` leans results to one country (the trip start's, B78). */
export interface PlaceSearch {
  (query: string, limit?: number, prefer?: PlaceCountry): TripEnd[];
  /** The country of the listed place nearest a point: a good guess for an end without a `cc` (a share link, my location). */
  countryNear: (lat: number, lon: number) => PlaceCountry | null;
  /** B79: the label of the listed place in `cc` nearest a point, within NEAR_PLACE_KM, or null (names a border crossing). */
  placeNear: (lat: number, lon: number, cc: PlaceCountry) => string | null;
}

/**
 * Text that reads like a street address: a house number, then at least three letters of the street
 * ("59 Par…", "600 4th Ave"). Only such text is sent to the address service while typing; town names never are.
 */
export const looksLikeAddress = (q: string): boolean => /^\s*\d{1,6}[a-z]?\s+(?=[^\s,]*[a-z])[^\s,]{3,}/i.test(q);

/**
 * Whether typed text should search addresses by itself (B147): it reads like an address and is not
 * the start of a listed town ("100 Mile House, BC", "108 Mile Ranch" start with numbers too).
 */
export const autoSearchAddress = (q: string, towns: readonly TripEnd[]): boolean => {
  const bare = (s: string) => fold(s).replace(/[\s,]+/g, ' ').trim();
  return looksLikeAddress(q) && !towns.some((p) => bare(p.label).startsWith(bare(q)));
};

/** A border crossing is named after a town on the far side only when one is this close (km). */
export const NEAR_PLACE_KM = 40;

/** Whether the results hold a place with exactly this name ("Spring" → "Spring, TX" yes, "Spring Garden, NS" no). */
export const hasExactName = (results: readonly TripEnd[], query: string): boolean => {
  const q = fold(query.trim().split(',')[0].trim());
  return results.some((r) => fold(r.label.slice(0, r.label.lastIndexOf(','))) === q);
};

/** How much a place in the preferred country counts over one elsewhere. */
const PREFER_BOOST = 1.6;

/** One search over one or more countries' place lists (Canada first). */
export function makePlaceSearch(rows: readonly PlaceRow[], more: readonly { cc: PlaceCountry; rows: readonly PlaceRow[] }[] = []): PlaceSearch {
  const sets = [{ cc: 'ca' as PlaceCountry, rows }, ...more];
  const all = sets.flatMap((s) => s.rows.map((r) => ({ r, cc: s.cc })));
  return makeSearch(all);
}

function makeSearch(all: readonly { r: PlaceRow; cc: PlaceCountry }[]): PlaceSearch {
  const rows = all.map((x) => x.r);
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
  const search = (query: string, limit = 8, prefer?: PlaceCountry): TripEnd[] => {
    const q = query.trim();
    if (!q) return [];
    return ms
      .search(q, { boostDocument: (id) => weight[id as number] * (prefer && all[id as number].cc === prefer ? PREFER_BOOST : 1) })
      .slice(0, limit)
      .map((hit) => {
        const { r, cc } = all[hit.id as number];
        return { label: placeLabel(r), lat: r.lat, lon: r.lon, cc };
      });
  };
  const countryNear = (lat: number, lon: number): PlaceCountry | null => {
    const k = Math.cos((lat * Math.PI) / 180) ** 2;
    let best: PlaceCountry | null = null;
    let bestD = Infinity;
    for (const { r, cc } of all) {
      const d = (r.lat - lat) ** 2 + k * (r.lon - lon) ** 2;
      if (d < bestD) { bestD = d; best = cc; }
    }
    return best;
  };
  const placeNear = (lat: number, lon: number, cc: PlaceCountry): string | null => {
    const k = Math.cos((lat * Math.PI) / 180) ** 2;
    let best: PlaceRow | null = null;
    let bestD = Infinity;
    for (const { r, cc: c } of all) {
      if (c !== cc) continue;
      const d = (r.lat - lat) ** 2 + k * (r.lon - lon) ** 2;
      if (d < bestD) { bestD = d; best = r; }
    }
    return best && Math.sqrt(bestD) * 111 <= NEAR_PLACE_KM ? placeLabel(best) : null;
  };
  return Object.assign(search, { countryNear, placeNear });
}
