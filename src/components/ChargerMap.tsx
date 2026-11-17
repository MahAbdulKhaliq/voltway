// The charger map (charger-map.md, DESIGN-map.md M6–M8). Mounted with client:only="react":
// MapLibre draws with WebGL in the browser, so there is nothing to render at build time.
//
// Data: public/data/map/l3.json (every site with a Level 3 port, mixed sites included) loads
// whenever either level is ticked; l2.json (Level 2-only sites) only once Level 2 is first ticked.
// Filtering runs here (src/lib/map-filter.ts) and the result goes to one clustered GeoJSON
// source with setData, so clusters always count only what the filters let through.
// A theme change swaps the base style, which drops our layers; 'style.load' adds them back.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP } from '../config.ts';
import { t, type MessageKey } from '../i18n/t.ts';
import { getJSON, setJSON, KEYS } from '../lib/storage.ts';
import type { FeatureCollection, Point } from 'geojson';
import type { MapFeature, MapFeatureCollection, MapMeta } from '../lib/map-data.ts';
import {
  applyMapLink,
  carMapInfo,
  myCarRule,
  filterStations,
  narrowedCount,
  LEVELS,
  readFilters,
  type CarMapInfo,
  type MapFilters,
} from '../lib/map-filter.ts';
import { getMyCar, setMyCar, type MyCar } from '../lib/my-car.ts';
import {
  isFullRange,
  PLUGS,
  type Plug,
  POWER_STOPS,
  rangeWords,
  type ChargerLevel,
  type PowerRange,
} from '../lib/power-bands.ts';
import {
  BOLT,
  CLUSTER_PROPERTIES,
  clusterImage,
  drawMark,
  MAP_MARK,
  parseMarkName,
  pinImage,
  PIN,
  PLUG,
  PLUG_SHAPES,
  TESLA_T,
} from '../lib/map-icons.ts';
import { fastNear, NEAR_PLACE_KM, stationsInView, type Bounds, type ListItem } from '../lib/map-list.ts';
import PlaceField, { loadPlaces } from './PlaceField.tsx';
import type { PlaceSearch, TripEnd } from '../lib/place-search.ts';
import { readSavedTrip, readTripLink, stationEnd, type TripQuery } from '../lib/trip-link.ts';
import StationPanel from './StationPanel.tsx';
import RoutePanel from './RoutePanel.tsx';
import { useTrip } from './useTrip.ts';
import { addTripLayers, boundsOf, setTripOverlay, STOP_LAYERS, type TripOverlay } from '../lib/trip-overlay.ts';
import type { IndexEntry } from '../lib/types.ts';
import { createBaseMap } from '../lib/map-base.ts';
import { openCarPicker } from '../lib/car-label.ts';
import { sliceRoute } from '../lib/route-geo.ts';
import { useMapSheet } from './useMapSheet.ts';
import { SHEET_MEDIA } from '../lib/sheet.ts';

interface SavedView {
  center: [number, number];
  zoom: number;
}

function savedView(): SavedView {
  const v = getJSON<Partial<SavedView> | null>(KEYS.mapView, null);
  const ok =
    v &&
    Array.isArray(v.center) &&
    v.center.length === 2 &&
    v.center.every(Number.isFinite) &&
    typeof v.zoom === 'number' &&
    Number.isFinite(v.zoom);
  return ok ? (v as SavedView) : MAP.defaultView;
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

/** Filter for the ring under the selected pin (-1 matches nothing). */
const selectedFilter = (id: number | null) => ['==', ['get', 'i'], id ?? -1] as maplibregl.FilterSpecification;

/** Draws a pin or cluster mark the first time the map asks for it (names from map-icons.ts). */
function addMissingMark(map: maplibregl.Map, id: string) {
  const spec = parseMarkName(id);
  if (!spec) return;
  // MapLibre may already hold a 1×1 placeholder under this name; replace it.
  const existing = map.getImage(id);
  if (existing && existing.data.width > 1) return;
  if (existing) map.removeImage(id);
  map.addImage(id, drawMark(spec).image, { pixelRatio: 2 });
}

/** Adds the clustered source and its layers. Safe to call after every style load; the marks are
 *  drawn on demand (styleimagemissing), so a theme change redraws them too. */
function addOverlay(map: maplibregl.Map, data: FeatureCollection, selected: number | null, trip: boolean) {
  if (map.getSource('stations')) return;
  map.addSource('stations', {
    type: 'geojson',
    data,
    cluster: true,
    clusterRadius: 48,
    // B57 (owner, 2026-11-17): grouped up to zoom 15, so pins and their tags pile up less downtown.
    clusterMaxZoom: 15,
    clusterProperties: CLUSTER_PROPERTIES as Record<string, unknown>,
  } as maplibregl.GeoJSONSourceSpecification);
  // Clusters (B54): a disc split into its Level 2 and Level 3 parts, with speed and plug tags.
  map.addLayer({
    id: 'clusters',
    type: 'symbol',
    source: 'stations',
    filter: ['has', 'point_count'],
    layout: {
      'icon-image': clusterImage(trip) as maplibregl.ExpressionSpecification,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  });
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'stations',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 12,
      'text-allow-overlap': true,
    },
    paint: { 'text-color': MAP_MARK.clusterText },
  });
  map.addLayer({
    id: 'selected',
    type: 'circle',
    source: 'stations',
    filter: selectedFilter(selected),
    paint: {
      // Pale disc with a dark ring: stands out on the light and the dark base map.
      'circle-radius': 18,
      'circle-color': MAP_MARK.selectedFill,
      'circle-stroke-color': MAP_MARK.selectedRing,
      'circle-stroke-width': 3,
    },
  });
  map.addLayer({
    id: 'pins',
    type: 'symbol',
    source: 'stations',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'icon-image': pinImage(trip) as maplibregl.ExpressionSpecification,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      // Level 3 on top of Level 2 where they overlap.
      'symbol-sort-key': ['-', 0, ['get', 'lv']],
    },
  });
}

function PinIcon({ level, unavailable = false, tesla = false }: { level: ChargerLevel; unavailable?: boolean; tesla?: boolean }) {
  const fill = unavailable ? PIN.unavailable : tesla && level === 3 ? PIN.tesla : PIN.fill[level];
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="13" fill={PIN.ring} />
      <circle cx="14" cy="14" r="11" fill={fill} />
      <g transform="translate(6 6) scale(0.6667)">
        {tesla ? (
          <path d={TESLA_T} fill={level === 3 ? PIN.teslaGlyph : PIN.tesla} stroke={level === 3 ? PIN.teslaGlyph : PIN.tesla} strokeWidth="1.1" strokeLinejoin="round" />
        ) : level === 3 ? (
          <path d={BOLT} fill={PIN.glyph} />
        ) : (
          <path d={PLUG} fill="none" stroke={PIN.glyph} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
      {unavailable && (
        <g>
          <circle cx="22" cy="22" r="5.5" fill={PIN.badge} stroke={PIN.ring} strokeWidth="1.5" />
          <rect x="21.25" y="19" width="1.5" height="4" fill={PIN.badgeMark} />
          <rect x="21.25" y="24" width="1.5" height="1.5" fill={PIN.badgeMark} />
        </g>
      )}
    </svg>
  );
}

/** A plug's face as a small line drawing (B54), in the text colour. */
function PlugIcon({ plug, size = 18 }: { plug: Plug; size?: number }) {
  const s = PLUG_SHAPES[plug];
  return (
    <svg className="plug-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={s.outline} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {s.dots.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill="currentColor" />)}
    </svg>
  );
}

/** A group as the map draws it (B55): dark centre with a count, the ring split into a yellow
 *  Level 3 arc and a white Level 2 arc (here half and half), for the key. */
function ClusterIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="13.5" fill={MAP_MARK.clusterRing} />
      <path d="M14.6 2.5A11 11 0 0 1 14.6 25.5" fill="none" stroke={PIN.fill[3]} strokeWidth="4" />
      <path d="M13.4 25.5A11 11 0 0 1 13.4 2.5" fill="none" stroke={PIN.fill[2]} strokeWidth="4" />
      <text x="14" y="18" textAnchor="middle" fontSize="10" fontWeight="700" fill={MAP_MARK.clusterText}>8</text>
    </svg>
  );
}

/** One to three packed bolts on a dark tag, as on the map. */
function SpeedIcon({ tier }: { tier: number }) {
  const w = 7 + (tier - 1) * 4.2 + 4;
  return (
    <svg width={w * 1.6} height={14 * 1.6} viewBox={`0 0 ${w} 14`} aria-hidden="true">
      <rect width={w} height="14" rx="4" fill={MAP_MARK.tag} stroke={MAP_MARK.tagEdge} strokeWidth="0.6" />
      {Array.from({ length: tier }, (_, i) => (
        <g key={i} transform={`translate(${2 + i * 4.2} 2) scale(${7 / 12} ${10 / 18}) translate(-6 -3)`}>
          <path d={BOLT} fill={MAP_MARK.tagBolt} stroke={MAP_MARK.tag} strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
}

const kwText = (kw: number) => kw.toLocaleString('en-CA', { maximumFractionDigits: 1 });

/** One stop as a short tick label ("0", "3.6", "Max") and as spoken text ("3.6 kW", "No limit"). */
const stopLabel = (kw: number) => (Number.isFinite(kw) ? kwText(kw) : t('map.power.maxStop'));
const stopSpoken = (kw: number) => (Number.isFinite(kw) ? t('map.power.kw', { kw: kwText(kw) }) : t('map.power.noLimit'));

/**
 * Two-handle kW slider for one level (charger-map §4, B35): two native range inputs over one rail,
 * so each handle keeps the browser's keyboard and screen-reader support. Handles snap to the
 * level's stops and can't cross or meet.
 */
function PowerSlider({
  level,
  levelName,
  value,
  onChange,
}: {
  level: ChargerLevel;
  levelName: string;
  value: PowerRange;
  onChange: (r: PowerRange) => void;
}) {
  const stops = POWER_STOPS[level];
  const last = stops.length - 1;
  const [lo, hi] = value;
  const w = rangeWords(level, value);
  const words =
    w.key === 'any'
      ? t('map.power.any')
      : w.key === 'upTo'
        ? t('map.power.upTo', { max: kwText(w.max) })
        : w.key === 'from'
          ? t('map.power.from', { min: kwText(w.min) })
          : t('map.power.between', { min: kwText(w.min), max: kwText(w.max) });
  const pct = (i: number) => `${(i / last) * 100}%`;
  const wordsId = `power-words-l${level}`;
  return (
    <div className="power">
      <p className="power-words" id={wordsId} aria-live="polite">
        {words}
      </p>
      <div className="power-track">
        <div className="power-rail" aria-hidden="true" />
        <div className="power-fill" aria-hidden="true" style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={lo}
          aria-label={t('map.power.min', { level: levelName })}
          aria-valuetext={stopSpoken(stops[lo])}
          aria-describedby={wordsId}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - 1), hi])}
        />
        <input
          type="range"
          min={0}
          max={last}
          step={1}
          value={hi}
          aria-label={t('map.power.max', { level: levelName })}
          aria-valuetext={stopSpoken(stops[hi])}
          aria-describedby={wordsId}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + 1)])}
        />
      </div>
      <ol className="power-ticks" aria-hidden="true">
        {stops.map((kw, i) => (
          <li key={i} style={{ left: pct(i) }}>
            {stopLabel(kw)}
          </li>
        ))}
      </ol>
      {!isFullRange(level, value) && <p className="power-note small muted">{t('map.power.unknownHidden')}</p>}
    </div>
  );
}

type Load = 'idle' | 'loading' | 'ready' | 'error';

async function loadLevel(level: ChargerLevel): Promise<MapFeature[]> {
  const res = await fetch(`${MAP.dataUrl}/l${level}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ((await res.json()) as MapFeatureCollection).features;
}

/** Drops the trip parameters (?from, ?to, ?start, ?min) from the address bar. */
function clearTripParams() {
  const q = new URLSearchParams(window.location.search);
  if (!['from', 'to', 'start', 'min'].some((k) => q.has(k))) return;
  for (const k of ['from', 'to', 'start', 'min']) q.delete(k);
  const rest = q.toString();
  history.replaceState(history.state, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
}

export default function ChargerMap({ cars = [] }: { cars?: IndexEntry[] }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pinsRef = useRef<FeatureCollection>(EMPTY);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  // Saved filters, then a "Find chargers this fast" link (B31) on top; the params are stripped below.
  const [filters, setFilters] = useState<MapFilters>(() => {
    const saved = readFilters(getJSON<unknown>(KEYS.mapFilters, null));
    // B55: the map's "Chargers my car can use" box is gone; My car's plug toggles drive trips instead.
    const f = (typeof window !== 'undefined' && applyMapLink(window.location.search, saved)) || saved;
    return { ...f, myCar: false };
  });
  // My car (B28): its plug rule (B55: its plug switches) for the station panel and trips, read from its car file.
  const [myCar, setMyCarState] = useState<MyCar | null>(() => getMyCar());
  const [carInfo, setCarInfo] = useState<CarMapInfo | null>(null);
  const [stations, setStations] = useState<Record<ChargerLevel, MapFeature[]>>({ 3: [], 2: [] });
  const [load, setLoad] = useState<Record<ChargerLevel, Load>>({ 3: 'idle', 2: 'idle' });
  const [plugsOpen, setPlugsOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  // Filters start open on wide screens; phones (upright or sideways, B59) start with the sheet small.
  const [panelOpen, setPanelOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768 && !matchMedia(SHEET_MEDIA).matches);
  const [selected, setSelected] = useState<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  const [meta, setMeta] = useState<MapMeta | null>(null);
  const [locate, setLocate] = useState<'idle' | 'busy' | 'denied' | 'failed' | 'unsupported'>('idle');
  const youRef = useRef<maplibregl.Marker | null>(null);
  // "Stations in view" (B34): the current view, refreshed when the map stops moving.
  const [view, setView] = useState<{ bounds: Bounds; center: [number, number] } | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const listItemRef = useRef<HTMLButtonElement | null>(null);
  // "Where to?" (B50, 3.17): a picked place flies the map there and opens its place card.
  const [placeSearch, setPlaceSearch] = useState<PlaceSearch | null>(null);
  const [place, setPlace] = useState<TripEnd | null>(null);
  const [whereKey, setWhereKey] = useState(0);
  const placeRef = useRef<maplibregl.Marker | null>(null);
  const routeBtnRef = useRef<HTMLButtonElement | null>(null);
  // Route mode (B50, 3.18): the planner on this map.
  const [routeMode, setRouteMode] = useState(false);
  // The last trip with both ends (DESIGN-4 4.10): offered as a one-tap row on the home card. It is
  // read from the browser after load and again when route mode closes; no route is asked for
  // until the visitor taps it.
  const [lastTrip, setLastTrip] = useState<TripQuery | null>(null);
  useEffect(() => {
    if (routeMode) return;
    const saved = readSavedTrip(getJSON<unknown>(KEYS.lastTrip, null));
    setLastTrip(saved?.from && saved.to ? saved : null);
  }, [routeMode]);
  const tripOverlayRef = useRef<TripOverlay | null>(null);
  const stopIdsRef = useRef<number[]>([]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.has('power') && !q.has('plugs')) return;
    q.delete('power');
    q.delete('plugs');
    const rest = q.toString();
    history.replaceState(history.state, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
  }, []);
  useEffect(() => {
    loadPlaces().then((s) => setPlaceSearch(() => s)).catch(() => setPlaceSearch(null)); // a function: wrap it, or React calls it as an updater
  }, []);
  useEffect(() => {
    const on = (e: Event) => setMyCarState((e as CustomEvent<MyCar | null>).detail ?? null);
    window.addEventListener('voltway:mycar', on);
    return () => window.removeEventListener('voltway:mycar', on);
  }, []);
  useEffect(() => {
    setCarInfo(null);
    if (!myCar) return;
    let live = true;
    fetch(`/data/cars/${myCar.carId}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((file) => live && setCarInfo(carMapInfo(file)), () => live && setCarInfo(carMapInfo(null)));
    return () => {
      live = false;
    };
  }, [myCar]);
  /** My car's plug rule (B55): its toggles, or its own plug. Used by the station panel. */
  const carRule = myCar ? myCarRule(carInfo, myCar.plugs) : null;

  // The map itself, once.
  useEffect(() => {
    if (!box.current) return;
    const view = savedView();
    const { map, dispose } = createBaseMap({
      container: box.current,
      center: view.center,
      zoom: view.zoom,
      onStyleLoad: (m) => {
        addOverlay(m, pinsRef.current, selectedRef.current, tripOverlayRef.current !== null);
        addTripLayers(m, tripOverlayRef.current);
      },
    });
    mapRef.current = map;
    map.on('styleimagemissing', (e) => addMissingMark(map, e.id));
    const reportView = () => {
      const b = map.getBounds();
      const c = map.getCenter();
      setView({ bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], center: [c.lng, c.lat] });
    };
    // The bounds are known at once; 'load' waits for every tile, which can take a while.
    reportView();
    map.once('load', () => setMapStatus('ready'));
    map.on('moveend', reportView);
    map.on('error', (e) => {
      // Only a failed style or tile source means the map itself is broken.
      if (!map.isStyleLoaded() && (e.error as { status?: number } | undefined)?.status !== 404) setMapStatus('error');
    });
    map.on('moveend', (e) => {
      // The fly to a located position is not saved: Locate me stores nothing (charger-map §5).
      if ((e as { locate?: boolean }).locate) return;
      const c = map.getCenter();
      const round = (x: number) => Math.round(x * 1e4) / 1e4;
      setJSON(KEYS.mapView, { center: [round(c.lng), round(c.lat)], zoom: Math.round(map.getZoom() * 100) / 100 });
    });

    // Clusters zoom in on click.
    map.on('click', 'clusters', async (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const src = map.getSource('stations') as GeoJSONSource;
      const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id as number);
      map.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom });
    });
    // A pin opens its station panel; a click on empty map closes it.
    map.on('click', (e) => {
      const stopHit = map.getLayer('trip-stops') ? map.queryRenderedFeatures(e.point, { layers: STOP_LAYERS })[0] : undefined;
      if (stopHit) {
        const id = stopIdsRef.current[stopHit.properties.i as number];
        if (id !== undefined) setSelected(id);
        return;
      }
      const hit = map.queryRenderedFeatures(e.point, { layers: ['pins', 'clusters'] })[0];
      if (!hit) setSelected(null);
      else if (hit.layer.id === 'pins') {
        setSelected(hit.properties.i as number);
        if (matchMedia(SHEET_MEDIA).matches) {
          setPanelOpen(false);
          // Keep the pin visible above the bottom sheet.
          const at = (hit.geometry as Point).coordinates as [number, number];
          map.easeTo({ center: at, offset: [0, -map.getContainer().clientHeight * 0.3] });
        }
      }
    });
    for (const layer of ['clusters', 'pins', ...STOP_LAYERS]) {
      map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
    }

    return () => {
      dispose();
      mapRef.current = null;
    };
  }, []);

  // Station data: each file loads the first time it is needed (l3.json for either level).
  useEffect(() => {
    for (const lv of LEVELS) {
      // l3.json also holds every mixed site (Level 3 and Level 2 ports), so the Level 2 view needs it too.
      const needed = lv === 3 ? filters.levels[3] || filters.levels[2] || place !== null || routeMode : filters.levels[2];
      if (!needed || load[lv] !== 'idle') continue;
      setLoad((s) => ({ ...s, [lv]: 'loading' }));
      loadLevel(lv).then(
        (features) => {
          setStations((s) => ({ ...s, [lv]: features }));
          setLoad((s) => ({ ...s, [lv]: 'ready' }));
        },
        () => setLoad((s) => ({ ...s, [lv]: 'error' })),
      );
    }
  }, [filters.levels, load, place, routeMode]);

  // Filters → pins → map source; choices are saved.
  // The files never overlap (l3 = any Level 3 port, l2 = Level 2-only), so merging is safe.
  const pins = useMemo(
    () => filterStations([...stations[3], ...stations[2]], filters, carRule),
    [stations, filters, carRule],
  );
  useEffect(() => {
    pinsRef.current = pins;
    (mapRef.current?.getSource('stations') as GeoJSONSource | undefined)?.setData(pins);
  }, [pins]);
  useEffect(() => setJSON(KEYS.mapFilters, filters), [filters]);

  // The selected station: looked up from the loaded data, ringed on the map.
  const station = useMemo(() => {
    if (selected === null) return null;
    return stations[3].find((f) => f.properties.i === selected) ?? stations[2].find((f) => f.properties.i === selected) ?? null;
  }, [selected, stations]);
  useEffect(() => {
    selectedRef.current = selected;
    const map = mapRef.current;
    if (map?.getLayer('selected')) map.setFilter('selected', selectedFilter(selected));
  }, [selected]);
  // Closing hands focus back to the list item it was opened from, or else to the map,
  // so keyboard users don't land on <body>.
  const closeStation = useCallback(() => {
    setSelected(null);
    const item = listItemRef.current;
    listItemRef.current = null;
    // A control that is gone or folded away (the stops list on a phone) can't take focus.
    if (item?.isConnected && item.offsetParent !== null) item.focus();
    else mapRef.current?.getCanvas().focus();
  }, []);

  const list = useMemo(
    () => (listOpen && view ? stationsInView([...stations[3], ...stations[2]], filters, view.bounds, view.center, undefined, carRule) : null),
    [listOpen, view, stations, filters, carRule],
  );
  const openFromList = (item: ListItem, el: HTMLButtonElement) => {
    listItemRef.current = el;
    setSelected(item.i);
    mapRef.current?.easeTo({ center: item.at });
  };

  // Data date for the panel footer.
  useEffect(() => {
    fetch(`${MAP.dataUrl}/meta.json`)
      .then((r) => (r.ok ? (r.json() as Promise<MapMeta>) : null))
      .then(setMeta, () => setMeta(null));
  }, []);

  const pickPlace = (end: TripEnd | null) => {
    // Typing again (or clearing the box) drops the pick and its pin.
    if (!end) { placeRef.current?.remove(); placeRef.current = null; setPlace(null); return; }
    const map = mapRef.current;
    setPlace(end);
    setSelected(null);
    if (sheet.phone) setPanelOpen(false);
    if (!map) return;
    placeRef.current?.remove();
    const dot = document.createElement('div');
    dot.className = 'map-place-pin';
    dot.setAttribute('role', 'img');
    dot.setAttribute('aria-label', end.label);
    placeRef.current = new maplibregl.Marker({ element: dot, anchor: 'bottom' }).setLngLat([end.lon, end.lat]).addTo(map);
    map.flyTo({ center: [end.lon, end.lat], zoom: Math.max(Math.min(map.getZoom(), 12), 10) });
  };
  // A picked place moves focus to Plan trip (owner 2026-11-17: no separate place card): the phone
  // keyboard closes so the map shows, and the charger count beside it is announced.
  useEffect(() => {
    if (place) routeBtnRef.current?.focus({ preventScroll: true });
  }, [place]);
  const closePlace = useCallback(() => {
    placeRef.current?.remove();
    placeRef.current = null;
    setPlace(null);
    setWhereKey((k) => k + 1); // a fresh, empty box
  }, []);
  const nearCount = useMemo(
    () => (place && load[3] === 'ready' ? fastNear(stations[3], filters, [place.lon, place.lat], NEAR_PLACE_KM, carRule) : null),
    [place, load, stations, filters, carRule],
  );

  const T = useTrip(myCar, load[3] === 'ready' ? stations[3] : null, load[3] === 'error');
  const { plan, routeData } = T;
  // B59: on phones the panel is a draggable bottom sheet over a full-height map.
  // Owner (B59 follow-up): on the plain map, dragging the sheet up opens the Chargers filters and
  // dragging it back down to peek closes them.
  const sheet = useMapSheet((s) => { if (!routeMode) setPanelOpen(s !== 'peek'); });
  const { setSnap } = sheet;
  // The sheet follows what the visitor is doing: browsing peeks, filters and trips open half way
  // (a sheet the visitor already pulled up to full stays there).
  useEffect(() => {
    setSnap((s) => (routeMode ? 'half' : panelOpen ? (s === 'peek' ? 'half' : s) : 'peek'));
  }, [routeMode, panelOpen, setSnap]);
  useEffect(() => {
    if (!T.current) return;
    // Half way, so the route stays in view. A charging-gap warning is a safety message: the sheet
    // scrolls it up under the handle so it is in view too.
    setSnap('half');
    const timer = setTimeout(() => {
      const panel = sheet.panelRef.current, warn = panel?.querySelector<HTMLElement>('.ti-gap-warn');
      if (!panel || !warn || !sheet.phone) return;
      const handle = panel.querySelector<HTMLElement>('.sheet-handle')?.offsetHeight ?? 0;
      const below = warn.getBoundingClientRect().top - panel.getBoundingClientRect().top - handle;
      if (below > 0 && warn.getBoundingClientRect().bottom > panel.getBoundingClientRect().bottom) panel.scrollTop += below - 8;
    }, 300);
    return () => clearTimeout(timer);
  }, [T.current, setSnap]); // eslint-disable-line react-hooks/exhaustive-deps
  const enterRoute = useCallback((opts: Parameters<typeof T.start>[0] = {}) => {
    placeRef.current?.remove();
    placeRef.current = null;
    setPlace(null);
    setSelected(null);
    setRouteMode(true);
    setPanelOpen(true);
    T.start(opts);
  }, [T.start]); // eslint-disable-line react-hooks/exhaustive-deps
  const closeRoute = () => {
    T.stop();
    // Phones: back to the plain map with the sheet small (route mode had opened the panel).
    if (sheet.phone) setPanelOpen(false);
    setRouteMode(false);
    setSelected(null);
    clearTripParams();
    setWhereKey((k) => k + 1); // focus back to the "Where to?" box
  };
  const closeRouteRef = useRef(closeRoute);
  closeRouteRef.current = closeRoute;
  // Escape closes the place card, or leaves route mode (P.2), unless something else used it first:
  // an open suggestion list, an open station panel, or the side menu (a dialog closes itself).
  useEffect(() => {
    if (!place && !routeMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || selected !== null || document.querySelector('dialog[open]')) return;
      if (place) closePlace();
      else closeRouteRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [place, routeMode, selected, closePlace]);
  // A trip link (/?from=…&to=…, the share link) opens route mode; both ends plan at once.
  useEffect(() => {
    const link = readTripLink(window.location.search);
    if (link) enterRoute({ link });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The route on the map: drawn when the plan is for the ends in the form, cleared otherwise.
  const stopIds = useMemo(() => (plan && T.current ? plan.stops.map((st) => st.station.i) : []), [plan, T.current]);
  const selectedStop = selected !== null && stopIds.includes(selected) ? stopIds.indexOf(selected) : null;
  useEffect(() => {
    stopIdsRef.current = stopIds;
    const o: TripOverlay | null =
      routeMode && plan && routeData && T.current && T.trip.from && T.trip.to
        ? {
            line: routeData.route.coords.map((p) => [p[0], p[1]] as [number, number]),
            gaps: plan.gaps.map((g) => sliceRoute(routeData.route, g.fromKm, g.toKm)),
            from: [T.trip.from.lon, T.trip.from.lat],
            to: [T.trip.to.lon, T.trip.to.lat],
            stops: plan.stops.map((st) => st.lonLat),
            selected: selectedStop,
          }
        : null;
    tripOverlayRef.current = o;
    const map = mapRef.current;
    if (map?.isStyleLoaded() || map?.getSource('stations')) setTripOverlay(map, o);
  }, [routeMode, plan, routeData, T.current, T.trip.from, T.trip.to, selectedStop, stopIds]);
  // A new route: fit it in the view beside the panel (or above the sheet on phones).
  const fittedKey = useRef('');
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !routeMode || !routeData || !T.current || fittedKey.current === routeData.key) return;
    fittedKey.current = routeData.key;
    // Phones (B59): the map runs under the pill (top), the round buttons (right) and the sheet,
    // which opens half way for a plan (bottom).
    const phone = sheet.phone;
    map.fitBounds(boundsOf(routeData.route.coords.map((p) => [p[0], p[1]] as [number, number])), {
      padding: phone ? { top: 84, bottom: sheet.heightFor('half') + 24, left: 28, right: 64 } : { top: 40, bottom: 60, left: 420, right: 60 },
      duration: 600,
    });
  }, [routeMode, routeData, T.current]);
  useEffect(() => { if (!routeMode) fittedKey.current = ''; }, [routeMode]);
  const openStop = (i: number, button: HTMLButtonElement) => {
    const st = plan?.stops[i];
    if (!st) return;
    listItemRef.current = button;
    setSelected(st.station.i);
    mapRef.current?.easeTo({ center: st.lonLat });
  };

  // Locate me: on load (B56) and on click; the position is used to centre the map and kept nowhere.
  // auto = the locate on load (B56): it shows no messages, and it does not move the map once the
  // visitor has moved it, picked a place or opened the trip planner (the answer can come late).
  const locateMe = (auto = false) => {
    const map = mapRef.current;
    if (!map) return;
    if (!('geolocation' in navigator)) return auto ? undefined : setLocate('unsupported');
    if (!auto) setLocate('busy');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const at: [number, number] = [coords.longitude, coords.latitude];
        youRef.current?.remove();
        const dot = document.createElement('div');
        dot.className = 'map-you';
        dot.setAttribute('role', 'img');
        dot.setAttribute('aria-label', t('map.you'));
        youRef.current = new maplibregl.Marker({ element: dot }).setLngLat(at).addTo(map);
        if (!(auto && interactedRef.current)) map.flyTo({ center: at, zoom: Math.max(map.getZoom(), 12) }, { locate: true });
        if (!auto) setLocate('idle');
      },
      // 1 = PERMISSION_DENIED (compared by value: the constant isn't on every error object).
      (err) => { if (!auto) setLocate(err.code === 1 ? 'denied' : 'failed'); },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };
  // B56 (owner, 2026-11-17): the map locates the visitor as soon as it loads. The browser asks for
  // permission the first time, as Locate me does. Skipped when a trip link opened route mode, and
  // skipped quietly when permission was already refused (no error on every visit).
  const autoLocated = useRef(false);
  const interactedRef = useRef(false);
  useEffect(() => { if (place || routeMode) interactedRef.current = true; }, [place, routeMode]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Only a visitor's own drag or zoom counts (it carries the browser event).
    const moved = (e: { originalEvent?: unknown }) => { if (e.originalEvent) interactedRef.current = true; };
    map.on('movestart', moved);
    return () => { map.off('movestart', moved); };
  }, [mapStatus]);
  useEffect(() => {
    if (mapStatus !== 'ready' || autoLocated.current) return;
    autoLocated.current = true;
    if (readTripLink(window.location.search) || !('geolocation' in navigator)) return;
    const perms = (navigator as Navigator & { permissions?: Permissions }).permissions;
    if (!perms?.query) return locateMe(true);
    perms
      .query({ name: 'geolocation' as PermissionName })
      .then((s) => s.state !== 'denied' && locateMe(true), () => locateMe(true));
  }, [mapStatus]); // eslint-disable-line react-hooks/exhaustive-deps
  // Failure messages clear themselves; the button stays for another try.
  useEffect(() => {
    if (locate === 'idle' || locate === 'busy') return;
    const id = setTimeout(() => setLocate('idle'), 10000);
    return () => clearTimeout(id);
  }, [locate]);
  const locateMsg: Partial<Record<typeof locate, MessageKey>> = {
    busy: 'map.locating',
    denied: 'map.locateDenied',
    failed: 'map.locateFailed',
    unsupported: 'map.locateUnsupported',
  };

  const toggle = <K extends 'levels' | 'plugs'>(group: K, key: keyof MapFilters[K]) =>
    setFilters((f) => ({ ...f, [group]: { ...f[group], [key]: !f[group][key] } }));

  const wanted = (lv: ChargerLevel) => (lv === 3 ? filters.levels[3] || filters.levels[2] : filters.levels[2]);
  const busy = LEVELS.some((lv) => wanted(lv) && load[lv] === 'loading');
  const failed = LEVELS.some((lv) => wanted(lv) && load[lv] === 'error');
  const count = pins.features.length;
  /** The car filter in force (ticked, and the car's port is known). */
  const narrowed = narrowedCount(filters, carRule);
  const levelLabel: Record<ChargerLevel, MessageKey> = { 3: 'map.level3', 2: 'map.level2' };
  /** Plugs the map is showing now (ticked, and not ruled out by the car filter). */
  const plugsOn = PLUGS.filter((p) => filters.plugs[p]).length;

  return (
    <div className="charger-map" ref={sheet.rootRef}>
      <div ref={box} className="map-canvas" role="region" aria-label={t('map.label')} />

      <div className={`map-panel${routeMode ? ' route' : ''}`} ref={sheet.panelRef} style={sheet.panelStyle} {...sheet.panelProps}>
        {sheet.phone && (
          <button type="button" className="sheet-handle" {...sheet.handleProps}
            aria-label={t('map.sheet.handle', { size: t(`map.sheet.${sheet.snap}` as MessageKey) })}>
            <span aria-hidden="true" />
          </button>
        )}
        {routeMode ? (
          <RoutePanel
            trip={T}
            cars={cars}
            myCar={myCar}
            search={placeSearch}
            selectedStop={selectedStop}
            onOpenStop={openStop}
            onClose={closeRoute}
            updated={meta?.updated ?? null}
          />
        ) : (<>
        <div className="map-where">
          <PlaceField
            key={whereKey}
            label={t('map.where.label')}
            placeholder={t('map.where.placeholder')}
            hideLabel
            autoFocus={whereKey > 0}
            value={place}
            search={placeSearch}
            onChange={pickPlace}
            extra={
              <button type="button" ref={routeBtnRef} className="btn small map-route-btn" onClick={() => enterRoute(place ? { to: place } : {})}>
                {t('route.open')}
              </button>
            }
          />
          {place && (
            <p className="small muted map-place-near" role="status">
              {nearCount === null
                ? t('map.place.counting')
                : nearCount === 0
                  ? t('map.place.nearNone', { km: NEAR_PLACE_KM })
                  : nearCount === 1
                    ? t('map.place.nearOne', { km: NEAR_PLACE_KM })
                    : t('map.place.near', { n: nearCount.toLocaleString('en-CA'), km: NEAR_PLACE_KM })}
            </p>
          )}
        </div>
        <div className="map-car">
          {myCar && (
            <button type="button" className="car-tile" onClick={openCarPicker}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7.3h9a2 2 0 0 1 1.9 1.3L20 13M4 13h16v5H4v-5ZM7 18v1.5M17 18v1.5M7.5 15.5h.01M16.5 15.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span className="car-tile-text"><span className="muted">{t('car.tile.label')}</span> <strong>{myCar.label ?? cars.find((c) => c.id === myCar.carId)?.name ?? myCar.carId}</strong></span>
              <span className="car-tile-change small">{t('car.tile.change')}</span>
            </button>
          )}
          {lastTrip && (
            <button type="button" className="car-tile last-trip" onClick={() => enterRoute({ link: lastTrip })}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.6-5.9M4 5v4h4M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span className="car-tile-text"><span className="muted">{t('trip.last.label')}</span> <strong>{t('trip.last.ends', { from: lastTrip.from!.label, to: lastTrip.to!.label })}</strong></span>
              <span className="car-tile-change small">{t('trip.last.plan')}</span>
            </button>
          )}
        </div>
        <button
          type="button"
          className="map-panel-toggle"
          aria-expanded={panelOpen}
          aria-controls="map-filters"
          onClick={() => setPanelOpen((o) => !o)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <span>{t('map.filters')}</span>
          {narrowed > 0 && (
            <span className="map-filters-on small">{narrowed === 1 ? t('map.filters.on.one') : t('map.filters.on', { count: narrowed })}</span>
          )}
        </button>

        <div id="map-filters" className="map-filters" hidden={!panelOpen}>
          <fieldset>
            <legend>{t('map.levelPower')}</legend>
            {LEVELS.map((lv) => (
              <div key={lv} className="level-group">
                <label className="check level">
                  <input type="checkbox" checked={filters.levels[lv]} onChange={() => toggle('levels', lv)} />
                  <PinIcon level={lv} />
                  <span>{t(levelLabel[lv])}</span>
                </label>
                {filters.levels[lv] && (
                  <PowerSlider
                    level={lv}
                    levelName={t(levelLabel[lv])}
                    value={filters.power[lv]}
                    onChange={(r) => setFilters((f) => ({ ...f, power: { ...f.power, [lv]: r } }))}
                  />
                )}
              </div>
            ))}
          </fieldset>

          <div className="plugs-group">
            <button
              type="button"
              className="plugs-toggle"
              aria-expanded={plugsOpen}
              aria-controls="map-plugs"
              onClick={() => setPlugsOpen((o) => !o)}
            >
              <span>{t('map.plugs')}</span>
              <span className="plugs-summary small muted">
                {plugsOn === PLUGS.length ? t('map.plugs.all') : t('map.plugs.some', { n: plugsOn, total: PLUGS.length })}
              </span>
              <svg className="chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          <fieldset id="map-plugs" hidden={!plugsOpen}>
            <legend className="sr-only">{t('map.plugs')}</legend>
            <ul className="plugs">
              {PLUGS.map((p) => {
                return (
                  <li key={p}>
                    <label className="check">
                      <input type="checkbox" checked={filters.plugs[p]} onChange={() => toggle('plugs', p)} />
                      <PlugIcon plug={p} />
                      <span>{t(`value.${p}` as MessageKey)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
          </div>
        </div>

        <p className="map-count small" role="status" aria-live="polite">
          {failed
            ? t('map.dataError')
            : busy
              ? filters.levels[2] && load[2] === 'loading' ? t('map.loadingL2') : t('map.loadingStations')
              : count === 1 ? t('map.count.one') : t('map.count', { count: count.toLocaleString('en-CA') })}
        </p>

        <div className="map-list-wrap">
          <button
            type="button"
            className="map-list-toggle"
            aria-expanded={listOpen}
            aria-controls="map-list"
            onClick={() => setListOpen((o) => !o)}
          >
            {t('map.list.toggle')}
          </button>
          {listOpen && list && (
            <div id="map-list" className="map-list">
              {list.total === 0 ? (
                <p className="small muted">{t('map.list.none')}</p>
              ) : (
                <>
                  {list.total > list.items.length && (
                    <p className="small muted">
                      {t('map.list.more', {
                        shown: list.items.length,
                        total: list.total.toLocaleString('en-CA'),
                      })}
                    </p>
                  )}
                  <ul aria-label={t('map.list.label')}>
                    {list.items.map((it) => (
                      <li key={it.i}>
                        <button
                          type="button"
                          aria-current={selected === it.i ? 'true' : undefined}
                          onClick={(e) => openFromList(it, e.currentTarget)}
                        >
                          <span className="map-list-name">{it.name}</span>
                          <span className="small muted">
                            {[
                              t(levelLabel[it.level]),
                              it.maxKw == null ? t('map.station.unknownPower') : t('map.list.upTo', { kw: kwText(it.maxKw) }),
                              it.city,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
        </>)}
      </div>

      <div className="map-corner">
      {locateMsg[locate] && (
        <p className="map-locate-msg small" role={locate === 'busy' ? 'status' : 'alert'}>
          {t(locateMsg[locate]!)}
        </p>
      )}
      {keyOpen && (
        <section id="map-key" className="map-key" aria-labelledby="map-key-title" tabIndex={0}>
          <h2 id="map-key-title" className="map-key-title">{t('map.key.title')}</h2>
          <ul>
            <li><PinIcon level={3} /> <span>{t('map.level3')}</span></li>
            <li><PinIcon level={2} /> <span>{t('map.level2')}</span></li>
            <li><PinIcon level={3} tesla /> <span>{t('map.key.teslaL3')}</span></li>
            <li><PinIcon level={2} tesla /> <span>{t('map.key.teslaL2')}</span></li>
            <li><PinIcon level={3} unavailable /> <span>{t('map.legend.unavailable')}</span></li>
            <li><ClusterIcon /> <span>{t('map.key.cluster')}</span></li>
          </ul>
          <h3 className="map-key-sub">{t('map.key.speed')}</h3>
          <ul>
            <li><SpeedIcon tier={1} /> <span>{t('map.key.speed1')}</span></li>
            <li><SpeedIcon tier={2} /> <span>{t('map.key.speed2')}</span></li>
            <li><SpeedIcon tier={3} /> <span>{t('map.key.speed3')}</span></li>
          </ul>
          <h3 className="map-key-sub">{t('map.key.plugs')}</h3>
          <ul className="map-key-plugs">
            {PLUGS.map((p) => <li key={p}><PlugIcon plug={p} /> <span>{t(`value.${p}` as MessageKey)}</span></li>)}
          </ul>
          <p className="small muted map-key-note">{t('map.key.tagsNote')} {t('map.key.trip')}</p>
        </section>
      )}
      <button type="button" className="map-key-btn" aria-expanded={keyOpen} aria-controls="map-key" onClick={() => setKeyOpen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="5.5" cy="6.5" r="2" fill="currentColor" />
          <circle cx="5.5" cy="12" r="2" fill="currentColor" />
          <circle cx="5.5" cy="17.5" r="2" fill="currentColor" />
          <path d="M10 6.5h10M10 12h10M10 17.5h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="map-btn-label">{t('map.key.toggle')}</span>
      </button>
      <button type="button" className="map-locate" onClick={() => locateMe()} disabled={locate === 'busy'}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        <span className="map-btn-label">{t('map.locate')}</span>
      </button>
      </div>


      {station && (
        <StationPanel
          station={station}
          updated={meta?.updated ?? null}
          onClose={closeStation}
          myCar={myCar}
          carInfo={myCar && carInfo ? { ...carInfo, rule: carRule } : null}
          onRouteHere={selectedStop === null ? () => enterRoute({ to: stationEnd(station) }) : undefined}
        />
      )}

      {mapStatus === 'loading' && (
        <p className="map-status" role="status">
          {t('map.loading')}
        </p>
      )}
      {mapStatus === 'error' && (
        <p className="map-status banner" role="alert">
          {t('map.error')}
        </p>
      )}
    </div>
  );
}

