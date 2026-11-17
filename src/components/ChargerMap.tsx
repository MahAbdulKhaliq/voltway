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
  filterStations,
  LEVELS,
  readFilters,
  type CarMapInfo,
  type MapFilters,
} from '../lib/map-filter.ts';
import { getMyCar, setMyCar, type MyCar } from '../lib/my-car.ts';
import {
  isFullRange,
  PLUGS,
  POWER_STOPS,
  rangeWords,
  type ChargerLevel,
  type PowerRange,
} from '../lib/power-bands.ts';
import { BOLT, drawPin, MAP_MARK, PIN, PLUG, pinId } from '../lib/map-icons.ts';
import { fastNear, NEAR_PLACE_KM, stationsInView, type Bounds, type ListItem } from '../lib/map-list.ts';
import PlaceField, { loadPlaces } from './PlaceField.tsx';
import type { PlaceSearch, TripEnd } from '../lib/place-search.ts';
import { readTripLink, stationEnd } from '../lib/trip-link.ts';
import StationPanel from './StationPanel.tsx';
import RoutePanel from './RoutePanel.tsx';
import { useTrip } from './useTrip.ts';
import { addTripLayers, boundsOf, setTripOverlay, STOP_LAYERS, type TripOverlay } from '../lib/trip-overlay.ts';
import type { IndexEntry } from '../lib/types.ts';
import { createBaseMap } from '../lib/map-base.ts';
import { sliceRoute } from '../lib/route-geo.ts';

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

/** Adds pin images, the clustered source and its layers. Safe to call after every style load. */
function addOverlay(map: maplibregl.Map, data: FeatureCollection, selected: number | null) {
  for (const lv of LEVELS) {
    for (const t of [false, true]) {
      const id = pinId(lv, t);
      if (!map.hasImage(id)) map.addImage(id, drawPin(lv, t), { pixelRatio: 2 });
    }
  }
  if (map.getSource('stations')) return;
  map.addSource('stations', { type: 'geojson', data, cluster: true, clusterRadius: 48, clusterMaxZoom: 13 });
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'stations',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': MAP_MARK.cluster,
      'circle-opacity': 0.88,
      'circle-stroke-color': MAP_MARK.clusterRing,
      'circle-stroke-width': 2,
      'circle-radius': ['step', ['get', 'point_count'], 14, 25, 18, 100, 22, 500, 27],
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
      'icon-image': [
        'concat',
        'pin-l',
        ['to-string', ['get', 'lv']],
        ['case', ['has', 't'], '-t', ''],
      ],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      // Level 3 on top of Level 2 where they overlap.
      'symbol-sort-key': ['-', 0, ['get', 'lv']],
    },
  });
}

function PinIcon({ level, unavailable = false }: { level: ChargerLevel; unavailable?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="13" fill={PIN.ring} />
      <circle cx="14" cy="14" r="11" fill={unavailable ? PIN.unavailable : PIN.fill[level]} />
      <g transform="translate(6 6) scale(0.6667)">
        {level === 3 ? (
          <path d={BOLT} fill={PIN.glyph} />
        ) : (
          <path d={PLUG} fill="none" stroke={PIN.glyph} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </g>
      {unavailable && (
        <g>
          <circle cx="22" cy="6" r="5.5" fill={PIN.badge} stroke={PIN.ring} strokeWidth="1.5" />
          <rect x="21.25" y="3" width="1.5" height="4" fill={PIN.badgeMark} />
          <rect x="21.25" y="8" width="1.5" height="1.5" fill={PIN.badgeMark} />
        </g>
      )}
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
    return (typeof window !== 'undefined' && applyMapLink(window.location.search, saved)) || saved;
  });
  // My car (B28): its plug rule for "Chargers my car can use", read from its car file.
  const [myCar, setMyCarState] = useState<MyCar | null>(() => getMyCar());
  const [carInfo, setCarInfo] = useState<CarMapInfo | null>(null);
  const [nudgeGone, setNudgeGone] = useState(() => getJSON<boolean>(KEYS.mapCarNudge, false) === true);
  const [stations, setStations] = useState<Record<ChargerLevel, MapFeature[]>>({ 3: [], 2: [] });
  const [load, setLoad] = useState<Record<ChargerLevel, Load>>({ 3: 'idle', 2: 'idle' });
  const [panelOpen, setPanelOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
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
  const placeCardRef = useRef<HTMLHeadingElement | null>(null);
  // Route mode (B50, 3.18): the planner on this map.
  const [routeMode, setRouteMode] = useState(false);
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
  const carRule = myCar ? carInfo?.rule ?? null : null;
  const dismissNudge = () => {
    setJSON(KEYS.mapCarNudge, true);
    setNudgeGone(true);
  };

  // The map itself, once.
  useEffect(() => {
    if (!box.current) return;
    const view = savedView();
    const { map, dispose } = createBaseMap({
      container: box.current,
      center: view.center,
      zoom: view.zoom,
      onStyleLoad: (m) => {
        addOverlay(m, pinsRef.current, selectedRef.current);
        addTripLayers(m, tripOverlayRef.current);
      },
    });
    mapRef.current = map;
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
        if (window.innerWidth <= 640) {
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
    if (item?.isConnected) item.focus();
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
    if (!end) return; // typing clears the pick; the card stays until a new place is picked or it is closed
    const map = mapRef.current;
    setPlace(end);
    setSelected(null);
    if (window.innerWidth <= 640) setPanelOpen(false);
    if (!map) return;
    placeRef.current?.remove();
    const dot = document.createElement('div');
    dot.className = 'map-place-pin';
    dot.setAttribute('role', 'img');
    dot.setAttribute('aria-label', end.label);
    placeRef.current = new maplibregl.Marker({ element: dot, anchor: 'bottom' }).setLngLat([end.lon, end.lat]).addTo(map);
    map.flyTo({ center: [end.lon, end.lat], zoom: Math.max(Math.min(map.getZoom(), 12), 10) });
  };
  // A picked place moves focus to its card: the phone keyboard closes so "Route here" is visible,
  // and keyboard and screen-reader users hear the place and its charger count next.
  useEffect(() => {
    if (place) placeCardRef.current?.focus({ preventScroll: true });
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
    const phone = window.innerWidth <= 640;
    map.fitBounds(boundsOf(routeData.route.coords.map((p) => [p[0], p[1]] as [number, number])), {
      padding: phone ? { top: 120, bottom: 220, left: 30, right: 30 } : { top: 40, bottom: 60, left: 420, right: 60 },
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

  // Locate me: asks the browser only on click; the position is used to centre the map and kept nowhere.
  const locateMe = () => {
    const map = mapRef.current;
    if (!map) return;
    if (!('geolocation' in navigator)) return setLocate('unsupported');
    setLocate('busy');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const at: [number, number] = [coords.longitude, coords.latitude];
        youRef.current?.remove();
        const dot = document.createElement('div');
        dot.className = 'map-you';
        dot.setAttribute('role', 'img');
        dot.setAttribute('aria-label', t('map.you'));
        youRef.current = new maplibregl.Marker({ element: dot }).setLngLat(at).addTo(map);
        map.flyTo({ center: at, zoom: Math.max(map.getZoom(), 12) }, { locate: true });
        setLocate('idle');
      },
      // 1 = PERMISSION_DENIED (compared by value: the constant isn't on every error object).
      (err) => setLocate(err.code === 1 ? 'denied' : 'failed'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };
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
  const levelLabel: Record<ChargerLevel, MessageKey> = { 3: 'map.level3', 2: 'map.level2' };

  return (
    <div className="charger-map">
      <div ref={box} className="map-canvas" role="region" aria-label={t('map.label')} />

      <div className={`map-panel${routeMode ? ' route' : ''}`}>
        {routeMode ? (
          <RoutePanel
            trip={T}
            cars={cars}
            myCar={myCar}
            onPickCar={(c) => { setMyCar(c); setMyCarState(c); }}
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
              <button type="button" className="btn small map-route-btn" onClick={() => enterRoute()}>
                {t('route.open')}
              </button>
            }
          />
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
        </button>

        <div id="map-filters" className="map-filters" hidden={!panelOpen}>
          {myCar && (
            <fieldset className="map-mycar">
              <legend className="sr-only">{t('map.myCar.legend')}</legend>
              <label className="check">
                <input
                  type="checkbox"
                  checked={filters.myCar && !!carRule}
                  disabled={!carRule}
                  aria-describedby={carInfo && !carRule ? 'map-mycar-note' : undefined}
                  onChange={() => setFilters((f) => ({ ...f, myCar: !f.myCar }))}
                />
                <span>{t('map.myCar.toggle')}</span>
              </label>
              {myCar.label && <p className="small muted">{myCar.label}</p>}
              {carInfo && !carRule && (
                <p id="map-mycar-note" className="small muted">{t('map.myCar.unknownPort')}</p>
              )}
              {filters.myCar && carRule?.superchargerAdapter && (
                <p className="small muted">{t('map.myCar.adapterNote')}</p>
              )}
            </fieldset>
          )}
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

          <fieldset>
            <legend>{t('map.plugs')}</legend>
            <ul className="plugs">
              {PLUGS.map((p) => (
                <li key={p}>
                  <label className="check">
                    <input type="checkbox" checked={filters.plugs[p]} onChange={() => toggle('plugs', p)} />
                    <span>{t(`value.${p}` as MessageKey)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <p className="legend small muted">
            <span className="legend-item"><PinIcon level={3} unavailable /> {t('map.legend.unavailable')}</span>
          </p>
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

      <button type="button" className="map-locate" onClick={locateMe} disabled={locate === 'busy'}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        <span>{t('map.locate')}</span>
      </button>
      {locateMsg[locate] && (
        <p className="map-locate-msg small" role={locate === 'busy' ? 'status' : 'alert'}>
          {t(locateMsg[locate]!)}
        </p>
      )}

      {!myCar && !nudgeGone && !place && (
        <div className="map-nudge small" role="note">
          <a href="/charging?pick=1">{t('map.nudge.set')}</a>
          <span className="muted"> {t('map.nudge.why')}</span>
          <button type="button" className="map-nudge-close" aria-label={t('map.nudge.dismiss')} onClick={dismissNudge}>
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {place && (
        <section className="map-place" aria-labelledby="map-place-name">
          <div className="map-place-head">
            <h2 id="map-place-name" ref={placeCardRef} tabIndex={-1}>{place.label}</h2>
            <button type="button" className="map-place-close" aria-label={t('map.place.close', { place: place.label })} onClick={closePlace}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="small" role="status">
            {nearCount === null
              ? t('map.place.counting')
              : nearCount === 0
                ? t('map.place.nearNone', { km: NEAR_PLACE_KM })
                : nearCount === 1
                  ? t('map.place.nearOne', { km: NEAR_PLACE_KM })
                  : t('map.place.near', { n: nearCount.toLocaleString('en-CA'), km: NEAR_PLACE_KM })}
          </p>
          <button type="button" className="btn primary" onClick={() => enterRoute({ to: place })}>{t('map.place.route')}</button>
        </section>
      )}

      {station && (
        <StationPanel
          station={station}
          updated={meta?.updated ?? null}
          onClose={closeStation}
          myCar={myCar}
          carInfo={myCar ? carInfo : null}
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

