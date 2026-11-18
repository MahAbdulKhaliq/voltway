// The charger map (charger-map.md, DESIGN-map.md M6–M8). Mounted with client:only="react":
// MapLibre draws with WebGL in the browser, so there is nothing to render at build time.
//
// Data (B78, DESIGN-7 D2, src/lib/map-tiles.ts): the Level 3 overview (o3.json: every site with a
// Level 3 port, mixed sites included, as numbers only) loads whenever either level is ticked; the
// Level 2 overview (o2.json) once Level 2 is ticked and the map is at zoom 7 or more. Full records
// come from detail tiles, loaded for an opened station, the single pins on screen from zoom 9, the
// Stations in view list and a planned trip's corridor; each swaps in for its overview record.
// Filtering runs here (src/lib/map-filter.ts) and the result goes to one clustered GeoJSON
// source with setData, so clusters always count only what the filters let through.
// A theme change swaps the base style, which drops our layers; 'style.load' adds them back.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP } from '../config.ts';
import { t, type MessageKey } from '../i18n/t.ts';
import { getJSON, setJSON, KEYS } from '../lib/storage.ts';
import type { FeatureCollection, Point } from 'geojson';
import type { MapFeature, MapMeta } from '../lib/map-data.ts';
import {
  corridorTiles,
  createTileLoader,
  decodeOverview,
  DETAIL_ZOOM,
  isFull,
  L2_MIN_ZOOM,
  mergeDetails,
  tileFor,
  type OverviewFile,
  type TileIndex,
} from '../lib/map-tiles.ts';
import type { Route } from '../lib/route-geo.ts';
import {
  applyMapLink,
  carMapInfo,
  myCarRule,
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
import PlaceField, { loadPlaces, loadUsPlaces } from './PlaceField.tsx';
import type { PlaceSearch, TripEnd } from '../lib/place-search.ts';
import { readTripLink, stationEnd, writeTripLink } from '../lib/trip-link.ts';
import { clearDrive, loadDrive } from '../lib/drive.ts';
import { readRecent } from '../lib/recent-destinations.ts';
import StationPanel from './StationPanel.tsx';
import RoutePanel from './RoutePanel.tsx';
import { useTrip } from './useTrip.ts';
import { addTripLayers, boundsOf, cancelPaint, holdTrip, paintTrip, retractTrip, setTripOverlay, STOP_LAYERS, type TripOverlay } from '../lib/trip-overlay.ts';
import { camMotion, morph, reducedMotion } from '../lib/motion.ts';
import type { IndexEntry } from '../lib/types.ts';
import { createBaseMap } from '../lib/map-base.ts';
import { haversineKm, sliceRoute } from '../lib/route-geo.ts';
import Marquee from './Marquee.tsx';
import { formatNumber, kmTo } from '../lib/units.ts';
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

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** A level's overview: every station, numbers only (B78). */
async function loadLevel(level: ChargerLevel): Promise<MapFeature[]> {
  return decodeOverview((await getJson(`${MAP.dataUrl}/o${level}.json`)) as OverviewFile);
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
  // B78: the tile index, the tile loader, every full record loaded so far, and which overview file
  // (level) each station id is in.
  const [index, setIndex] = useState<TileIndex | null>(null);
  const [indexFailed, setIndexFailed] = useState(false);
  const loaderRef = useRef(createTileLoader(MAP.dataUrl, getJson));
  const detailsRef = useRef(new Map<number, MapFeature>());
  const fileLevel = useRef(new Map<number, ChargerLevel>());
  const [plugsOpen, setPlugsOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  // Filters start open on wide screens; phones (upright or sideways, B59) start with the sheet small.
  const [panelOpen, setPanelOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768 && !matchMedia(SHEET_MEDIA).matches);
  const [selected, setSelected] = useState<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  const [meta, setMeta] = useState<MapMeta | null>(null);
  const [locate, setLocate] = useState<'idle' | 'busy' | 'denied' | 'failed' | 'unsupported'>('idle');
  const youRef = useRef<maplibregl.Marker | null>(null);
  // Where the visitor is, once Locate me found them (kept in memory only): the list says how far.
  const [you, setYou] = useState<[number, number] | null>(null);
  // The view before the trip planner moved the map (B69: leaving the trip goes back to it).
  const preTripView = useRef<{ center: maplibregl.LngLat; zoom: number } | null>(null);
  // "Stations in view" (B34): the current view, refreshed when the map stops moving.
  const [view, setView] = useState<{ bounds: Bounds; center: [number, number]; zoom: number } | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const listItemRef = useRef<HTMLButtonElement | null>(null);
  // Opened from Stations in view (back arrow) or from the map (close), B71.
  const [viaList, setViaList] = useState(false);
  // "Where to?" (B50, 3.17): a picked place flies the map there and opens its place card.
  const [placeSearch, setPlaceSearch] = useState<PlaceSearch | null>(null);
  const [place, setPlace] = useState<TripEnd | null>(null);
  const [whereKey, setWhereKey] = useState(0);
  const placeRef = useRef<maplibregl.Marker | null>(null);
  const routeBtnRef = useRef<HTMLButtonElement | null>(null);
  // Route mode (B50, 3.18): the planner on this map.
  const [routeMode, setRouteMode] = useState(false);
  /** Drive progress this tab kept across a reload (B72), handed to the trip panel once. */
  const [resumeDrive, setResumeDrive] = useState<boolean[] | null>(null);
  // Previous destinations (B62): places trips were planned to, from this browser, offered from a
  // button beside Map key. Read after load and whenever route mode opens or closes.
  const [recent, setRecent] = useState<TripEnd[]>([]);
  const [recentOpen, setRecentOpen] = useState(false);
  useEffect(() => { setRecent(readRecent(getJSON<unknown>(KEYS.recentDestinations, null))); }, [routeMode]);
  const forgetRecent = () => { setJSON(KEYS.recentDestinations, []); setRecent([]); setRecentOpen(false); };
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
  // B78 (DESIGN-7 D5): US towns load right away when the map is over the US: south of Canada's
  // southernmost point (41.7° N) or west of 141° W (Alaska). Elsewhere, few matches load them (PlaceField).
  const overUs = !!view && (view.center[1] < 41.6 || view.center[0] < -141);
  useEffect(() => { if (overUs) loadUsPlaces().catch(() => {}); }, [overUs]);
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
      setView({ bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], center: [c.lng, c.lat], zoom: map.getZoom() });
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
      map.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom, ...camMotion() });
    });
    // A pin opens its station panel; a click on empty map closes it.
    map.on('click', (e) => {
      const stopHit = map.getLayer('trip-stops') ? map.queryRenderedFeatures(e.point, { layers: STOP_LAYERS })[0] : undefined;
      if (stopHit) {
        const id = stopIdsRef.current[stopHit.properties.i as number];
        if (id !== undefined) { setViaList(false); setSelected(id); }
        return;
      }
      const hit = map.queryRenderedFeatures(e.point, { layers: ['pins', 'clusters'] })[0];
      if (!hit) setSelected(null);
      else if (hit.layer.id === 'pins') {
        setViaList(false);
        setSelected(hit.properties.i as number);
        if (matchMedia(SHEET_MEDIA).matches) {
          setPanelOpen(false);
          // Keep the pin in view between the details (top, B70) and the folded sheet.
          const at = (hit.geometry as Point).coordinates as [number, number];
          map.easeTo({ center: at, offset: [0, map.getContainer().clientHeight * 0.14], ...camMotion() });
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

  // B78: Level 2 is drawn from zoom 7; below it the Level 2 boxes count as unticked and a hint shows.
  const l2On = (view?.zoom ?? 0) >= L2_MIN_ZOOM;
  const shownFilters = useMemo<MapFilters>(
    () => (l2On ? filters : { ...filters, levels: { ...filters.levels, 2: false } }),
    [filters, l2On],
  );

  // Station data: each overview loads the first time it is needed (o3.json for either level).
  useEffect(() => {
    for (const lv of LEVELS) {
      // o3.json also holds every mixed site (Level 3 and Level 2 ports), so the Level 2 view needs it too.
      const needed = lv === 3 ? filters.levels[3] || filters.levels[2] || place !== null || routeMode : filters.levels[2] && l2On;
      if (!needed || load[lv] !== 'idle') continue;
      setLoad((s) => ({ ...s, [lv]: 'loading' }));
      loadLevel(lv).then(
        (features) => {
          for (const f of features) fileLevel.current.set(f.properties.i, lv);
          setStations((s) => ({ ...s, [lv]: mergeDetails(features, detailsRef.current) }));
          setLoad((s) => ({ ...s, [lv]: 'ready' }));
        },
        () => setLoad((s) => ({ ...s, [lv]: 'error' })),
      );
    }
  }, [filters.levels, load, place, routeMode, l2On]);

  // The tile index (small): needed before any detail tile.
  useEffect(() => {
    getJson(`${MAP.dataUrl}/tiles/index.json`).then((x) => setIndex(x as TileIndex), () => setIndexFailed(true));
  }, []);

  /** Loads detail tiles once each and swaps their full records into the station lists. */
  const ensureTiles = useCallback(async (lv: ChargerLevel, keys: readonly string[]): Promise<MapFeature[]> => {
    if (!keys.length) return [];
    const features = await loaderRef.current.load(lv, keys);
    let fresh = false;
    for (const f of features) {
      if (detailsRef.current.get(f.properties.i) === f) continue;
      detailsRef.current.set(f.properties.i, f);
      fresh = true;
    }
    if (fresh) setStations((s) => ({ ...s, [lv]: mergeDetails(s[lv], detailsRef.current) }));
    return features;
  }, []);
  // QA 2026-11-18 (S3): a tile that fails to load says so, with a retry, instead of leaving the panel
  // closed or the list on "Loading stations…". A failed tile is dropped from the loader's cache, so a retry asks again.
  const [tilesFailed, setTilesFailed] = useState(false);
  /** Loads the tiles holding these station ids (those not loaded yet), up to `cap` tiles. */
  const ensureStations = useCallback((ids: Iterable<{ i: number; at: readonly [number, number] }>, cap = 24) => {
    if (!index) return;
    const want: Record<ChargerLevel, Set<string>> = { 3: new Set(), 2: new Set() };
    for (const { i, at } of ids) {
      if (detailsRef.current.has(i)) continue;
      const lv = fileLevel.current.get(i);
      if (!lv) continue;
      const key = tileFor(index, lv, at[0], at[1]);
      if (key && !loaderRef.current.has(lv, key)) want[lv].add(key);
    }
    for (const lv of LEVELS) if (want[lv].size) ensureTiles(lv, [...want[lv]].slice(0, cap)).then(() => setTilesFailed(false), () => setTilesFailed(true));
  }, [index, ensureTiles]);

  // Filters → pins → map source; choices are saved.
  // The overviews never overlap (o3 = any Level 3 port, o2 = Level 2-only), so merging is safe.
  const pins = useMemo(
    () => filterStations([...stations[3], ...(l2On ? stations[2] : [])], shownFilters, carRule),
    [stations, shownFilters, carRule, l2On],
  );
  useEffect(() => {
    pinsRef.current = pins;
    (mapRef.current?.getSource('stations') as GeoJSONSource | undefined)?.setData(pins);
  }, [pins]);
  useEffect(() => setJSON(KEYS.mapFilters, filters), [filters]);

  // The selected station: looked up from the loaded data, ringed on the map.
  // B78: only a full record (from its detail tile) opens the panel; the tile loads on selection.
  const selectedFeature = useMemo(() => {
    if (selected === null) return null;
    return stations[3].find((f) => f.properties.i === selected) ?? stations[2].find((f) => f.properties.i === selected) ?? null;
  }, [selected, stations]);
  const station = selectedFeature && isFull(selectedFeature) ? selectedFeature : null;
  useEffect(() => {
    if (selectedFeature && !isFull(selectedFeature)) ensureStations([{ i: selectedFeature.properties.i, at: selectedFeature.geometry.coordinates }]);
  }, [selectedFeature, ensureStations]);
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

  // Stations in view (B62): the count of stations on screen now is the switch's number, so it is
  // worked out on every move; the list itself shows only while the switch is on.
  const list = useMemo(
    () => (view ? stationsInView([...stations[3], ...(l2On ? stations[2] : [])], shownFilters, view.bounds, view.center, undefined, carRule) : null),
    [view, stations, shownFilters, carRule, l2On],
  );
  // The list's names come from detail tiles: load the ones its rows need while it is open.
  useEffect(() => {
    if (listOpen && list) ensureStations(list.items);
  }, [listOpen, list, ensureStations]);
  const listNamed = !list || list.items.every((it) => it.name !== '');
  // From zoom 9 the single pins on screen (not clusters) get their detail tiles, so opening one is instant.
  // Also once the map has drawn: on a first load at zoom 9+ the pins aren't rendered yet when this runs.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !view || view.zoom < DETAIL_ZOOM) return;
    const run = () => {
      if (!map.getLayer('pins')) return;
      const seen = map.queryRenderedFeatures({ layers: ['pins'] });
      ensureStations(seen.map((f) => ({ i: Number(f.properties?.i), at: (f.geometry as Point).coordinates as [number, number] })));
    };
    run();
    map.once('idle', run);
    return () => { map.off('idle', run); };
  }, [view, pins, ensureStations]);
  // Back from a station's details to the list, focusing the row it was opened from.
  const backTo = useRef<number | null>(null);
  const backToList = useCallback(() => {
    backTo.current = selectedRef.current;
    listItemRef.current = null;
    morph(() => setSelected(null), 'back');
  }, []);
  useEffect(() => {
    if (selected !== null || backTo.current === null) return;
    const row = document.querySelector<HTMLButtonElement>(`#map-list button[data-i="${backTo.current}"]`);
    backTo.current = null;
    if (row) row.focus();
    else document.querySelector<HTMLButtonElement>('.map-inview-toggle')?.focus();
  }, [selected]);
  const away = (km: number) => {
    const v = kmTo(km, T.unit);
    return t('map.list.away', { distance: t(T.unit === 'mi' ? 'fmt.mi' : 'fmt.km', { value: formatNumber(v, v < 10 ? 1 : 0) }) });
  };
  const openFromList = (item: ListItem, el: HTMLButtonElement) => {
    listItemRef.current = el;
    morph(() => { setViaList(true); setSelected(item.i); });
    mapRef.current?.easeTo({ center: item.at, ...camMotion() });
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
    map.flyTo({ center: [end.lon, end.lat], zoom: Math.max(Math.min(map.getZoom(), 12), 10), curve: 1.2, duration: 750, ...camMotion() });
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

  // B78 (7.8): the planner gets the full Level 3 records of the tiles along the route.
  const corridor = useCallback(
    (route: Route) => (index ? ensureTiles(3, corridorTiles(index, 3, route.coords)) : Promise.reject(new Error('no tile index'))),
    [index, ensureTiles],
  );
  const T = useTrip(myCar, index ? corridor : null, indexFailed);
  const { plan, routeData } = T;
  // B78: the US AFDC pull date, for US stations and US trips (the top-level date is Canada's).
  const updatedUs = meta?.sources?.find((x) => x.source_id === 'src-afdc-us')?.fetched_at.slice(0, 10) ?? null;
  const usTrip = routeData?.countries?.length === 1 && routeData.countries[0] === 'us';
  // B59: on phones the panel is a draggable bottom sheet over a full-height map.
  // Owner (B59 follow-up): on the plain map, dragging the sheet up opens the Chargers filters and
  // dragging it back down to peek closes them.
  const sheet = useMapSheet((s) => { if (!routeMode) setPanelOpen(s !== 'peek'); });
  // Phones (B71): the list box is three rows tall and scrolls through the rest, so it never
  // covers much of the map.
  const listBox = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = listBox.current;
    if (!el) return;
    const third = sheet.phone ? el.querySelectorAll('li')[2] : undefined;
    el.style.maxHeight = third ? `${Math.ceil(third.getBoundingClientRect().bottom - el.getBoundingClientRect().top + el.scrollTop) + 6}px` : '';
  }, [list, listOpen, sheet.phone, you, T.unit]);
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
      // The trip's body is what scrolls (B69); its header stays.
      const panel = sheet.panelRef.current?.querySelector<HTMLElement>('.route-body'), warn = panel?.querySelector<HTMLElement>('.ti-gap-warn');
      if (!panel || !warn || !sheet.phone) return;
      const below = warn.getBoundingClientRect().top - panel.getBoundingClientRect().top;
      if (below > 0 && warn.getBoundingClientRect().bottom > panel.getBoundingClientRect().bottom) panel.scrollTop += below - 8;
    }, 300);
    return () => clearTimeout(timer);
  }, [T.current, setSnap]); // eslint-disable-line react-hooks/exhaustive-deps
  const enterRoute = useCallback((opts: Parameters<typeof T.start>[0] = {}) => {
    placeRef.current?.remove();
    placeRef.current = null;
    setPlace(null);
    setSelected(null);
    morph(() => {
      setRouteMode(true);
      setPanelOpen(true);
      T.start(opts);
    }, 'forward', 'left');
  }, [T.start]); // eslint-disable-line react-hooks/exhaustive-deps
  const closeRoute = () => {
    clearTripParams();
    clearDrive(); // closing the trip (button or Escape) ends Drive for this tab
    // B69: the camera goes back to where it was before the trip, while the line draws back.
    const back = preTripView.current;
    preTripView.current = null;
    if (back) mapRef.current?.easeTo({ center: back.center, zoom: back.zoom, duration: 900, ...camMotion() });
    // B67: the trip panel slides back to "Where to?" and the filters.
    morph(() => {
      T.stop();
      // Phones: back to the plain map with the sheet small (route mode had opened the panel).
      if (sheet.phone) setPanelOpen(false);
      setRouteMode(false);
      setSelected(null);
      setWhereKey((k) => k + 1); // focus back to the "Where to?" box
    }, 'back', 'left');
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
    // B72: this tab was in Drive mode before the page reloaded (a phone coming back from the maps
    // app); a trip link still in the address resumes it too when it is the same trip.
    const drive = loadDrive();
    if (link) {
      if (drive && writeTripLink(drive.trip) === writeTripLink(link)) setResumeDrive(drive.reached);
      enterRoute({ link });
      return;
    }
    if (drive) { setResumeDrive(drive.reached); enterRoute({ link: drive.trip }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Drive mode's position: the same "you" dot as Locate me, moved as the car moves (memory only).
  const onDriveFix = useCallback((at: [number, number] | null) => {
    const map = mapRef.current;
    if (!map || !at) return;
    if (youRef.current) youRef.current.setLngLat(at);
    else {
      const dot = document.createElement('div');
      dot.className = 'map-you';
      dot.setAttribute('role', 'img');
      dot.setAttribute('aria-label', t('map.you'));
      youRef.current = new maplibregl.Marker({ element: dot }).setLngLat(at).addTo(map);
    }
    setYou(at);
  }, []);

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
    const was = tripOverlayRef.current;
    tripOverlayRef.current = o;
    const map = mapRef.current;
    if (!(map?.isStyleLoaded() || map?.getSource('stations'))) return;
    // B69: a trip going away draws itself back along the road before it is cleared.
    if (!o && was && !reducedMotion() && map.getSource('trip-line')) {
      retractTrip(map, was, () => { if (!tripOverlayRef.current) setTripOverlay(map, null); });
      return;
    }
    setTripOverlay(map, o);
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
    // B64: the line is held back while the map flies to it, then paints itself along the road.
    const animate = !reducedMotion() && Boolean(map.getSource('trip-line'));
    if (animate) holdTrip(map);
    if (!preTripView.current) preTripView.current = { center: map.getCenter(), zoom: map.getZoom() };
    let painted = false;
    const paint = () => {
      if (painted) return;
      painted = true;
      const o = tripOverlayRef.current;
      if (o) paintTrip(map, o);
      else cancelPaint(map);
    };
    if (animate) {
      map.once('moveend', paint);
      window.setTimeout(paint, 900); // a fit that doesn't move the map fires no moveend
    }
    map.fitBounds(boundsOf(routeData.route.coords.map((p) => [p[0], p[1]] as [number, number])), {
      padding: phone ? { top: 84, bottom: sheet.heightFor('half') + 24, left: 28, right: 64 } : { top: 40, bottom: 60, left: 420, right: 60 },
      duration: 600,
      ...camMotion(),
    });
  }, [routeMode, routeData, T.current]);
  useEffect(() => { if (!routeMode) fittedKey.current = ''; }, [routeMode]);
  const openStop = (i: number, button: HTMLButtonElement) => {
    const st = plan?.stops[i];
    if (!st) return;
    listItemRef.current = button;
    setViaList(false);
    setSelected(st.station.i);
    mapRef.current?.easeTo({ center: st.lonLat, ...camMotion() });
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
        setYou(at);
        if (!(auto && interactedRef.current)) map.flyTo({ center: at, zoom: Math.max(map.getZoom(), 12), ...camMotion() }, { locate: true });
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
    if (readTripLink(window.location.search) || loadDrive() || !('geolocation' in navigator)) return;
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

  const wanted = (lv: ChargerLevel) => (lv === 3 ? filters.levels[3] || filters.levels[2] : filters.levels[2] && l2On);
  const busy = LEVELS.some((lv) => wanted(lv) && load[lv] === 'loading');
  const failed = LEVELS.some((lv) => wanted(lv) && load[lv] === 'error');
  /** The car filter in force (ticked, and the car's port is known). */
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
            updated={usTrip ? updatedUs : meta?.updated ?? null}
            resumeDrive={resumeDrive}
            onDriveFix={onDriveFix}
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
              <button type="button" ref={routeBtnRef} className="btn small primary map-route-btn" onClick={() => enterRoute(place ? { to: place } : {})}>
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

        <div id="map-filters" className={`map-filters fold${panelOpen ? '' : ' shut'}`}>
          <div className="map-filters-body">
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
          <div className={`fold${plugsOpen ? '' : ' shut'}`}><div>
          <fieldset id="map-plugs">
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
          </div></div>
          </div>
          </div>
        </div>

        <p className="map-count small" role="status" aria-live="polite">
          {failed
            ? t('map.dataError')
            : busy
              ? <><span className="road-loader" aria-hidden="true"><span /></span>{filters.levels[2] && load[2] === 'loading' ? t('map.loadingL2') : t('map.loadingStations')}</>
              : filters.levels[2] && !l2On
                ? t('map.zoomForL2')
                : null}
        </p>
        </>)}
      </div>

      <div className="map-corner">
      {locateMsg[locate] && (
        <p className="map-locate-msg small" role={locate === 'busy' ? 'status' : 'alert'}>
          {t(locateMsg[locate]!)}
        </p>
      )}
      {recentOpen && recent.length > 0 && (
        <section id="map-recent" className="map-key map-recent" aria-labelledby="map-recent-title">
          <h2 id="map-recent-title" className="map-key-title">{t('map.recent.title')}</h2>
          <ul>
            {recent.map((d) => (
              <li key={`${d.label}-${d.lat}`}>
                <button type="button" className="map-recent-item" aria-label={t('map.recent.plan', { place: d.label })} onClick={() => { setRecentOpen(false); enterRoute({ to: d }); }}>
                  <span className="map-recent-name">{d.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="link-btn small map-recent-forget" onClick={forgetRecent}>{t('map.recent.forget')}</button>
        </section>
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
      {recent.length > 0 && !routeMode && (
        <button type="button" className="map-key-btn" aria-expanded={recentOpen} aria-controls="map-recent" onClick={() => { setKeyOpen(false); setRecentOpen((o) => !o); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12a8 8 0 1 0 2.6-5.9M4 5v4h4M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="map-btn-label">{t('map.recent.toggle')}</span>
        </button>
      )}
      <button type="button" className="map-key-btn" aria-expanded={keyOpen} aria-controls="map-key" onClick={() => { setRecentOpen(false); setKeyOpen((o) => !o); }}>
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


      {!routeMode && !station && (
        <section className={`map-inview${listOpen ? ' open' : ''}`} aria-label={t('map.list.toggle')}>
          <button
            type="button"
            role="switch"
            aria-checked={listOpen}
            aria-controls="map-list"
            className="map-inview-toggle"
            onClick={() => { if (sheet.phone && !listOpen) setPanelOpen(false); setListOpen((o) => !o); }}
          >
            <span className="map-inview-name">{t('map.list.toggle')}</span>
            <span className="map-inview-count">{busy || !list ? <span className="road-loader" aria-hidden="true"><span /></span> : list.total.toLocaleString('en-CA')}</span>
            <span className="map-switch" aria-hidden="true"><span /></span>
          </button>
          {list && (
            <div className={`fold map-list-fold${listOpen ? '' : ' shut'}`}>
            <div id="map-list" className="map-list" ref={listBox}>
              {list.total === 0 ? (
                <p className="small muted">{t('map.list.none')}</p>
              ) : !listNamed ? (
                <p className="small muted"><span className="road-loader" aria-hidden="true"><span /></span>{t('map.list.loading')}</p>
              ) : (
                <>
                  <ul aria-label={t('map.list.label')}>
                    {list.items.map((it) => (
                      <li key={it.i}>
                        <button type="button" data-i={it.i} onClick={(e) => openFromList(it, e.currentTarget)}>
                          <Marquee className="map-list-name">{it.name}</Marquee>
                          {/* B69: power · place · how far (once Locate me knows where you are). B70 phones:
                              three short lines, name / kW · place / distance, without "up to". */}
                          {sheet.phone ? (
                            <>
                              <Marquee className="small muted map-list-meta">
                                {[it.maxKw == null ? t('map.station.unknownPower') : t('fmt.kw', { value: kwText(it.maxKw) }), it.city].filter(Boolean).join(' · ')}
                              </Marquee>
                              {you && <span className="small muted map-list-away">{away(haversineKm(you, it.at))}</span>}
                            </>
                          ) : (
                          <span className="small muted map-list-meta">
                            {[
                              it.maxKw == null ? t('map.station.unknownPower') : t('map.list.upTo', { kw: kwText(it.maxKw) }),
                              it.city,
                              you ? away(haversineKm(you, it.at)) : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {list.total > list.items.length && <p className="small muted map-list-note">{t('map.list.nearest', { shown: list.items.length })}</p>}
                </>
              )}
            </div>
            </div>
          )}
        </section>
      )}

      {station && (
        <StationPanel
          station={station}
          updated={meta?.updated ?? null}
          updatedUs={updatedUs}
          ocmUpdated={meta?.ocm?.updated ?? null}
          onClose={closeStation}
          onBack={listOpen && viaList ? backToList : undefined}
          myCar={myCar}
          carInfo={myCar && carInfo ? { ...carInfo, rule: carRule } : null}
          onRouteHere={selectedStop === null ? () => enterRoute({ to: stationEnd(station) }) : undefined}
        />
      )}

      {mapStatus === 'loading' && (
        <p className="map-status map-status-loading" role="status">
          <span className="road-loader" aria-hidden="true"><span /></span>
          {t('map.loading')}
        </p>
      )}
      {tilesFailed && mapStatus !== 'error' && (
        <p className="map-status banner" role="alert">
          {t('map.tilesFailed')}{' '}
          <button type="button" className="btn small" onClick={() => { setTilesFailed(false); setView((v) => (v ? { ...v } : v)); if (selectedFeature) ensureStations([{ i: selectedFeature.properties.i, at: selectedFeature.geometry.coordinates }]); }}>
            {t('map.tilesRetry')}
          </button>
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

