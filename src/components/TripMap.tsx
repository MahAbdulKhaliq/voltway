// The trip map (route-planner.md §7): the route line, numbered stop pins, start and end, and any
// charging gap drawn as a dashed red stretch. Loaded lazily by TripPlanner (MapLibre needs the
// browser), on the shared base map (map-base.ts), so the theme and credits match the charger map.

import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { createBaseMap } from '../lib/map-base.ts';
import { TRIP_MAP } from '../lib/trip-map-style.ts';

export interface TripMapStop { lonLat: [number, number]; n: number }

interface Props {
  line: [number, number][];
  gaps: [number, number][][];
  from: [number, number];
  to: [number, number];
  stops: TripMapStop[];
  selected: number | null;
  onSelect: (stopIndex: number | null) => void;
  label: string;
}

const lineFC = (coords: [number, number][]): FeatureCollection<LineString> => ({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }],
});

const gapFC = (gaps: [number, number][][]): FeatureCollection<LineString> => ({
  type: 'FeatureCollection',
  features: gaps.filter((g) => g.length > 1).map((coordinates) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } })),
});

const pointFC = (from: [number, number], to: [number, number], stops: TripMapStop[]): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { kind: 'from', label: '' }, geometry: { type: 'Point', coordinates: from } },
    { type: 'Feature', properties: { kind: 'to', label: '' }, geometry: { type: 'Point', coordinates: to } },
    ...stops.map((s, i): Feature<Point> => ({ type: 'Feature', properties: { kind: 'stop', i, label: String(s.n) }, geometry: { type: 'Point', coordinates: s.lonLat } })),
  ],
});

const selFilter = (i: number | null) => ['all', ['==', ['get', 'kind'], 'stop'], ['==', ['get', 'i'], i ?? -1]] as maplibregl.FilterSpecification;

function boundsOf(coords: [number, number][]): [number, number, number, number] {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [x, y] of coords) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
  return [w, s, e, n];
}

export default function TripMap({ line, gaps, from, to, stops, selected, onSelect, label }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const data = useRef({ line, gaps, from, to, stops, selected });
  data.current = { line, gaps, from, to, stops, selected };
  const select = useRef(onSelect);
  select.current = onSelect;

  // Adds the trip's sources and layers; runs after every style load (theme swaps drop them).
  const addOverlay = (map: maplibregl.Map) => {
    const d = data.current;
    if (map.getSource('trip-line')) return;
    map.addSource('trip-line', { type: 'geojson', data: lineFC(d.line) });
    map.addSource('trip-gaps', { type: 'geojson', data: gapFC(d.gaps) });
    map.addSource('trip-points', { type: 'geojson', data: pointFC(d.from, d.to, d.stops) });
    map.addLayer({ id: 'trip-casing', type: 'line', source: 'trip-line', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': TRIP_MAP.casing, 'line-width': 8 } });
    map.addLayer({ id: 'trip-route', type: 'line', source: 'trip-line', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': TRIP_MAP.route, 'line-width': 4.5 } });
    map.addLayer({ id: 'trip-gap', type: 'line', source: 'trip-gaps', layout: { 'line-cap': 'butt' }, paint: { 'line-color': TRIP_MAP.gap, 'line-width': 5, 'line-dasharray': [1.5, 1] } });
    map.addLayer({
      id: 'trip-selected', type: 'circle', source: 'trip-points', filter: selFilter(d.selected),
      paint: { 'circle-radius': 19, 'circle-color': TRIP_MAP.ring, 'circle-stroke-color': TRIP_MAP.selected, 'circle-stroke-width': 3 },
    });
    map.addLayer({
      id: 'trip-ends', type: 'circle', source: 'trip-points', filter: ['!=', ['get', 'kind'], 'stop'],
      paint: { 'circle-radius': 8, 'circle-color': ['match', ['get', 'kind'], 'from', TRIP_MAP.start, TRIP_MAP.end], 'circle-stroke-color': TRIP_MAP.ring, 'circle-stroke-width': 3 },
    });
    map.addLayer({
      id: 'trip-stops', type: 'circle', source: 'trip-points', filter: ['==', ['get', 'kind'], 'stop'],
      paint: { 'circle-radius': 13, 'circle-color': TRIP_MAP.stop, 'circle-stroke-color': TRIP_MAP.ring, 'circle-stroke-width': 2 },
    });
    map.addLayer({
      id: 'trip-stop-labels', type: 'symbol', source: 'trip-points', filter: ['==', ['get', 'kind'], 'stop'],
      layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-allow-overlap': true, 'text-ignore-placement': true },
      paint: { 'text-color': TRIP_MAP.stopText },
    });
  };

  // The map, once per mount; the planner remounts it (key) for a new route.
  useEffect(() => {
    if (!box.current) return;
    const { map, dispose } = createBaseMap({ container: box.current, bounds: boundsOf(data.current.line), onStyleLoad: addOverlay });
    mapRef.current = map;
    map.on('click', (e) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: ['trip-stops', 'trip-stop-labels'] })[0];
      select.current(hit ? (hit.properties.i as number) : null);
    });
    for (const layer of ['trip-stops', 'trip-stop-labels']) {
      map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
    }
    return () => { dispose(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Same route, new stops (Change car, other percentages): update the points and gaps in place.
  useEffect(() => {
    const map = mapRef.current;
    (map?.getSource('trip-points') as maplibregl.GeoJSONSource | undefined)?.setData(pointFC(from, to, stops));
    (map?.getSource('trip-gaps') as maplibregl.GeoJSONSource | undefined)?.setData(gapFC(gaps));
  }, [from, to, stops, gaps]);

  // The selected stop: ringed, and brought into view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('trip-selected')) map.setFilter('trip-selected', selFilter(selected));
    if (selected !== null && stops[selected]) {
      const offset: [number, number] = window.innerWidth <= 640 ? [0, -map.getContainer().clientHeight * 0.25] : [0, 0];
      map.easeTo({ center: stops[selected].lonLat, offset, duration: 400 });
    }
  }, [selected, stops]);

  return <div ref={box} className="trip-map-canvas" role="region" aria-label={label} />;
}
