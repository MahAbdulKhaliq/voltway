// "Which country is this point in?" for the trip function: a trip stays in the country it starts in
// (B74, generalised to Canada and the US by B78, DESIGN-7 D4). The outlines are Natural Earth's
// Admin 0 Canada and US, simplified (scripts/fetch-outlines.ts writes
// data/imported/naturalearth/{ca,us}.json). Only the function imports the data; browsers never
// download it. Plain maths, no dependencies, so it is easy to test.

/** [lon, lat] rings; the first ring of each polygon is its outside, the rest are holes. */
export type Ring = [number, number][];
export type Outline = Ring[][];
export type CountryCode = 'ca' | 'us';

/** An end this close outside the land border still counts as in the country (border towns, river crossings). */
export const BORDER_SLACK_KM = 0.5;
/**
 * The simplified coast misses headlands and small islands, so an end this close outside the
 * coast counts as in the country too, but only when it is further than BORDER_ZONE_KM from the land
 * border (so Point Roberts or Blaine stay outside Canada).
 */
export const COAST_SLACK_KM = 3;
export const BORDER_ZONE_KM = 5;

/**
 * North of this latitude the only land border is Canada–Alaska, on the 141st meridian, so the check
 * is that simple rule and the Arctic islands are left out of the outlines.
 */
export const NORTH_LAT = 60.5;
export const ALASKA_LON = -141;

/** The simple rule north of NORTH_LAT, per country. */
const NORTH_RULE: Record<CountryCode, (lon: number, lat: number) => boolean> = {
  ca: (lon, lat) => lon >= ALASKA_LON && lat <= 84,
  // Alaska, including the islands west of the 180th meridian (Aleutians are south of NORTH_LAT anyway).
  us: (lon, lat) => (lon < ALASKA_LON || lon > 170) && lat <= 72,
};

const KM_PER_DEG_LAT = 111.32;

function inRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Distance in km from a point to a segment, on a flat local projection (fine at sub-km scale). */
function segmentKm(lon: number, lat: number, a: [number, number], b: [number, number]): number {
  const kx = KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
  const ax = (a[0] - lon) * kx, ay = (a[1] - lat) * KM_PER_DEG_LAT;
  const bx = (b[0] - lon) * kx, by = (b[1] - lat) * KM_PER_DEG_LAT;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

/** Bounding box of a polygon's outside ring, widened by the slack. */
function box(poly: Ring[]): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of poly[0]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const pad = 0.1; // > BORDER_ZONE_KM at any latitude with roads
  return [minX - pad, minY - pad, maxX + pad, maxY + pad];
}

/** 2 = inside the outline (or the north rule), 1 = only within the border or coast slack, 0 = outside. */
export type Placement = 0 | 1 | 2;

/**
 * Builds the check for one country once (boxes worked out up front), then answers per point.
 * @param border per ring, "1" where the edge from that point to the next is land border
 */
export function makePlacement(country: CountryCode, outline: Outline, border: readonly (readonly string[])[] = []): (lon: number, lat: number) => Placement {
  const polys = outline.map((p, k) => ({ p, b: box(p), f: border[k] ?? [] }));
  const north = NORTH_RULE[country];
  return (lon, lat) => {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return 0;
    if (lat >= NORTH_LAT) return north(lon, lat) ? 2 : 0;
    const near = polys.filter(({ b }) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3]);
    for (const { p } of near) {
      if (inRing(lon, lat, p[0]) && !p.slice(1).some((h) => inRing(lon, lat, h))) return 2;
    }
    let toBorder = Infinity, toCoast = Infinity;
    for (const { p, f } of near) {
      p.forEach((ring, r) => {
        for (let i = 1; i < ring.length; i++) {
          const d = segmentKm(lon, lat, ring[i - 1], ring[i]);
          if (f[r]?.[i - 1] === '1') toBorder = Math.min(toBorder, d);
          else toCoast = Math.min(toCoast, d);
        }
      });
    }
    if (toBorder <= BORDER_SLACK_KM) return 1;
    return toCoast <= COAST_SLACK_KM && toBorder > BORDER_ZONE_KM ? 1 : 0;
  };
}

/** "Is this point in Canada?" (B74): inside the outline or within its slack. */
export function makeInCanada(outline: Outline, border: readonly (readonly string[])[] = []): (lon: number, lat: number) => boolean {
  const place = makePlacement('ca', outline, border);
  return (lon, lat) => place(lon, lat) > 0;
}

export interface CountryOutline { polygons: Outline; border: readonly (readonly string[])[] }

/**
 * Every country a point may be in (B78): inside its outline or within its border or coast slack.
 * A border town can be in both: Natural Earth's line is ~100 m off in places (Stanstead QC lands
 * in the US), so the trip rule asks whether start and end share a country, not for one answer.
 */
export function makeCountriesOf(outlines: Record<CountryCode, CountryOutline>): (lon: number, lat: number) => CountryCode[] {
  const ca = makePlacement('ca', outlines.ca.polygons, outlines.ca.border);
  const us = makePlacement('us', outlines.us.polygons, outlines.us.border);
  return (lon, lat) => {
    const out: CountryCode[] = [];
    if (ca(lon, lat) > 0) out.push('ca');
    if (us(lon, lat) > 0) out.push('us');
    return out;
  };
}

/**
 * Which country a point is in (B78): Canada, the US, or neither. A point inside one outline wins
 * over a point only within the other's border slack, so a border town lands in its own country.
 */
export function makeCountryOf(outlines: Record<CountryCode, CountryOutline>): (lon: number, lat: number) => CountryCode | null {
  const ca = makePlacement('ca', outlines.ca.polygons, outlines.ca.border);
  const us = makePlacement('us', outlines.us.polygons, outlines.us.border);
  return (lon, lat) => {
    const c = ca(lon, lat), u = us(lon, lat);
    if (c === 0 && u === 0) return null;
    // Both only within slack happens on a border river or bridge; either answer is fair there.
    return c >= u ? 'ca' : 'us';
  };
}

/**
 * The part of the US a point is in (B78, DESIGN-7 D4). The Lower 48 and Alaska are only joined by
 * roads through Canada, so a trip between them crosses the border. Hawaii and the territories have
 * no road to anywhere else, which the router reports itself.
 */
export type UsPart = 'lower48' | 'alaska' | 'islands';
export function usPart(lon: number, lat: number): UsPart {
  // The Lower 48 reach 49.4° N (Northwest Angle); Alaska's southernmost land (the Aleutians, the
  // panhandle) is near 51° N and 54.6° N.
  if (lat >= 50 || lon > 170) return 'alaska';
  if (lat < 25 && (lon < -154 || lon > -68)) return 'islands'; // Hawaii; Puerto Rico and the Virgin Islands; Guam
  return 'lower48';
}

/**
 * Where a trip end may be at all (lon, lat): North America from Hawaii and Alaska to Newfoundland,
 * and Guam and the Northern Marianas (B78). A loose first check for /api/route and share links;
 * the outlines then decide the country (src/lib/ors.ts borderProblem).
 */
export const SERVICE_AREAS = [
  { minLon: -180, maxLon: -50, minLat: 10, maxLat: 84 },
  { minLon: 144, maxLon: 146, minLat: 13, maxLat: 21 },
] as const;

export const inServiceArea = (lon: number, lat: number): boolean =>
  SERVICE_AREAS.some((a) => lon >= a.minLon && lon <= a.maxLon && lat >= a.minLat && lat <= a.maxLat);
