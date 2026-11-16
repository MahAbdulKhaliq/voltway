// Charger-map filters (charger-map.md §4, DESIGN-map.md M7, M11). Pure, so it is unit-tested
// and shared by the map island. A port matches when its level is ticked, its rated kW is inside
// that level's slider range (B35) and its plug is ticked; a station shows when ANY port matches.

import {
  fullRange,
  inPowerRange,
  isValidRange,
  PLUGS,
  type ChargerLevel,
  type Plug,
  type PowerRange,
} from './power-bands.ts';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { MapFeature, MapPort } from './map-data.ts';

export interface MapFilters {
  levels: Record<ChargerLevel, boolean>;
  /** kW slider range per level, as stop indices (power-bands.ts). */
  power: Record<ChargerLevel, PowerRange>;
  plugs: Record<Plug, boolean>;
}

export const LEVELS: readonly ChargerLevel[] = [3, 2];

/** Level 3 on, Level 2 off (N8); each slider at its full range (unknown power shown); every plug on. */
export function defaultFilters(): MapFilters {
  const plugs = {} as Record<Plug, boolean>;
  for (const p of PLUGS) plugs[p] = true;
  return { levels: { 3: true, 2: false }, power: { 3: fullRange(3), 2: fullRange(2) }, plugs };
}

/** Saved choices from browser storage, checked key by key; anything missing or odd keeps its default. */
export function readFilters(saved: unknown): MapFilters {
  const f = defaultFilters();
  if (!saved || typeof saved !== 'object') return f;
  const s = saved as Partial<Record<keyof MapFilters, Record<string, unknown>>>;
  const copy = <K extends string>(into: Record<K, boolean>, from: Record<string, unknown> | undefined) => {
    if (!from || typeof from !== 'object') return;
    for (const k of Object.keys(into) as K[]) if (typeof from[k] === 'boolean') into[k] = from[k] as boolean;
  };
  copy(f.levels as Record<string, boolean>, s.levels);
  copy(f.plugs, s.plugs);
  // Saves from before B35 hold "bands" instead of "power"; those keep the full range.
  if (s.power && typeof s.power === 'object') {
    for (const lv of LEVELS) {
      const r = s.power[lv];
      if (isValidRange(lv, r)) f.power[lv] = [r[0], r[1]];
    }
  }
  return f;
}

export function portMatches([level, plug, kw]: MapPort, f: MapFilters): boolean {
  return f.levels[level] === true && inPowerRange(level, kw, f.power[level]) && f.plugs[plug] === true;
}

/** The highest level among a station's matching ports (3 or 2), or 0 when none match. */
export function matchLevel(ports: readonly MapPort[], f: MapFilters): 0 | ChargerLevel {
  let best: 0 | ChargerLevel = 0;
  for (const p of ports) if (portMatches(p, f) && p[0] > best) best = p[0];
  return best;
}

/** What the map's GeoJSON source holds per pin: id, level for the icon, and the unavailable flag. */
export interface PinProps {
  i: number;
  lv: ChargerLevel;
  t?: 1;
}

/** The pins to draw for these filters. A mixed site shown only for its Level 2 ports gets the Level 2 icon. */
export function filterStations(features: readonly MapFeature[], f: MapFilters): FeatureCollection<Point, PinProps> {
  const out: Feature<Point, PinProps>[] = [];
  for (const feat of features) {
    const lv = matchLevel(feat.properties.p, f);
    if (!lv) continue;
    const props: PinProps = { i: feat.properties.i, lv };
    if (feat.properties.t) props.t = 1;
    out.push({ type: 'Feature', geometry: feat.geometry, properties: props });
  }
  return { type: 'FeatureCollection', features: out };
}
