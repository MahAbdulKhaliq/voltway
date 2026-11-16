// The charger map (charger-map.md, DESIGN-map.md M6). Mounted with client:only="react":
// MapLibre draws with WebGL in the browser, so there is nothing to render at build time.
// M6: the base map, attribution, saved view and theme. Pins, filters and the station
// panel arrive in M7 and M8.

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP } from '../config.ts';
import { getJSON, setJSON, KEYS } from '../lib/storage.ts';
import { currentTheme } from '../scripts/theme-client.ts';

export interface MapText {
  label: string;
  loading: string;
  error: string;
}

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

export default function ChargerMap({ text }: { text: MapText }) {
  const box = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.once('load', () => setStatus('ready'));
    // The dark style names a few POI icons its sprite lacks; draw them blank instead of warning.
    map.on('styleimagemissing', (e) => {
      if (!map.hasImage(e.id)) map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
    });
    map.on('error', (e) => {
      // Only a failed style or tile source means the map itself is broken.
      if (!map.isStyleLoaded() && (e.error as { status?: number } | undefined)?.status !== 404) setStatus('error');
    });
    map.on('moveend', () => {
      const c = map.getCenter();
      const round = (x: number) => Math.round(x * 1e4) / 1e4;
      setJSON(KEYS.mapView, { center: [round(c.lng), round(c.lat)], zoom: Math.round(map.getZoom() * 100) / 100 });
    });

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
    };
  }, []);

  return (
    <div className="charger-map">
      <div ref={box} className="map-canvas" role="region" aria-label={text.label} />
      {status === 'loading' && (
        <p className="map-status" role="status">
          {text.loading}
        </p>
      )}
      {status === 'error' && (
        <p className="map-status banner" role="alert">
          {text.error}
        </p>
      )}
    </div>
  );
}
