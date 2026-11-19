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
  pinDiff,
  pinIndex,
  readFilters,
  type PinIndex,
  type PinProps,
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
  speedTier,
  CLUSTER_PROPERTIES,
  clusterImage,
  drawMark,
  MAP_MARK,
  parseMarkName,
  pinImage,
  TAG_ALWAYS_ZOOM,
  TAG_MIN_ZOOM,
  tagsFit,
  PIN,
  PLUG,
  TESLA_T,
} from '../lib/map-icons.ts';
import { fastNear, NEAR_PLACE_KM, stationsInView, type Bounds, type ListItem } from '../lib/map-list.ts';
import PlaceField, { loadPlaces, loadUsPlaces } from './PlaceField.tsx';
import PlugIcon from './PlugIcon.tsx';
import { SpeedMark } from './SpeedIcon.tsx';
import type { PlaceSearch, TripEnd } from '../lib/place-search.ts';
import { readTripLink, stationEnd, writeTripLink } from '../lib/trip-link.ts';
import { clearDrive, loadDrive } from '../lib/drive.ts';
import { readRecent } from '../lib/recent-destinations.ts';
import StationPanel from './StationPanel.tsx';
import RoutePanel from './RoutePanel.tsx';
import { useTrip } from './useTrip.ts';
import { addTripLayers, boundsOf, cancelPaint, holdTrip, paintTrip, retractTrip, setTagsFrom, setTripOverlay, STOP_LAYERS, tagsFrom, type TripOverlay } from '../lib/trip-overlay.ts';
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

const EMPTY: FeatureCollection<Point, PinProps> = { type: 'FeatureCollection', features: [] };

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
    // B82 (owner, 2026-11-18): 64 px (was 48), so a city view shows fewer, larger groups.
    clusterRadius: 64,
    // B57 (owner, 2026-11-17): grouped up to zoom 15, so pins and their tags pile up less downtown.
    clusterMaxZoom: 15,
    // Station ids as feature ids, so a filter change can send just the pins that changed (updateData).
    promoteId: 'i',
    clusterProperties: CLUSTER_PROPERTIES as Record<string, unknown>,
  } as maplibregl.GeoJSONSourceSpecification);
  // Clusters (B54): a disc split into its Level 2 and Level 3 parts, with speed and plug tags.
  map.addLayer({
    id: 'clusters',
    type: 'symbol',
    source: 'stations',
    filter: ['has', 'point_count'],
    layout: {
      'icon-image': clusterImage(trip, tagsFrom(map)) as maplibregl.ExpressionSpecification,
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
      'icon-image': pinImage(trip, tagsFrom(map)) as maplibregl.ExpressionSpecification,
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

/** B89 round 4: a row's speed at a glance, as the map's tags: bolts for Level 3, the plug for Level 2. */
function ListSpeed({ it }: { it: ListItem }) {
  return it.level === 2 ? <SpeedMark tier={0} level2 /> : <SpeedMark tier={speedTier(it.maxKw)} />;
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

/** B89: how close a charger or trip stop opened from a list is shown, and a border crossing. */
const CLOSE_ZOOM = 15;
const BORDER_ZOOM = 12;
/** B89: the trip's start or destination, shown as a town. */
const END_ZOOM = 13;
/** The station panel's width plus its margin on wide screens (global.css .station-panel). */
const STATION_PANEL_PX = 352;
// B89 (owner: the close-in flights felt slow and swoopy): a flatter arc and a set, short duration
// that grows a little with the distance. A set duration, not maxDuration: MapLibre drops a flight
// longer than maxDuration to a jump cut, which is what a far charger got.
function quickFly(map: maplibregl.Map, at: maplibregl.LngLatLike, zoom: number) {
  const a = map.project(at), c = map.project(map.getCenter());
  const px = Math.hypot(a.x - c.x, a.y - c.y);
  const dz = Math.abs(zoom - map.getZoom());
  return { curve: 1.2, duration: Math.round(Math.min(1100, 450 + px / 6 + dz * 45)) };
}

export default function ChargerMap({ cars = [] }: { cars?: IndexEntry[] }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pinsRef = useRef<FeatureCollection<Point, PinProps>>(EMPTY);
  // The pins the map's source holds now, by station id: filter changes send only the difference.
  const sentRef = useRef<PinIndex | null>(null);
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
  // The overviews alone, for the pins: a detail record never changes a pin (same ports, network and
  // Tesla flag; checked on every tile), so loading detail tiles must not re-send ~20k pins to the map.
  const [overview, setOverview] = useState<Record<ChargerLevel, MapFeature[]>>({ 3: [], 2: [] });
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
  // B89: the camera before a charger was opened from Stations in view, and whether the visitor
  // has moved the map since (Back only flies back when they haven't).
  // The phone sheet's height setter, for the map's own click handlers (set once the sheet exists).
  const setSnapRef = useRef<(s: 'peek' | 'half' | 'full') => void>(() => {});
  const detailCam = useRef<{ center: maplibregl.LngLat; zoom: number; moved: boolean; landed?: { center: maplibregl.LngLat; zoom: number } } | null>(null);
  // B89: the trip spot the camera was flown to from the trip list: "border-<k>", "from" or "to"
  // (tapping it again goes back to the whole route).
  const [spotFocus, setSpotFocus] = useState<string | null>(null);
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
  // Memoised: the pins depend on it, and a new rule each render re-sent every pin to the map on
  // every render (~100 ms each with US data; it starved the trip's paint, optimize pass 2026-11-18).
  const plugKey = myCar ? (myCar.plugs ?? []).join(',') + (myCar.plugs ? '' : '|default') : null;
  const carRule = useMemo(() => (myCar ? myCarRule(carInfo, myCar.plugs) : null), [carInfo, plugKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // The map itself, once.
  useEffect(() => {
    if (!box.current) return;
    const view = savedView();
    const { map, dispose } = createBaseMap({
      container: box.current,
      center: view.center,
      zoom: view.zoom,
      onStyleLoad: (m) => {
        // A new style starts a new source holding all current pins: later changes diff against those.
        if (!m.getSource('stations')) sentRef.current = pinIndex(pinsRef.current);
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
    // B82: speed and plug tags show from city zoom only while the screen isn't crowded. Counted each
    // time the map settles; switching tags doesn't change the count, so this settles too.
    map.on('idle', () => {
      if (!map.getLayer('pins')) return;
      const marks = map.queryRenderedFeatures({ layers: ['pins', 'clusters'] }).length;
      const c = map.getCanvas();
      const fit = tagsFit(marks, c.clientWidth, c.clientHeight, tagsFrom(map) === TAG_MIN_ZOOM);
      setTagsFrom(map, fit ? TAG_MIN_ZOOM : TAG_ALWAYS_ZOOM);
    });
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
        if (id !== undefined) { setViaList(false); setSpotFocus(null); setSelected(id); }
        return;
      }
      const hit = map.queryRenderedFeatures(e.point, { layers: ['pins', 'clusters'] })[0];
      if (!hit) setSelected(null);
      else if (hit.layer.id === 'pins') {
        setViaList(false);
        detailCam.current = null;
        setSelected(hit.properties.i as number);
        if (matchMedia(SHEET_MEDIA).matches) {
          setSnapRef.current('peek');
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
      cancelPaint(map); // a trip paint still running would draw on the removed map
      dispose();
      mapRef.current = null;
    };
  }, []);

  // B81 (owner, 2026-11-18): Level 2 shows at every zoom while ticked (B78 drew it only from zoom 7,
  // so zoomed-out clusters lost their Level 2 counts). o2.json still loads only once Level 2 is ticked.
  const l2On = filters.levels[2];
  const shownFilters = filters;

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
          setOverview((s) => ({ ...s, [lv]: features }));
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
    () => filterStations([...overview[3], ...(l2On ? overview[2] : [])], shownFilters, carRule),
    [overview, shownFilters, carRule, l2On],
  );
  useEffect(() => {
    pinsRef.current = pins;
    const src = mapRef.current?.getSource('stations') as GeoJSONSource | undefined;
    if (!src) return;
    // Only the pins that changed go to the map's worker; a change to most of them (Level 2 on or
    // off) is sent whole, which costs the same and skips the bookkeeping.
    const d = sentRef.current ? pinDiff(sentRef.current, pins) : null;
    if (!d || d.remove.length + d.add.length > pins.features.length / 2) {
      src.setData(pins);
      sentRef.current = d ? d.index : pinIndex(pins);
    } else if (d.remove.length || d.add.length) {
      src.updateData({ remove: d.remove, add: d.add });
      sentRef.current = d.index;
    }
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
    detailCam.current = null;
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
    const cam = detailCam.current, map = mapRef.current;
    detailCam.current = null;
    // Moved = a drag or zoom since (browser event), or the camera is no longer where the flight landed.
    const off = !cam?.landed || !map || Math.abs(map.getZoom() - cam.landed.zoom) > 0.01 || map.project(cam.landed.center).dist(map.project(map.getCenter())) > 2;
    if (cam && map && !cam.moved && !off) map.flyTo({ center: cam.center, zoom: cam.zoom, ...quickFly(map, cam.center, cam.zoom), ...camMotion() });
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
    const map = mapRef.current;
    if (map && !detailCam.current) detailCam.current = { center: map.getCenter(), zoom: map.getZoom(), moved: false };
    morph(() => { setViaList(true); setSelected(item.i); });
    // Where the flight lands (an interrupted flight lands where it stopped).
    map?.once('moveend', () => { if (detailCam.current) detailCam.current.landed = { center: map.getCenter(), zoom: map.getZoom() }; });
    flyClose(item.at);
  };
  // B89: close in on a charger, a trip stop or a border crossing, centred in the map left clear by
  // the panels: on wide screens the filter or trip panel on the left and, when details open, the
  // station panel on the right (340 px + margins); on phones the details sit top left, the sheet below.
  const flyClose = (at: [number, number], zoom = CLOSE_ZOOM, details = true) => {
    const map = mapRef.current;
    if (!map) return;
    const phone = matchMedia(SHEET_MEDIA).matches;
    const box = map.getContainer().getBoundingClientRect();
    const left = phone ? 0 : Math.max(0, (sheet.panelRef.current?.getBoundingClientRect().right ?? box.left) - box.left);
    const right = phone || !details ? 0 : STATION_PANEL_PX;
    const z = Math.max(map.getZoom(), zoom);
    map.flyTo({ center: at, zoom: z, offset: phone ? [0, phoneAim(box.height, details) - box.height / 2] : [(left - right) / 2, 0], ...quickFly(map, at, z), ...camMotion() });
  };
  // Phones (B89 round 3): the sheet stays at the height the visitor left it, so the spot lands in
  // the middle of the map that shows between the top (or a stop's details, top left) and the sheet.
  const phoneAim = (mapH: number, details: boolean) => {
    const sheetH = sheet.panelRef.current?.getBoundingClientRect().height ?? 0;
    const top = details ? 64 + Math.min(288, Math.max(0, mapH - 64 - 216)) : 64;
    const bottom = mapH - sheetH;
    return bottom - top >= 48 ? (top + bottom) / 2 : Math.max(32, bottom / 2);
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
    if (sheet.phone) sheet.setSnap('peek');
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
  // B89 (owner, replaces the B59 follow-up): the Chargers filters are always open in the sheet;
  // dragging it only changes its height.
  const sheet = useMapSheet();
  setSnapRef.current = sheet.setSnap;
  const filtersOpen = panelOpen || sheet.phone;
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
  // B89 round 4: the trip at peek shows its vital lines only: nothing scrolls, the car card can't
  // be used, and lowering the sheet brings the trip back to its top.
  const routePeek = sheet.phone && routeMode && sheet.snap === 'peek' && !sheet.dragging;
  useEffect(() => {
    if (!routePeek) return;
    const body = sheet.panelRef.current?.querySelector<HTMLElement>('.route-body');
    body?.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [routePeek]); // eslint-disable-line react-hooks/exhaustive-deps
  // A trip opens the sheet half way (B89: otherwise the sheet stays where the visitor left it).
  useEffect(() => {
    if (routeMode) setSnap((s) => (s === 'full' ? s : 'half'));
  }, [routeMode, setSnap]);
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
    // B89 (replaces B69's fly-back): the camera stays on the whole route, flying back to it if the
    // visitor had closed in on a stop, so the line is seen drawing back.
    if (selectedRef.current !== null || spotFocus !== null) fitRoute({ peek: true });
    // B67: the trip panel slides back to "Where to?" and the filters.
    morph(() => {
      T.stop();
      // Phones: back to the plain map with the sheet small (route mode had opened the panel).
      if (sheet.phone) sheet.setSnap('peek');
      setRouteMode(false);
      setSelected(null);
      setWhereKey((k) => k + 1); // focus back to the "Where to?" box (not on touch screens)
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
  /** The camera has arrived but the stops are still being planned: the overlay effect paints when they land. */
  const paintPending = useRef(false);
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
            borders: (routeData.crossings ?? [])
              .filter((c) => c.i >= 0 && c.i < routeData.route.coords.length)
              .map((c) => [routeData.route.coords[c.i][0], routeData.route.coords[c.i][1]] as [number, number]),
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
    // The stops came after the camera arrived (slow tiles or network): paint now instead of skipping it.
    if (o && paintPending.current) { paintPending.current = false; paintTrip(map, o); }
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
    let painted = false;
    const paint = () => {
      if (painted) return;
      painted = true;
      const o = tripOverlayRef.current;
      paintPending.current = !o;
      if (o) paintTrip(map, o);
    };
    if (animate) {
      map.once('moveend', paint);
      window.setTimeout(paint, 900); // a fit that doesn't move the map fires no moveend
    }
    fitRoute({ phone });
  }, [routeMode, routeData, T.current]);
  useEffect(() => { if (!routeMode) fittedKey.current = ''; }, [routeMode]);
  useEffect(() => { setSpotFocus(null); }, [routeMode, routeData]);
  /** The whole route in view beside the panel (or above the sheet on phones; peek when the trip is closing). */
  // The route fits above the sheet at its height now (or peek, when the trip is closing), keeping
  // at least a strip of map when the sheet is up full.
  function phoneSheetPad(peek: boolean) {
    const mapH = mapRef.current?.getContainer().clientHeight ?? 800;
    const sheetH = peek ? sheet.heightFor('peek') : (sheet.panelRef.current?.getBoundingClientRect().height ?? sheet.heightFor('half'));
    return Math.min(sheetH + 24, mapH - 84 - 120);
  }
  function fitRoute({ phone = sheet.phone, peek = false }: { phone?: boolean; peek?: boolean } = {}) {
    const map = mapRef.current;
    if (!map || !routeData) return;
    map.fitBounds(boundsOf(routeData.route.coords.map((p) => [p[0], p[1]] as [number, number])), {
      padding: phone ? { top: 84, bottom: phoneSheetPad(peek), left: 28, right: 64 } : { top: 40, bottom: 60, left: 420, right: 60 },
      duration: 600,
      ...camMotion(),
    });
  }
  // B89: the stop number is the button. It closes in on the stop and opens its details; the same
  // stop again (or Back from its details) goes back to the whole route.
  const backToRoute = () => {
    const btn = listItemRef.current;
    listItemRef.current = null;
    morph(() => setSelected(null), 'back');
    fitRoute();
    if (btn?.isConnected && btn.offsetParent !== null) btn.focus();
  };
  const openStop = (i: number, button: HTMLButtonElement) => {
    const st = plan?.stops[i];
    if (!st) return;
    setSpotFocus(null);
    if (selectedStop === i) { listItemRef.current = button; backToRoute(); return; }
    listItemRef.current = button;
    setViaList(false);
    morph(() => setSelected(st.station.i));
    flyClose(st.lonLat); // B89 round 3: the sheet keeps its height
  };
  // B89: a border row's diamond, or the start or destination mark, closes in on that spot; the
  // same one again goes back.
  const openSpot = (k: string, at: [number, number]) => {
    setSelected(null);
    if (spotFocus === k) { setSpotFocus(null); fitRoute(); return; }
    setSpotFocus(k);
    flyClose(at, k.startsWith('border') ? BORDER_ZOOM : END_ZOOM, false);
  };

  // Locate me: on load (B56) and on click; the position is used to centre the map and kept nowhere.
  // auto = the locate on load (B56): it shows no messages, and it does not move the map once the
  // visitor has moved it, picked a place or opened the trip planner (the answer can come late).
  // B89 round 4 (owner): finding the visitor shows the map's loading message (road loader), for
  // Locate me and for the locate on load when permission is already granted (a pending browser
  // prompt shows nothing of ours).
  const [autoLocating, setAutoLocating] = useState(false);
  const locateMe = (auto = false, showBusy = false) => {
    const map = mapRef.current;
    if (!map) return;
    if (!('geolocation' in navigator)) return auto ? undefined : setLocate('unsupported');
    if (!auto) setLocate('busy');
    if (auto && showBusy) setAutoLocating(true);
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
        setAutoLocating(false);
      },
      // 1 = PERMISSION_DENIED (compared by value: the constant isn't on every error object).
      (err) => { setAutoLocating(false); if (!auto) setLocate(err.code === 1 ? 'denied' : 'failed'); },
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
    const moved = (e: { originalEvent?: unknown }) => {
      if (!e.originalEvent) return;
      interactedRef.current = true;
      if (detailCam.current) detailCam.current.moved = true;
    };
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
      .then((s) => s.state !== 'denied' && locateMe(true, s.state === 'granted'), () => locateMe(true));
  }, [mapStatus]); // eslint-disable-line react-hooks/exhaustive-deps
  // Failure messages clear themselves; the button stays for another try.
  useEffect(() => {
    if (locate === 'idle' || locate === 'busy') return;
    const id = setTimeout(() => setLocate('idle'), 10000);
    return () => clearTimeout(id);
  }, [locate]);
  const locateMsg: Partial<Record<typeof locate, MessageKey>> = {
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

      <div className={`map-panel${routeMode ? ' route' : ''}${sheet.phone && !routeMode && sheet.snap === 'peek' && !sheet.dragging ? ' peeked' : ''}${routePeek ? ' route-peek' : ''}`} ref={sheet.panelRef} style={sheet.panelStyle} {...sheet.panelProps}>
        {sheet.phone && (
          <button type="button" className="sheet-handle" {...sheet.handleProps}
            aria-label={t('map.sheet.handle', { size: t(`map.sheet.${sheet.snap}` as MessageKey) })}>
            <span aria-hidden="true" />
          </button>
        )}
        {routeMode ? (
          <RoutePanel
            peek={routePeek}
            trip={T}
            cars={cars}
            myCar={myCar}
            search={placeSearch}
            selectedStop={selectedStop}
            onOpenStop={openStop}
            selectedSpot={spotFocus}
            onOpenSpot={openSpot}
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
            // Closing the trip hands focus back here for keyboards; never on a phone or touch screen,
            // where focusing a text box opens the on-screen keyboard (owner 2026-11-19).
            autoFocus={whereKey > 0 && !sheet.phone && !matchMedia('(pointer: coarse)').matches}
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
        {sheet.phone ? (
          <h2 className="map-panel-toggle map-panel-head">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            <span>{t('map.filters')}</span>
          </h2>
        ) : (
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
        )}

        <div id="map-filters" className={`map-filters fold${filtersOpen ? '' : ' shut'}`}>
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
            <li><span className="map-key-speed"><SpeedMark tier={1} size={16} /></span> <span>{t('map.key.speed1')}</span></li>
            <li><span className="map-key-speed"><SpeedMark tier={2} size={16} /></span> <span>{t('map.key.speed2')}</span></li>
            <li><span className="map-key-speed"><SpeedMark tier={3} size={16} /></span> <span>{t('map.key.speed3')}</span></li>
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
            onClick={() => { if (sheet.phone && !listOpen) sheet.setSnap('peek'); setListOpen((o) => !o); }}
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
                                <ListSpeed it={it} />
                                {[it.maxKw == null ? t('map.station.unknownPower') : t('fmt.kw', { value: kwText(it.maxKw) }), it.city].filter(Boolean).join(' · ')}
                              </Marquee>
                              {you && <span className="small muted map-list-away">{away(haversineKm(you, it.at))}</span>}
                            </>
                          ) : (
                          <span className="small muted map-list-meta">
                            <ListSpeed it={it} />
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
          onBack={listOpen && viaList ? backToList : selectedStop !== null ? backToRoute : undefined}
          backToRoute={!(listOpen && viaList) && selectedStop !== null}
          myCar={myCar}
          carInfo={myCar && carInfo ? { ...carInfo, rule: carRule } : null}
          onRouteHere={selectedStop === null ? () => enterRoute({ to: stationEnd(station) }) : undefined}
        />
      )}

      {mapStatus === 'ready' && (locate === 'busy' || autoLocating) && (
        <p className="map-status map-status-loading map-status-locate" role="status">
          <span className="road-loader" aria-hidden="true"><span /></span>
          {t('map.locating')}
        </p>
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

