// Simplifies Natural Earth's Canada outline for the "outside Canada" check (B74, DESIGN-5 §2.3).
// Used by scripts/fetch-canada-outline.ts and by tests.
//
// What matters is the land border with the United States: those points are shared with the US
// outline in Natural Earth, so they are kept almost as they are. The coast only separates land
// from sea, so it is simplified much more. North of NORTH_LAT the check uses a simple rule
// instead (src/lib/canada.ts), so the Arctic islands are dropped.

import { NORTH_LAT, type Outline, type Ring } from '../../src/lib/canada.ts';

/** Douglas–Peucker tolerance in degrees along the US border (~20 m). */
export const BORDER_TOLERANCE_DEG = 0.0002;
/** … and along the coast (~300 m north–south). */
export const COAST_TOLERANCE_DEG = 0.003;

function perpDist(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Douglas–Peucker on an open line (iterative, so long lines don't overflow the stack). */
export function simplifyLine(line: Ring, tol: number): Ring {
  if (line.length <= 2) return line;
  const keep = new Uint8Array(line.length);
  keep[0] = keep[line.length - 1] = 1;
  const stack: [number, number][] = [[0, line.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let max = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(line[i], line[s], line[e]);
      if (d > max) { max = d; idx = i; }
    }
    if (idx !== -1 && max > tol) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return line.filter((_, i) => keep[i]);
}

/**
 * Simplifies a closed ring in runs: points on the border (`isBorder`) with the border tolerance,
 * the rest with the coast tolerance. Run ends are always kept, so the two never drift apart.
 */
export function simplifyRing(ring: Ring, isBorder: (p: [number, number]) => boolean): Ring {
  if (ring.length <= 4) return ring;
  const pts = ring.slice(0, -1); // drop the closing point
  const flags = pts.map(isBorder);
  const out: Ring = [];
  let start = 0;
  for (let i = 1; i <= pts.length; i++) {
    if (i === pts.length || flags[i] !== flags[start]) {
      const run = pts.slice(start, Math.min(i + 1, pts.length)); // overlap one point with the next run
      const s = simplifyLine(run, flags[start] ? BORDER_TOLERANCE_DEG : COAST_TOLERANCE_DEG);
      out.push(...(out.length ? s.slice(1) : s));
      start = i;
    }
  }
  if (out.length < 3) return ring;
  out.push(out[0]);
  return out;
}

const round = (x: number) => Math.round(x * 1e4) / 1e4;

/**
 * Keeps the polygons that reach south of NORTH_LAT, simplified and rounded to 4 decimals (~10 m).
 * `border` has one string per ring: "1" where the edge from that point to the next is land border.
 */
export function simplifyOutline(polys: Ring[][], isBorder: (p: [number, number]) => boolean): { polygons: Outline; border: string[][] } {
  const polygons: Outline = [];
  const border: string[][] = [];
  for (const poly of polys) {
    if (Math.min(...poly[0].map((p) => p[1])) >= NORTH_LAT) continue;
    const rings = poly.map((r) => simplifyRing(r, isBorder));
    polygons.push(rings.map((r) => r.map(([x, y]) => [round(x), round(y)] as [number, number])));
    border.push(rings.map((r) => r.map((p, i) => (i < r.length - 1 && isBorder(p) && isBorder(r[i + 1]) ? '1' : '0')).join('')));
  }
  return { polygons, border };
}
