// The route drawn on the charger map (B50, 3.18; route-planner.md §7): the route line on a white
// casing, any charging gap as a dashed red stretch, numbered stop pins, and the start and end.
// While a route shows, the charger pins and clusters turn grey and fade so the route stands out
// (B54: the trip is the only yellow on the map).

import type maplibregl from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { TRIP_MAP } from './trip-map-style.ts';
import { clusterImage, pinImage, TAG_ALWAYS_ZOOM } from './map-icons.ts';

export interface TripOverlay {
  line: [number, number][];
  gaps: [number, number][][];
  from: [number, number];
  to: [number, number];
  /** Stop positions, in order (the pins are numbered 1, 2, …). */
  stops: [number, number][];
  /** The selected stop's index, ringed. */
  selected: number | null;
}

/** How much the charger pins and clusters fade while a route shows (QS15). */
export const FADED_OPACITY = 0.35;

const lineFC = (coords: [number, number][]): FeatureCollection<LineString> => ({
  type: 'FeatureCollection',
  features: coords.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }] : [],
});

const gapFC = (gaps: [number, number][][]): FeatureCollection<LineString> => ({
  type: 'FeatureCollection',
  features: gaps.filter((g) => g.length > 1).map((coordinates, i) => ({ type: 'Feature', properties: { i }, geometry: { type: 'LineString', coordinates } })),
});

/** The painted line: solid up to progress `p` (0–1 along the line), clear after it. */
const paintTo = (p: number, color: string): maplibregl.ExpressionSpecification =>
  p >= 1
    ? ['interpolate', ['linear'], ['line-progress'], 0, color, 1, color]
    : ['step', ['line-progress'], color, Math.max(p, 0.000001), 'rgba(0, 0, 0, 0)'];
/** Gaps shown: the first `n` (all of them once the paint is done). */
const gapsShown = (n: number) => ['<', ['get', 'i'], n] as maplibregl.FilterSpecification;
/** Point size at scale `s` (1 = full size; the paint pops stops in). */
const sized = (r: number): maplibregl.ExpressionSpecification => ['*', r, ['coalesce', ['get', 's'], 1]];
/** A point is drawn once its scale is above zero (a ring at radius 0 would still show). */
const shown: maplibregl.ExpressionSpecification = ['min', 1, ['*', 4, ['coalesce', ['get', 's'], 1]]];
const GAP_LAYERS = ['trip-gap-edge', 'trip-gap-band', 'trip-gap'];
const ALL = 1e9;

export function pointFC(o: TripOverlay | null): FeatureCollection<Point> {
  if (!o) return { type: 'FeatureCollection', features: [] };
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { kind: 'from', label: '' }, geometry: { type: 'Point', coordinates: o.from } },
      { type: 'Feature', properties: { kind: 'to', label: '' }, geometry: { type: 'Point', coordinates: o.to } },
      ...o.stops.map((at, i): Feature<Point> => ({ type: 'Feature', properties: { kind: 'stop', i, label: String(i + 1) }, geometry: { type: 'Point', coordinates: at } })),
    ],
  };
}

const selFilter = (i: number | null) => ['all', ['==', ['get', 'kind'], 'stop'], ['==', ['get', 'i'], i ?? -1]] as maplibregl.FilterSpecification;

/** West, south, east, north around a line. */
export function boundsOf(coords: readonly [number, number][]): [number, number, number, number] {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [x, y] of coords) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
  return [w, s, e, n];
}

/** The layers a click on a stop hits. */
export const STOP_LAYERS = ['trip-stops', 'trip-stop-labels'];

/** Adds the trip's sources and layers on top of the charger pins. Safe after every style load. */
export function addTripLayers(map: maplibregl.Map, o: TripOverlay | null) {
  if (map.getSource('trip-line')) return;
  map.addSource('trip-line', { type: 'geojson', data: lineFC(o?.line ?? []), lineMetrics: true });
  map.addSource('trip-head', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addSource('trip-gaps', { type: 'geojson', data: gapFC(o?.gaps ?? []) });
  map.addSource('trip-points', { type: 'geojson', data: pointFC(o) });
  map.addLayer({ id: 'trip-casing', type: 'line', source: 'trip-line', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-gradient': paintTo(1, TRIP_MAP.band), 'line-width': 12 } });
  map.addLayer({ id: 'trip-route', type: 'line', source: 'trip-line', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-gradient': paintTo(1, TRIP_MAP.route), 'line-width': 4.5 } });
  // A charging gap: an orange-edged band covers the solid line, then the yellow is repainted as dashes.
  map.addLayer({ id: 'trip-gap-edge', type: 'line', source: 'trip-gaps', filter: gapsShown(ALL), layout: { 'line-cap': 'butt' }, paint: { 'line-color': TRIP_MAP.gapEdge, 'line-width': 14 } });
  map.addLayer({ id: 'trip-gap-band', type: 'line', source: 'trip-gaps', filter: gapsShown(ALL), layout: { 'line-cap': 'butt' }, paint: { 'line-color': TRIP_MAP.band, 'line-width': 9 } });
  map.addLayer({ id: 'trip-gap', type: 'line', source: 'trip-gaps', filter: gapsShown(ALL), layout: { 'line-cap': 'butt' }, paint: { 'line-color': TRIP_MAP.route, 'line-width': 4.5, 'line-dasharray': [2, 1.6] } });
  map.addLayer({
    id: 'trip-selected', type: 'circle', source: 'trip-points', filter: selFilter(o?.selected ?? null),
    paint: { 'circle-radius': sized(19), 'circle-color': TRIP_MAP.selectedFill, 'circle-stroke-color': TRIP_MAP.selectedRing, 'circle-stroke-width': 3 },
  });
  map.addLayer({
    id: 'trip-ends', type: 'circle', source: 'trip-points', filter: ['!=', ['get', 'kind'], 'stop'],
    paint: { 'circle-radius': sized(8), 'circle-color': ['match', ['get', 'kind'], 'from', TRIP_MAP.start, TRIP_MAP.end], 'circle-stroke-color': ['match', ['get', 'kind'], 'from', TRIP_MAP.startRing, TRIP_MAP.endRing], 'circle-stroke-width': 3 },
  });
  map.addLayer({
    id: 'trip-stops', type: 'circle', source: 'trip-points', filter: ['==', ['get', 'kind'], 'stop'],
    paint: { 'circle-radius': sized(13), 'circle-color': TRIP_MAP.stop, 'circle-stroke-color': TRIP_MAP.stopRing, 'circle-stroke-width': 2 },
  });
  map.addLayer({
    id: 'trip-stop-labels', type: 'symbol', source: 'trip-points', filter: ['==', ['get', 'kind'], 'stop'],
    layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': sized(13), 'text-allow-overlap': true, 'text-ignore-placement': true },
    paint: { 'text-color': TRIP_MAP.stopText, 'text-opacity': shown },
  });
  // The brush head while the line paints itself (paintTrip): a yellow nib on a soft halo.
  map.addLayer({ id: 'trip-head-halo', type: 'circle', source: 'trip-head', paint: { 'circle-radius': 16, 'circle-color': TRIP_MAP.route, 'circle-opacity': 0.25, 'circle-blur': 0.7 } });
  map.addLayer({ id: 'trip-head', type: 'circle', source: 'trip-head', paint: { 'circle-radius': 6, 'circle-color': TRIP_MAP.route, 'circle-stroke-color': TRIP_MAP.band, 'circle-stroke-width': 2 } });
  for (const id of ['trip-selected', 'trip-ends', 'trip-stops']) {
    map.setPaintProperty(id, 'circle-opacity', shown);
    map.setPaintProperty(id, 'circle-stroke-opacity', shown);
  }
  fadePins(map, o !== null);
}

/** Puts a route on the map (or clears it with null), and fades or restores the charger pins. */
export function setTripOverlay(map: maplibregl.Map, o: TripOverlay | null) {
  if (!map.getSource('trip-line')) { addTripLayers(map, o); return; }
  if (!o) cancelPaint(map);
  (map.getSource('trip-line') as maplibregl.GeoJSONSource).setData(lineFC(o?.line ?? []));
  (map.getSource('trip-gaps') as maplibregl.GeoJSONSource).setData(gapFC(o?.gaps ?? []));
  (map.getSource('trip-points') as maplibregl.GeoJSONSource).setData(pointFC(o));
  map.setFilter('trip-selected', selFilter(o?.selected ?? null));
  fadePins(map, o !== null);
}

// Per map: whether the marks are greyed for a trip, and the zoom tags start at (B82, see tagsFit).
const markState = new WeakMap<maplibregl.Map, { faded: boolean; tagsFrom: number }>();
const stateOf = (map: maplibregl.Map) => markState.get(map) ?? { faded: false, tagsFrom: TAG_ALWAYS_ZOOM };

/** The zoom the speed and plug tags start at on this map now. */
export const tagsFrom = (map: maplibregl.Map) => stateOf(map).tagsFrom;

function applyMarkImages(map: maplibregl.Map) {
  const { faded, tagsFrom: z } = stateOf(map);
  if (map.getLayer('pins')) map.setLayoutProperty('pins', 'icon-image', pinImage(faded, z) as maplibregl.ExpressionSpecification);
  if (map.getLayer('clusters')) map.setLayoutProperty('clusters', 'icon-image', clusterImage(faded, z) as maplibregl.ExpressionSpecification);
}

/** Moves where the tags start (TAG_MIN_ZOOM when they fit on screen, else TAG_ALWAYS_ZOOM). */
export function setTagsFrom(map: maplibregl.Map, z: number) {
  const s = stateOf(map);
  if (s.tagsFrom === z) return;
  markState.set(map, { ...s, tagsFrom: z });
  applyMarkImages(map);
}

/** Greys and fades the charger pins and clusters while a route shows; restores them after. */
export function fadePins(map: maplibregl.Map, faded: boolean) {
  const k = faded ? FADED_OPACITY : 1;
  markState.set(map, { ...stateOf(map), faded });
  applyMarkImages(map);
  if (map.getLayer('pins')) map.setPaintProperty('pins', 'icon-opacity', k);
  if (map.getLayer('clusters')) map.setPaintProperty('clusters', 'icon-opacity', k);
  if (map.getLayer('cluster-count')) map.setPaintProperty('cluster-count', 'text-opacity', k);
  // The ring under a selected charger stays at full strength, so the open station is easy to find.
}

// ── The paint (overdrive "Night Drive", B64): a new trip draws itself along the road ─────────────
// The line is revealed by a moving cut in its gradient (no geometry is re-sent per frame), a brush
// head rides the cut, each stop pops in as the paint reaches it, a charging gap's dashes appear once
// the paint has crossed it, and the destination lands last. Reduced motion skips all of it.

/** Distances along a line, scaled for latitude so they match the map's own line-progress. */
function measure(line: readonly [number, number][]): number[] {
  const cum = [0];
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1];
    const [x1, y1] = line[i];
    const k = Math.cos((((y0 + y1) / 2) * Math.PI) / 180);
    cum.push(cum[i - 1] + Math.hypot((x1 - x0) * k, y1 - y0));
  }
  return cum;
}

/** Fraction (0–1) along the line of the vertex nearest a point. */
function fractionAt(line: readonly [number, number][], cum: number[], at: readonly [number, number]): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < line.length; i++) {
    const d = (line[i][0] - at[0]) ** 2 + (line[i][1] - at[1]) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return cum[best] / (cum[cum.length - 1] || 1);
}

/** The point at fraction `p` along the line. */
function pointAt(line: readonly [number, number][], cum: number[], p: number): [number, number] {
  const target = p * cum[cum.length - 1];
  let i = 1;
  while (i < cum.length - 1 && cum[i] < target) i++;
  const f = Math.min(1, Math.max(0, (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)));
  return [line[i - 1][0] + (line[i][0] - line[i - 1][0]) * f, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * f];
}

/** Slow start, quick middle, gentle landing: a brush stroke, not a progress bar. */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** A small overshoot, so a stop lands like a plate pressed onto the road. */
export const pop = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2);
/** Time fraction at which the eased paint reaches distance fraction `f`. */
export function invEase(f: number): number {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 24; k++) {
    const m = (lo + hi) / 2;
    if (easeInOut(m) < f) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export const PAINT_MS = 1700;
const POP_MS = 340;
const running = new WeakMap<maplibregl.Map, number>();
const EMPTY: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };

function setProgress(map: maplibregl.Map, p: number) {
  if (map.getLayer('trip-casing')) map.setPaintProperty('trip-casing', 'line-gradient', paintTo(p, TRIP_MAP.band));
  if (map.getLayer('trip-route')) map.setPaintProperty('trip-route', 'line-gradient', paintTo(p, TRIP_MAP.route));
}
function showGaps(map: maplibregl.Map, n: number) {
  for (const id of GAP_LAYERS) if (map.getLayer(id)) map.setFilter(id, gapsShown(n));
}

/** Hides the trip's line and points until paintTrip runs (called before the map flies to it). */
export function holdTrip(map: maplibregl.Map) {
  if (!map.getSource('trip-line')) return;
  stop(map);
  setProgress(map, 0);
  showGaps(map, 0);
  (map.getSource('trip-points') as maplibregl.GeoJSONSource | undefined)?.setData(EMPTY);
}

function stop(map: maplibregl.Map) {
  const id = running.get(map);
  if (id !== undefined) cancelAnimationFrame(id);
  running.delete(map);
}

/** Stops a paint in progress and shows the whole line (points come from setTripOverlay). */
export function cancelPaint(map: maplibregl.Map) {
  stop(map);
  if (!map.getSource('trip-line')) return;
  setProgress(map, 1);
  showGaps(map, ALL);
  (map.getSource('trip-head') as maplibregl.GeoJSONSource | undefined)?.setData(EMPTY);
}

/** Paints the trip along the road. Returns at once; the paint runs on animation frames. */
export function paintTrip(map: maplibregl.Map, o: TripOverlay) {
  if (!map.getSource('trip-line') || o.line.length < 2) return;
  stop(map);
  const cum = measure(o.line);
  const stopAt = o.stops.map((at) => PAINT_MS * invEase(fractionAt(o.line, cum, at)));
  const gapEnds = o.gaps.filter((g) => g.length > 1).map((g) => fractionAt(o.line, cum, g[g.length - 1]));
  const all = pointFC(o);
  const head = map.getSource('trip-head') as maplibregl.GeoJSONSource;
  const pts = map.getSource('trip-points') as maplibregl.GeoJSONSource;
  const landsAt = (kind: string, i: number | undefined) => (kind === 'from' ? 0 : kind === 'to' ? PAINT_MS : stopAt[i ?? 0] ?? PAINT_MS);
  const t0 = performance.now();
  const frame = (now: number) => {
    const el = now - t0;
    const p = easeInOut(Math.min(1, el / PAINT_MS));
    setProgress(map, p);
    showGaps(map, gapEnds.filter((f) => f <= p).length);
    head.setData(p < 1 ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: pointAt(o.line, cum, p) } }] } : EMPTY);
    pts.setData({
      type: 'FeatureCollection',
      features: all.features.map((f) => {
        const pr = f.properties as { kind: string; i?: number };
        return { ...f, properties: { ...pr, s: pop((el - landsAt(pr.kind, pr.i)) / POP_MS) } };
      }),
    });
    if (el < PAINT_MS + POP_MS) running.set(map, requestAnimationFrame(frame));
    else {
      running.delete(map);
      pts.setData(all);
      cancelPaint(map);
    }
  };
  running.set(map, requestAnimationFrame(frame));
}

/** B69: leaving the trip undoes the paint: the line draws back to the start, stops shrink away. */
export const RETRACT_MS = 650;
export function retractTrip(map: maplibregl.Map, o: TripOverlay, done: () => void) {
  if (!map.getSource('trip-line') || o.line.length < 2) return done();
  stop(map);
  const cum = measure(o.line);
  const gapEnds = o.gaps.filter((g) => g.length > 1).map((g) => fractionAt(o.line, cum, g[g.length - 1]));
  const all = pointFC(o);
  const head = map.getSource('trip-head') as maplibregl.GeoJSONSource;
  const pts = map.getSource('trip-points') as maplibregl.GeoJSONSource;
  const t0 = performance.now();
  const frame = (now: number) => {
    const el = now - t0;
    const p = 1 - easeInOut(Math.min(1, el / RETRACT_MS));
    setProgress(map, Math.max(p, 0));
    showGaps(map, gapEnds.filter((f) => f <= p).length);
    head.setData(p > 0 ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: pointAt(o.line, cum, p) } }] } : EMPTY);
    const s = Math.max(0, 1 - el / (RETRACT_MS * 0.6));
    pts.setData({ type: 'FeatureCollection', features: all.features.map((f) => ({ ...f, properties: { ...(f.properties as object), s } })) });
    if (el < RETRACT_MS) running.set(map, requestAnimationFrame(frame));
    else { running.delete(map); done(); }
  };
  running.set(map, requestAnimationFrame(frame));
}
