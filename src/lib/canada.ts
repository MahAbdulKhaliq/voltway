// "Is this point in Canada?" for the trip function (B74, DESIGN-5 §2.3). The outline is
// Natural Earth's Admin 0 Canada, simplified (scripts/fetch-canada-outline.ts writes
// data/imported/naturalearth/canada.json). Only the function imports the data; browsers never
// download it. Plain maths, no dependencies, so it is easy to test.

/** [lon, lat] rings; the first ring of each polygon is its outside, the rest are holes. */
export type Ring = [number, number][];
export type Outline = Ring[][];

/** An end this close outside the land border still counts as in Canada (border towns, river crossings). */
export const BORDER_SLACK_KM = 0.5;
/**
 * The simplified coast misses headlands and small islands, so an end this close outside the
 * coast counts as in Canada too, but only when it is further than BORDER_ZONE_KM from the land
 * border (so Point Roberts or Blaine stay outside).
 */
export const COAST_SLACK_KM = 3;
export const BORDER_ZONE_KM = 5;

/**
 * North of this latitude Canada's only land neighbour is Alaska, west of the 141st meridian, so
 * the check is that simple rule and the Arctic islands are left out of the outline.
 */
export const NORTH_LAT = 60.5;
export const ALASKA_LON = -141;

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
  const pad = 0.1; // > BORDER_ZONE_KM at any latitude Canada has roads
  return [minX - pad, minY - pad, maxX + pad, maxY + pad];
}

/**
 * Builds the check once (boxes worked out up front), then answers per point.
 * @param border per ring, "1" where the edge from that point to the next is land border
 */
export function makeInCanada(outline: Outline, border: readonly (readonly string[])[] = []): (lon: number, lat: number) => boolean {
  const polys = outline.map((p, k) => ({ p, b: box(p), f: border[k] ?? [] }));
  return (lon, lat) => {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
    if (lat >= NORTH_LAT) return lon >= ALASKA_LON && lat <= 84;
    const near = polys.filter(({ b }) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3]);
    for (const { p } of near) {
      if (inRing(lon, lat, p[0]) && !p.slice(1).some((h) => inRing(lon, lat, h))) return true;
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
    if (toBorder <= BORDER_SLACK_KM) return true;
    return toCoast <= COAST_SLACK_KM && toBorder > BORDER_ZONE_KM;
  };
}
