// The base map shared by the charger map and the trip map (DESIGN-3 3.12): OpenFreeMap style per
// theme, recoloured to Voltway's Road Paint look before it draws (DESIGN-4, map-style.ts), the map credits (B30), zoom buttons, no rotation, and a style swap when the theme changes.
// A style swap drops every added source and layer, so callers add theirs back in `onStyleLoad`.

import maplibregl from 'maplibre-gl';
import { MAP } from '../config.ts';
import { t } from '../i18n/t.ts';
import { currentTheme, type Theme } from '../scripts/theme-client.ts';
import { MAP_PALETTE, roadPaintStyle } from './map-style.ts';

export const styleFor = (theme: Theme): string => (theme === 'dark' ? MAP.darkStyleUrl : MAP.styleUrl);

export interface BaseMapOptions {
  container: HTMLElement;
  center?: [number, number];
  zoom?: number;
  /** Fit to these bounds instead of center/zoom: [west, south, east, north]. */
  bounds?: [number, number, number, number];
  /** Called after every style load (first load and each theme swap) to add sources and layers. */
  onStyleLoad: (map: maplibregl.Map) => void;
}

export interface BaseMap {
  map: maplibregl.Map;
  /** Removes the theme listeners and the map. */
  dispose: () => void;
}

export function createBaseMap({ container, center, zoom, bounds, onStyleLoad }: BaseMapOptions): BaseMap {
  let theme = currentTheme();
  const map = new maplibregl.Map({
    container,
    // Starts as bare land in the theme colour; the real style follows once it is fetched and recoloured.
    style: { version: 8, sources: {}, layers: [{ id: 'land', type: 'background', paint: { 'background-color': MAP_PALETTE[theme].land } }] },
    ...(bounds ? { bounds, fitBoundsOptions: { padding: 40 } } : { center: center ?? MAP.defaultView.center, zoom: zoom ?? MAP.defaultView.zoom }),
    // B30: the charger data credit (DOE/NLR, NRCan) sits on the map itself, linking to About.
    attributionControl: {
      compact: false,
      customAttribution: [MAP.attribution, `<a href="/about#data">${t('map.chargerCredit')}</a>`],
    },
    dragRotate: false,
    pitchWithRotate: false,
  });
// The hosted style is fetched, recoloured, then committed: the map never shows the stock colours.
  let disposed = false;
  const applyStyle = () => {
    const wanted = theme;
    fetch(styleFor(wanted))
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((style) => { if (!disposed && wanted === theme) map.setStyle(roadPaintStyle(style, wanted), { diff: false }); })
      // If the style can't be fetched here, let the map try the address itself and report its own error.
      .catch(() => { if (!disposed && wanted === theme) map.setStyle(styleFor(wanted), { diff: false }); });
  };
  applyStyle();
  map.touchZoomRotate.disableRotation();
  // Zoom buttons sit bottom right, above the credits: the top right belongs to the navigation pill (DESIGN-4 4.6).
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
  map.on('style.load', () => onStyleLoad(map));
  // The dark style names a few POI icons its sprite lacks; draw them blank instead of warning.
  map.on('styleimagemissing', (e) => {
    if (!map.hasImage(e.id)) map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
  });

  const onTheme = () => {
    const next = currentTheme();
    if (next !== theme) {
      theme = next;
      applyStyle();
    }
  };
  window.addEventListener('voltway:theme', onTheme);
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', onTheme);

  return {
    map,
    dispose: () => {
      disposed = true;
      window.removeEventListener('voltway:theme', onTheme);
      mq.removeEventListener('change', onTheme);
      map.remove();
    },
  };
}
