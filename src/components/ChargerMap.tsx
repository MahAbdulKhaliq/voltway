// The charger map (charger-map.md, DESIGN-map.md M6–M8). Mounted with client:only="react":
// MapLibre draws with WebGL in the browser, so there is nothing to render at build time.
//
// Data: public/data/map/l3.json loads at start; l2.json only once Level 2 is first ticked.
// Filtering runs here (src/lib/map-filter.ts) and the result goes to one clustered GeoJSON
// source with setData, so clusters always count only what the filters let through.
// A theme change swaps the base style, which drops our layers; 'style.load' adds them back.

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP } from '../config.ts';
import { t, type MessageKey } from '../i18n/t.ts';
import { getJSON, setJSON, KEYS } from '../lib/storage.ts';
import { currentTheme } from '../scripts/theme-client.ts';
import type { FeatureCollection, Point } from 'geojson';
import type { MapFeature, MapFeatureCollection } from '../lib/map-data.ts';
import { filterStations, LEVELS, readFilters, type MapFilters } from '../lib/map-filter.ts';
import { bandsFor, PLUGS, type ChargerLevel } from '../lib/power-bands.ts';
import { BOLT, drawPin, PIN, PLUG, pinId } from '../lib/map-icons.ts';

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

const styleFor = (theme: 'light' | 'dark') => (theme === 'dark' ? MAP.darkStyleUrl : MAP.styleUrl);
const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] };

/** Adds pin images, the clustered source and its layers. Safe to call after every style load. */
function addOverlay(map: maplibregl.Map, data: FeatureCollection) {
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
      'circle-color': '#1E293B',
      'circle-opacity': 0.88,
      'circle-stroke-color': '#FFFFFF',
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
    paint: { 'text-color': '#FFFFFF' },
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
          <circle cx="22" cy="6" r="5.5" fill="#111827" stroke={PIN.ring} strokeWidth="1.5" />
          <rect x="21.25" y="3" width="1.5" height="4" fill="#fff" />
          <rect x="21.25" y="8" width="1.5" height="1.5" fill="#fff" />
        </g>
      )}
    </svg>
  );
}

type Load = 'idle' | 'loading' | 'ready' | 'error';

async function loadLevel(level: ChargerLevel): Promise<MapFeature[]> {
  const res = await fetch(`${MAP.dataUrl}/l${level}.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ((await res.json()) as MapFeatureCollection).features;
}

export default function ChargerMap() {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pinsRef = useRef<FeatureCollection>(EMPTY);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [filters, setFilters] = useState<MapFilters>(() => readFilters(getJSON<unknown>(KEYS.mapFilters, null)));
  const [stations, setStations] = useState<Record<ChargerLevel, MapFeature[]>>({ 3: [], 2: [] });
  const [load, setLoad] = useState<Record<ChargerLevel, Load>>({ 3: 'idle', 2: 'idle' });
  const [panelOpen, setPanelOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);

  // The map itself, once.
  useEffect(() => {
    if (!box.current) return;
    const view = savedView();
    let theme = currentTheme();
    const map = new maplibregl.Map({
      container: box.current,
      style: styleFor(theme),
      center: view.center,
      zoom: view.zoom,
      attributionControl: { compact: false, customAttribution: MAP.attribution },
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('style.load', () => addOverlay(map, pinsRef.current));
    map.once('load', () => setMapStatus('ready'));
    // The dark style names a few POI icons its sprite lacks; draw them blank instead of warning.
    map.on('styleimagemissing', (e) => {
      if (!map.hasImage(e.id)) map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
    });
    map.on('error', (e) => {
      // Only a failed style or tile source means the map itself is broken.
      if (!map.isStyleLoaded() && (e.error as { status?: number } | undefined)?.status !== 404) setMapStatus('error');
    });
    map.on('moveend', () => {
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
    for (const layer of ['clusters', 'pins']) {
      map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
    }

    const onTheme = () => {
      const next = currentTheme();
      if (next !== theme) {
        theme = next;
        map.setStyle(styleFor(theme));
      }
    };
    window.addEventListener('voltway:theme', onTheme);
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', onTheme);

    return () => {
      window.removeEventListener('voltway:theme', onTheme);
      mq.removeEventListener('change', onTheme);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Station data: each level's file loads the first time that level is ticked.
  useEffect(() => {
    for (const lv of LEVELS) {
      if (!filters.levels[lv] || load[lv] !== 'idle') continue;
      setLoad((s) => ({ ...s, [lv]: 'loading' }));
      loadLevel(lv).then(
        (features) => {
          setStations((s) => ({ ...s, [lv]: features }));
          setLoad((s) => ({ ...s, [lv]: 'ready' }));
        },
        () => setLoad((s) => ({ ...s, [lv]: 'error' })),
      );
    }
  }, [filters.levels, load]);

  // Filters → pins → map source; choices are saved.
  // The files never overlap (l3 = any Level 3 port, l2 = Level 2-only), so merging is safe.
  const pins = useMemo(() => filterStations([...stations[3], ...stations[2]], filters), [stations, filters]);
  useEffect(() => {
    pinsRef.current = pins;
    (mapRef.current?.getSource('stations') as GeoJSONSource | undefined)?.setData(pins);
  }, [pins]);
  useEffect(() => setJSON(KEYS.mapFilters, filters), [filters]);

  const toggle = <K extends keyof MapFilters>(group: K, key: keyof MapFilters[K]) =>
    setFilters((f) => ({ ...f, [group]: { ...f[group], [key]: !f[group][key] } }));

  const busy = LEVELS.some((lv) => filters.levels[lv] && load[lv] === 'loading');
  const failed = LEVELS.some((lv) => filters.levels[lv] && load[lv] === 'error');
  const count = pins.features.length;
  const levelLabel: Record<ChargerLevel, MessageKey> = { 3: 'map.level3', 2: 'map.level2' };

  return (
    <div className="charger-map">
      <div ref={box} className="map-canvas" role="region" aria-label={t('map.label')} />

      <div className="map-panel">
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
                  <ul className="bands">
                    {bandsFor(lv).map((b) => (
                      <li key={b}>
                        <label className="check">
                          <input type="checkbox" checked={filters.bands[b]} onChange={() => toggle('bands', b)} />
                          <span>{t(`map.band.${b}` as MessageKey)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
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
      </div>

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

