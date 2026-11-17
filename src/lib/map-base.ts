// The base map shared by the charger map and the trip map (DESIGN-3 3.12): OpenFreeMap style per
// theme, the map credits (B30), zoom buttons, no rotation, and a style swap when the theme changes.
// A style swap drops every added source and layer, so callers add theirs back in `onStyleLoad`.

import maplibregl from 'maplibre-gl';
import { MAP } from '../config.ts';
import { t } from '../i18n/t.ts';
import { currentTheme, type Theme } from '../scripts/theme-client.ts';

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
    style: styleFor(theme),
    ...(bounds ? { bounds, fitBoundsOptions: { padding: 40 } } : { center: center ?? MAP.defaultView.center, zoom: zoom ?? MAP.defaultView.zoom }),
    // B30: the charger data credit (DOE/NLR, NRCan) sits on the map itself, linking to About.
    attributionControl: {
      compact: false,
      customAttribution: [MAP.attribution, `<a href="/about#data">${t('map.chargerCredit')}</a>`],
    },
    dragRotate: false,
    pitchWithRotate: false,
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.on('style.load', () => onStyleLoad(map));
  // The dark style names a few POI icons its sprite lacks; draw them blank instead of warning.
  map.on('styleimagemissing', (e) => {
    if (!map.hasImage(e.id)) map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
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

  return {
    map,
    dispose: () => {
      window.removeEventListener('voltway:theme', onTheme);
      mq.removeEventListener('change', onTheme);
      map.remove();
    },
  };
}
