// Pin and cluster marks for the charger map (charger-map.md §5, B54). A bolt for Level 3 and a
// plug for Level 2, so the level never depends on colour alone. A temporarily unavailable
// station gets a grey pin with a small "!" mark (bottom right).
//
// B54/B55 (2026-11-17) add what a driver wants at a glance:
// - Clusters: a dark disc with a pale count; the ring around it is split into a yellow Level 3 arc
//   (from 12 o'clock, clockwise) and a white Level 2 arc, in proportion to the counts (B55).
// - Speed bolts, top right, from the fastest known Level 3 port: 1 (≤ 75 kW), 2 (≤ 150), 3 (more).
// - Plug marks: tiny line drawings of the plugs present, stacked left of the mark.
//   Tags show only from TAG_MIN_ZOOM in, on groups of any size and on pins (B58; was a group-size limit).
// - Tesla network pins (B55): a Tesla-style T instead of the bolt or plug; Superchargers are red.
// - While a trip shows, every mark is drawn in greys so yellow on the map means the trip.
//
// Each mark is one canvas image, drawn when MapLibre first asks for it (styleimagemissing). Its
// name ("mk-…", see markName/parseMarkName) says everything needed to draw it. The same shapes
// draw the map key and the plug list (inline SVG), on a 24-unit grid.

import type { ChargerLevel, Plug } from './power-bands.ts';

// Road Paint (DESIGN-4, 4.5): fast chargers are centre-line yellow, slow ones road-marking white,
// both with a dark glyph and a dark ring so they read on the asphalt and the concrete map.
export const PIN = {
  /** Fill per level; dark glyph on top (≥ 4.5:1 on every fill, checked in tests/contrast). */
  fill: { 3: '#FFD400', 2: '#F5F3EC' } as Record<ChargerLevel, string>,
  /** Tesla Supercharger pins (B55): red, with a white T. Tesla Level 2 pins stay white, with a red T. */
  tesla: '#E82127',
  teslaGlyph: '#FFFFFF',
  /** The same, while a trip shows (B54): greys, so the trip is the only yellow on the map. */
  tripFill: { 3: '#8A8980', 2: '#C4C2BA' } as Record<ChargerLevel, string>,
  unavailable: '#8A8980',
  glyph: '#1A1B1E',
  ring: '#1A1B1E',
  /** The "!" mark on a temporarily unavailable station: construction orange, the warning colour. */
  badge: '#FF7A1A',
  badgeMark: '#1A1B1E',
} as const;

/** Clusters, the small tags on marks, and the ring under a selected charger. */
export const MAP_MARK = {
  /** The cluster's centre and its outer edge (B55): dark, so the count is pale. */
  clusterRing: '#1A1B1E',
  clusterText: '#F5F3EC',
  /** The speed and plug tags: dark, with yellow bolts and pale plug drawings. */
  tag: '#1A1B1E',
  tagEdge: '#F5F3EC',
  tagBolt: '#FFD400',
  tagBoltTrip: '#C4C2BA',
  tagPlug: '#F5F3EC',
  selectedFill: '#F5F3EC',
  selectedRing: '#1A1B1E',
} as const;

/** Bolt, filled. */
export const BOLT = 'M13.5 3 6 13.5h5L10 21l8-11h-5.2L13.5 3Z';
/** A Tesla-style T (B55): a thin arc over a T with a curved bar, filled. */
export const TESLA_T =
  'M12 20.6 9.8 8.7c-1.9 0-3.7.3-5.4.9.3-.9.9-1.6 1.7-2.1C7.9 6.6 9.9 6.3 12 6.3s4.1.3 5.9 1.2c.8.5 1.4 1.2 1.7 2.1-1.7-.6-3.5-.9-5.4-.9L12 20.6ZM4.1 5.5C6.5 4.2 9.2 3.5 12 3.5s5.5.7 7.9 2l-.5.9C17.1 5.2 14.6 4.6 12 4.6s-5.1.6-7.4 1.8l-.5-.9Z';
/** Plug: two prongs, body and cable, stroked. */
export const PLUG = 'M9.5 4v4M14.5 4v4M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5';

/** A plug drawing on the 24 grid: an outline (stroked) and its pins (filled dots [x, y, r]). */
export interface PlugShape { outline: string; dots: readonly (readonly [number, number, number])[] }

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/** Line drawings of each plug's face, simplified so the outline alone tells them apart. */
export const PLUG_SHAPES: Record<Plug, PlugShape> = {
  // J1772: a round face, two pins over one.
  j1772: { outline: circle(12, 12, 9), dots: [[8.6, 9.8, 1.8], [15.4, 9.8, 1.8], [12, 15.6, 1.8]] },
  // CCS1: the J1772 head with the two DC pins in a block underneath.
  ccs1: { outline: `${circle(12, 8, 6.2)}M6.5 15.6h11v6.2h-11Z`, dots: [[9.6, 7, 1.3], [14.4, 7, 1.3], [9.4, 18.7, 1.5], [14.6, 18.7, 1.5]] },
  // CHAdeMO: a round face with two big pins side by side.
  chademo: { outline: circle(12, 12, 9), dots: [[7.9, 12, 2.5], [16.1, 12, 2.5], [12, 7.4, 1.1], [12, 16.6, 1.1]] },
  // NACS (SAE J3400, B55): a wide rounded top tapering to a rounded bottom; two large pins side
  // by side near the top, the ground pin low in the middle and two small signal pins beside it.
  nacs: {
    outline: 'M5.5 4.2C9 3.4 15 3.4 18.5 4.2C21 4.8 22 6.5 21.6 9C21 12.5 18.5 16.8 15.6 19C13.4 20.6 10.6 20.6 8.4 19C5.5 16.8 3 12.5 2.4 9C2 6.5 3 4.8 5.5 4.2Z',
    dots: [[7.7, 8.7, 2.7], [16.3, 8.7, 2.7], [12, 16.3, 1.5], [8.9, 15.2, 0.8], [15.1, 15.2, 0.8]],
  },
};

/** Order of plugs in a stack and their bit in a mark's plug mask. */
export const PLUG_ORDER: readonly Plug[] = ['ccs1', 'nacs', 'chademo', 'j1772'];
export const plugBit = (p: Plug) => 1 << PLUG_ORDER.indexOf(p);
export const plugsInMask = (mask: number) => PLUG_ORDER.filter((p) => mask & plugBit(p));

/** Speed bolts from the fastest known Level 3 kW: 0 (none / unknown), 1 (≤ 75), 2 (≤ 150), 3 (more). */
export const SPEED_LIMITS = [75, 150] as const;
export function speedTier(kw: number | null | undefined): 0 | 1 | 2 | 3 {
  if (kw == null || !Number.isFinite(kw) || kw <= 0) return 0;
  return kw <= SPEED_LIMITS[0] ? 1 : kw <= SPEED_LIMITS[1] ? 2 : 3;
}

/** The Level 3 share of a cluster in tenths (0 = all Level 2, 10 = all Level 3). A mix never
 *  rounds to 0 or 10, so a single station of the other level still shows. */
export function levelShare(l2: number, l3: number): number {
  if (l3 <= 0) return 0;
  if (l2 <= 0) return 10;
  return Math.min(9, Math.max(1, Math.round((10 * l3) / (l2 + l3))));
}

/** The two arcs of a cluster's ring (B55), in radians, starting at 12 o'clock and going clockwise:
 *  Level 3 first, then Level 2, in proportion to the share (tenths of Level 3). A small gap
 *  separates them when both are present; null for a level with no chargers. */
export const RING_GAP = 0.14;
export function ringArcs(share: number): { l3: [number, number] | null; l2: [number, number] | null } {
  const top = -Math.PI / 2;
  const full = Math.PI * 2;
  if (share <= 0) return { l3: null, l2: [top, top + full] };
  if (share >= 10) return { l3: [top, top + full], l2: null };
  const split = top + (full * share) / 10;
  return { l3: [top + RING_GAP / 2, split - RING_GAP / 2], l2: [split + RING_GAP / 2, top + full - RING_GAP / 2] };
}

/** Speed and plug tags show from this zoom in (B58): the zoomed-out map stays calm, and a big
 *  station with many stalls still gets its tags once you're close. */
export const TAG_MIN_ZOOM = 9;

/** Cluster disc radius (CSS px) per size step; the step comes from the station count. */
export const CLUSTER_RADIUS = [14, 18, 22, 27] as const;
export const CLUSTER_STEPS = [25, 100, 500] as const;
export const PIN_RADIUS = 13;

export interface MarkSpec {
  kind: 'cluster' | 'pin';
  /** cluster: size step 0–3 */
  size: number;
  /** cluster: Level 3 share in tenths; pin: 0 for Level 2, 10 for Level 3 */
  share: number;
  unavailable: boolean;
  tier: number;
  plugs: number;
  trip: boolean;
  /** pin: a Tesla network station (B55) */
  tesla: boolean;
}

export const markName = (m: MarkSpec) =>
  `mk-${m.kind === 'cluster' ? 'c' : 'p'}${m.size}-${m.share}-${m.unavailable ? 1 : 0}-${m.tier}-${m.plugs}-${m.trip ? 1 : 0}-${m.tesla ? 1 : 0}`;

export function parseMarkName(id: string): MarkSpec | null {
  const m = /^mk-([cp])(\d)-(\d{1,2})-([01])-([0-3])-(\d{1,2})-([01])-([01])$/.exec(id);
  if (!m) return null;
  return {
    kind: m[1] === 'c' ? 'cluster' : 'pin',
    size: Number(m[2]),
    share: Number(m[3]),
    unavailable: m[4] === '1',
    tier: Number(m[5]),
    plugs: Number(m[6]),
    trip: m[7] === '1',
    tesla: m[8] === '1',
  };
}

// MapLibre expressions that build the same names from a feature's properties. Pins carry
// lv, t, k (top known Level 3 kW, 0 if none) and pc/pn/pd/pj (plug flags, 0 or 1); clusters carry
// n2, n3 (station counts per level) and the max of k and of each plug flag (clusterProperties).
type Expr = unknown[];
const tierExpr: Expr = ['step', ['get', 'k'], 0, 0.001, 1, SPEED_LIMITS[0] + 0.001, 2, SPEED_LIMITS[1] + 0.001, 3];
const maskExpr: Expr = ['+', ['get', 'pc'], ['*', 2, ['get', 'pn']], ['*', 4, ['get', 'pd']], ['*', 8, ['get', 'pj']]];
const shareExpr: Expr = [
  'case',
  ['<=', ['get', 'n3'], 0], 0,
  ['<=', ['get', 'n2'], 0], 10,
  ['max', 1, ['min', 9, ['round', ['/', ['*', 10, ['get', 'n3']], ['+', ['get', 'n2'], ['get', 'n3']]]]]],
];

const clusterName = (trip: boolean, tags: boolean): Expr => [
  'concat', 'mk-c',
  ['step', ['get', 'point_count'], 0, CLUSTER_STEPS[0], 1, CLUSTER_STEPS[1], 2, CLUSTER_STEPS[2], 3],
  '-', shareExpr, '-0-', tags ? tierExpr : 0, '-', tags ? maskExpr : 0, trip ? '-1' : '-0', '-0',
];
const pinName = (trip: boolean, tags: boolean): Expr => [
  'concat', 'mk-p0-',
  ['case', ['==', ['get', 'lv'], 3], 10, 0],
  '-', ['case', ['has', 't'], 1, 0],
  '-', tags ? ['case', ['==', ['get', 'lv'], 3], tierExpr, 0] : 0,
  '-', tags ? maskExpr : 0, trip ? '-1' : '-0',
  '-', ['case', ['==', ['get', 'te'], 1], 1, 0],
];
// A zoom step must be the outermost expression in a layout property (MapLibre rule).
export const clusterImage = (trip: boolean): Expr => ['step', ['zoom'], clusterName(trip, false), TAG_MIN_ZOOM, clusterName(trip, true)];
export const pinImage = (trip: boolean): Expr => ['step', ['zoom'], pinName(trip, false), TAG_MIN_ZOOM, pinName(trip, true)];

/** What clusters add up from their pins (MapLibre clusterProperties). */
export const CLUSTER_PROPERTIES = {
  n2: ['+', ['case', ['==', ['get', 'lv'], 2], 1, 0]],
  n3: ['+', ['case', ['==', ['get', 'lv'], 3], 1, 0]],
  k: ['max', ['get', 'k']],
  pc: ['max', ['get', 'pc']],
  pn: ['max', ['get', 'pn']],
  pd: ['max', ['get', 'pd']],
  pj: ['max', ['get', 'pj']],
};

// ---- Drawing (browser only) ----

const PLUG_PX = 9; // one plug drawing in a tag
const BOLT_W = 7, BOLT_H = 10, BOLT_STEP = 4.2; // packed bolts overlap

interface Rect { x: number; y: number; w: number; h: number }

/** Where the two tags sit, relative to the mark's centre (CSS px). */
export function tagRects(r: number, tier: number, plugCount: number): { speed: Rect | null; plugs: Rect | null } {
  const speed = tier > 0 ? { w: BOLT_W + (tier - 1) * BOLT_STEP + 4, h: BOLT_H + 4 } : null;
  const plugs = plugCount > 0 ? { w: PLUG_PX + 4, h: plugCount * PLUG_PX + (plugCount - 1) + 4 } : null;
  return {
    // Speed: on the top-right edge of the disc.
    speed: speed && { x: r * 0.45, y: -r * 0.55 - speed.h, ...speed },
    // Plugs: beside the disc on the left, from its top down, so the split stays clear.
    plugs: plugs && { x: -r - plugs.w + 1.5, y: -r * 0.85, ...plugs },
  };
}

function roundRect(g: CanvasRenderingContext2D, { x, y, w, h }: Rect, rad: number) {
  g.beginPath();
  g.moveTo(x + rad, y);
  g.arcTo(x + w, y, x + w, y + h, rad);
  g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad);
  g.arcTo(x, y, x + w, y, rad);
  g.closePath();
}

function drawPlug(g: CanvasRenderingContext2D, p: Plug, x: number, y: number, px: number, colour: string) {
  const s = PLUG_SHAPES[p];
  g.save();
  g.translate(x, y);
  g.scale(px / 24, px / 24);
  g.strokeStyle = colour;
  g.fillStyle = colour;
  g.lineWidth = 2.6;
  g.lineJoin = 'round';
  g.stroke(new Path2D(s.outline));
  for (const [cx, cy, cr] of s.dots) {
    g.beginPath();
    g.arc(cx, cy, cr, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

function drawBolt(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, edge: string) {
  g.save();
  g.translate(x, y);
  g.scale(w / 12, h / 18); // BOLT spans about x 6–18, y 3–21 on the 24 grid
  g.translate(-6, -3);
  const p = new Path2D(BOLT);
  g.lineWidth = 2.2;
  g.lineJoin = 'round';
  g.strokeStyle = edge;
  g.stroke(p);
  g.fillStyle = fill;
  g.fill(p);
  g.restore();
}

/** Draws one mark into ImageData at `ratio` × its CSS size. The image is centred on the disc. */
export function drawMark(m: MarkSpec, ratio = 2): { image: ImageData; size: number } {
  const r = m.kind === 'cluster' ? CLUSTER_RADIUS[Math.min(3, m.size)] : PIN_RADIUS;
  const plugs = plugsInMask(m.plugs);
  const tags = tagRects(r, m.tier, plugs.length);
  let half = r + 1;
  for (const t of [tags.speed, tags.plugs]) if (t) half = Math.max(half, -t.x, t.x + t.w, -t.y, t.y + t.h);
  if (m.unavailable) half = Math.max(half, r * 0.62 + 6.5);
  half = Math.ceil(half + 1);
  const size = half * 2;
  const c = document.createElement('canvas');
  c.width = c.height = size * ratio;
  const g = c.getContext('2d')!;
  g.scale(ratio, ratio);
  g.translate(half, half);
  const fills = m.trip ? PIN.tripFill : PIN.fill;

  // Disc and ring.
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.fillStyle = MAP_MARK.clusterRing;
  g.fill();
  const inner = r - 2;
  if (m.kind === 'pin') {
    const level3 = m.share >= 10;
    g.beginPath();
    g.arc(0, 0, inner, 0, Math.PI * 2);
    g.fillStyle = m.unavailable
      ? PIN.unavailable
      : m.tesla && level3 && !m.trip
        ? PIN.tesla
        : fills[level3 ? 3 : 2];
    g.fill();
    // Glyph: the 24 grid scaled to 16 px.
    g.save();
    g.translate(-8, -8);
    g.scale(16 / 24, 16 / 24);
    if (m.tesla) {
      g.fillStyle = level3 && !m.trip && !m.unavailable ? PIN.teslaGlyph : m.trip || m.unavailable ? PIN.glyph : PIN.tesla;
      const tee = new Path2D(TESLA_T);
      g.fill(tee);
      // 4.17: the thin arc was faint at pin size (red on white); an outline in the same colour thickens it.
      g.strokeStyle = g.fillStyle;
      g.lineWidth = 1.1;
      g.lineJoin = 'round';
      g.stroke(tee);
    } else if (level3) {
      g.fillStyle = PIN.glyph;
      g.fill(new Path2D(BOLT));
    } else {
      g.strokeStyle = PIN.glyph;
      g.lineWidth = 2.4;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.stroke(new Path2D(PLUG));
    }
    g.restore();
  } else {
    // B55: the ring carries the split; the centre stays dark for the pale count.
    const band = Math.max(4, Math.round(r * 0.3));
    const at = r - 1 - band / 2;
    const arcs = ringArcs(m.share);
    g.lineWidth = band;
    g.lineCap = 'butt';
    for (const [lv, a] of [[3, arcs.l3], [2, arcs.l2]] as const) {
      if (!a) continue;
      g.beginPath();
      g.arc(0, 0, at, a[0], a[1]);
      g.strokeStyle = fills[lv];
      g.stroke();
    }
  }

  // Speed tag, top right: packed bolts.
  if (tags.speed) {
    roundRect(g, tags.speed, 4);
    g.fillStyle = MAP_MARK.tag;
    g.fill();
    g.strokeStyle = MAP_MARK.tagEdge;
    g.lineWidth = 1;
    g.stroke();
    for (let i = 0; i < m.tier; i++) {
      drawBolt(g, tags.speed.x + 2 + i * BOLT_STEP, tags.speed.y + 2, BOLT_W, BOLT_H, m.trip ? MAP_MARK.tagBoltTrip : MAP_MARK.tagBolt, MAP_MARK.tag);
    }
  }
  // Plug tag, top left: one drawing per plug, stacked.
  if (tags.plugs) {
    roundRect(g, tags.plugs, 4);
    g.fillStyle = MAP_MARK.tag;
    g.fill();
    g.strokeStyle = MAP_MARK.tagEdge;
    g.lineWidth = 1;
    g.stroke();
    plugs.forEach((p, i) => drawPlug(g, p, tags.plugs!.x + 2, tags.plugs!.y + 2 + i * (PLUG_PX + 1), PLUG_PX, MAP_MARK.tagPlug));
  }
  // Unavailable: an orange "!" badge, bottom right.
  if (m.unavailable) {
    const at = r * 0.62;
    g.beginPath();
    g.arc(at, at, 5.5, 0, Math.PI * 2);
    g.fillStyle = PIN.badge;
    g.fill();
    g.strokeStyle = PIN.ring;
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = PIN.badgeMark;
    g.fillRect(at - 0.75, at - 3, 1.5, 4);
    g.fillRect(at - 0.75, at + 2, 1.5, 1.5);
  }
  return { image: g.getImageData(0, 0, c.width, c.height), size };
}
