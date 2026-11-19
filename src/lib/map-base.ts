// The base map shared by the charger map and the trip map (DESIGN-3 3.12): OpenFreeMap style per
// theme, recoloured to Voltway's Road Paint look before it draws (DESIGN-4, map-style.ts), the map credits (B30), zoom buttons, no rotation, and a style swap when the theme changes.
// A style swap drops every added source and layer, so callers add theirs back in `onStyleLoad`.

import maplibregl from 'maplibre-gl';
import { MAP } from '../config.ts';
import { t } from '../i18n/t.ts';
import { currentTheme, type Theme } from '../scripts/theme-client.ts';
import { reducedMotion } from './motion.ts';
import { DARK_SHIELD, MAP_PALETTE, roadPaintStyle, shieldImage } from './map-style.ts';

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

/** B89 round 4 (owner): the ⓘ keeps its look and the credits unroll from it. MapLibre swaps the
 *  pill between its small and full size at once; the full pill is drawn straight away and a
 *  rounded clip opens from the ⓘ corner (bottom right) to the whole pill, so the text never
 *  reflows. Closing runs the clip back to the ⓘ before the pill is made small (MapLibre's own
 *  click is held until then). Instant with Animations off. */
const CREDITS_MS = 380, CREDITS_EASE = 'cubic-bezier(0.33, 1, 0.68, 1)'; // ease-out cubic: the fold back in
// Opening: an even unroll outward (an ease-out front-loads it, so the text pops in at once).
const CREDITS_OPEN_MS = 460, CREDITS_OPEN_EASE = 'cubic-bezier(0.45, 0, 0.25, 1)';
function animateCredits(pill: HTMLElement) {
  const SHOW = 'maplibregl-compact-show';
  let small: DOMRect | null = null;
  let closing = false;
  const clip = (big: DOMRect, s: DOMRect) => `inset(${Math.max(0, big.height - s.height)}px 0px 0px ${Math.max(0, big.width - s.width)}px round 13px)`;
  pill.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.maplibregl-ctrl-attrib-button')) return;
    if (reducedMotion() || typeof pill.animate !== 'function') return;
    if (!pill.classList.contains(SHOW)) { small = pill.getBoundingClientRect(); return; }
    // Closing: hold MapLibre's toggle (and the native <details> one) until the clip has run.
    e.stopPropagation();
    e.preventDefault();
    if (closing) return;
    closing = true;
    const big = pill.getBoundingClientRect();
    const btn = pill.querySelector<HTMLElement>('.maplibregl-ctrl-attrib-button')!.getBoundingClientRect();
    const to = new DOMRect(0, 0, big.right - btn.left + 1, big.bottom - btn.top + 1);
    pill.animate([{ clipPath: 'inset(0px 0px 0px 0px round 13px)' }, { clipPath: clip(big, to) }], { duration: CREDITS_MS - 60, easing: CREDITS_EASE })
      .finished.then(() => {
        // What MapLibre's own toggle does to close.
        pill.setAttribute('open', '');
        pill.classList.remove(SHOW);
      }).catch(() => {}).finally(() => { closing = false; });
  }, true);
  new MutationObserver(() => {
    const from = small;
    small = null;
    if (!from || !pill.classList.contains(SHOW)) return;
    const big = pill.getBoundingClientRect();
    pill.animate([{ clipPath: clip(big, from) }, { clipPath: 'inset(0px 0px 0px 0px round 13px)' }], { duration: CREDITS_OPEN_MS, easing: CREDITS_OPEN_EASE });
  }).observe(pill, { attributes: true, attributeFilter: ['class'] });
}

export function createBaseMap({ container, center, zoom, bounds, onStyleLoad }: BaseMapOptions): BaseMap {
  let theme = currentTheme();
  const map = new maplibregl.Map({
    container,
    // Starts as bare land in the theme colour; the real style follows once it is fetched and recoloured.
    style: { version: 8, sources: {}, layers: [{ id: 'land', type: 'background', paint: { 'background-color': MAP_PALETTE[theme].land } }] },
    ...(bounds ? { bounds, fitBoundsOptions: { padding: 40 } } : { center: center ?? MAP.defaultView.center, zoom: zoom ?? MAP.defaultView.zoom }),
    // B30: the charger data credit (DOE/NLR, NRCan) sits on the map itself, linking to About.
    // B59, B62: the credits fold into MapLibre's compact ⓘ button, which opens them.
    attributionControl: {
      compact: true,
      customAttribution: [`<a href="/about">${t('map.creditsAbout')}</a>`, MAP.attribution, `<a href="/about#data">${t('map.chargerCredit')}</a>`],
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
  // The compact credits start folded (MapLibre opens them until the first drag).
  map.once('load', () => {
    const el = map.getContainer().querySelector('.maplibregl-ctrl-attrib.maplibregl-compact');
    el?.classList.remove('maplibregl-compact-show');
    el?.removeAttribute('open');
    if (el instanceof HTMLElement) animateCredits(el);
  });
  // Zoom buttons sit bottom right, above the credits: the top right belongs to the navigation pill (DESIGN-4 4.6); the map key and Locate me sit with them (B54).
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
  map.on('style.load', () => onStyleLoad(map));
  // The dark style names a few POI icons its sprite lacks; draw them blank instead of warning.
  map.on('styleimagemissing', (e) => {
    if (e.id === DARK_SHIELD && !map.hasImage(e.id)) { const sh = shieldImage(); map.addImage(e.id, sh.image, sh.options); return; }
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
