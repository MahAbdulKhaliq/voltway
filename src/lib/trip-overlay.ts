// The route drawn on the charger map (B50, 3.18; route-planner.md §7): the route line on a white
// casing, any charging gap as a dashed red stretch, numbered stop pins, and the start and end.
// While a route shows, the charger pins and clusters fade so the route stands out.

import type maplibregl from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { TRIP_MAP } from './trip-map-style.ts';

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
  features: gaps.filter((g) => g.length > 1).map((coordinates) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } })),
});

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
  map.addSource('trip-line', { type: 'geojson', data: lineFC(o?.line ?? []) });
  map.addSource('trip-gaps', { type: 'geojson', data: gapFC(o?.gaps ?? []) });
  map.addSource('trip-points', { type: 'geojson', data: pointFC(o) });
  map.addLayer({ id: 'trip-casing', type: 'line', source: 'trip-line', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': TRIP_MAP.band, 'line-width': 12 } });
  map.addLayer({ id: 'trip-route', type: 'line', source: 'trip-line', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': TRIP_MAP.route, 'line-width': 4.5 } });
  // A charging gap: an orange-edged band covers the solid line, then the yellow is repainted as dashes.
  map.addLayer({ id: 'trip-gap-edge', type: 'line', source: 'trip-gaps', layout: { 'line-cap': 'butt' }, paint: { 'line-color': TRIP_MAP.gapEdge, 'line-width': 14 } });
  map.addLayer({ id: 'trip-gap-band', type: 'line', source: 'trip-gaps', layout: { 'line-cap': 'butt' }, paint: { 'line-color': TRIP_MAP.band, 'line-width': 9 } });
  map.addLayer({ id: 'trip-gap', type: 'line', source: 'trip-gaps', layout: { 'line-cap': 'butt' }, paint: { 'line-color': TRIP_MAP.route, 'line-width': 4.5, 'line-dasharray': [2, 1.6] } });
  map.addLayer({
    id: 'trip-selected', type: 'circle', source: 'trip-points', filter: selFilter(o?.selected ?? null),
    paint: { 'circle-radius': 19, 'circle-color': TRIP_MAP.selectedFill, 'circle-stroke-color': TRIP_MAP.selectedRing, 'circle-stroke-width': 3 },
  });
  map.addLayer({
    id: 'trip-ends', type: 'circle', source: 'trip-points', filter: ['!=', ['get', 'kind'], 'stop'],
    paint: { 'circle-radius': 8, 'circle-color': ['match', ['get', 'kind'], 'from', TRIP_MAP.start, TRIP_MAP.end], 'circle-stroke-color': ['match', ['get', 'kind'], 'from', TRIP_MAP.startRing, TRIP_MAP.endRing], 'circle-stroke-width': 3 },
  });
  map.addLayer({
    id: 'trip-stops', type: 'circle', source: 'trip-points', filter: ['==', ['get', 'kind'], 'stop'],
    paint: { 'circle-radius': 13, 'circle-color': TRIP_MAP.stop, 'circle-stroke-color': TRIP_MAP.stopRing, 'circle-stroke-width': 2 },
  });
  map.addLayer({
    id: 'trip-stop-labels', type: 'symbol', source: 'trip-points', filter: ['==', ['get', 'kind'], 'stop'],
    layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-allow-overlap': true, 'text-ignore-placement': true },
    paint: { 'text-color': TRIP_MAP.stopText },
  });
  fadePins(map, o !== null);
}

/** Puts a route on the map (or clears it with null), and fades or restores the charger pins. */
export function setTripOverlay(map: maplibregl.Map, o: TripOverlay | null) {
  if (!map.getSource('trip-line')) { addTripLayers(map, o); return; }
  (map.getSource('trip-line') as maplibregl.GeoJSONSource).setData(lineFC(o?.line ?? []));
  (map.getSource('trip-gaps') as maplibregl.GeoJSONSource).setData(gapFC(o?.gaps ?? []));
  (map.getSource('trip-points') as maplibregl.GeoJSONSource).setData(pointFC(o));
  map.setFilter('trip-selected', selFilter(o?.selected ?? null));
  fadePins(map, o !== null);
}

/** Fades the charger pins and clusters while a route shows; restores them after. */
export function fadePins(map: maplibregl.Map, faded: boolean) {
  const k = faded ? FADED_OPACITY : 1;
  if (map.getLayer('pins')) map.setPaintProperty('pins', 'icon-opacity', k);
  if (map.getLayer('clusters')) map.setPaintProperty('clusters', 'circle-opacity', 0.88 * k);
  if (map.getLayer('cluster-count')) map.setPaintProperty('cluster-count', 'text-opacity', k);
  // The ring under a selected charger stays at full strength, so the open station is easy to find.
}
