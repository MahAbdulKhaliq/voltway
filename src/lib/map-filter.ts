// Charger-map filters (charger-map.md §4, DESIGN-map.md M7, M11). Pure, so it is unit-tested
// and shared by the map island. A port matches when its level is ticked, its rated kW is inside
// that level's slider range (B35) and its plug is ticked; a station shows when ANY port matches.
// Phase 1b (5.2b): "Chargers my car can use" (B28) narrows ports to the car's plugs, and the
// curve viewer links into the map with ?power=&plugs= (B31).

import {
  fullRange,
  inPowerRange,
  isValidRange,
  PLUGS,
  POWER_STOPS,
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
  /** "Chargers my car can use" (B28): applies only while My car is set and its port is known. */
  myCar: boolean;
}

export const LEVELS: readonly ChargerLevel[] = [3, 2];

/** Level 3 on, Level 2 off (N8); each slider at its full range (unknown power shown); every plug on. */
export function defaultFilters(): MapFilters {
  const plugs = {} as Record<Plug, boolean>;
  for (const p of PLUGS) plugs[p] = true;
  return { levels: { 3: true, 2: false }, power: { 3: fullRange(3), 2: fullRange(2) }, plugs, myCar: false };
}

/** Saved choices from browser storage, checked key by key; anything missing or odd keeps its default. */
export function readFilters(saved: unknown): MapFilters {
  const f = defaultFilters();
  if (!saved || typeof saved !== 'object') return f;
  const s = saved as Partial<Record<'levels' | 'plugs' | 'power', Record<string, unknown>>> & { myCar?: unknown };
  const copy = <K extends string>(into: Record<K, boolean>, from: Record<string, unknown> | undefined) => {
    if (!from || typeof from !== 'object') return;
    for (const k of Object.keys(into) as K[]) if (typeof from[k] === 'boolean') into[k] = from[k] as boolean;
  };
  copy(f.levels as Record<string, boolean>, s.levels);
  copy(f.plugs, s.plugs);
  if (typeof s.myCar === 'boolean') f.myCar = s.myCar;
  // Saves from before B35 hold "bands" instead of "power"; those keep the full range.
  if (s.power && typeof s.power === 'object') {
    for (const lv of LEVELS) {
      const r = s.power[lv];
      if (isValidRange(lv, r)) f.power[lv] = [r[0], r[1]];
    }
  }
  return f;
}

// ---- My car (B28, B38): which plugs the car can use, from its charge_port and supercharger_access.

/** The plugs a car can use. `superchargerAdapter`: it can also use Tesla Supercharger (NACS)
 *  ports, with an adapter. A CCS1 or CHAdeMO inlet also takes J1772 (its AC half); a NACS car
 *  sees J1772 sites too, since most come with a J1772 adapter (owner decision B42). */
export interface CarPlugRule {
  plugs: readonly Plug[];
  superchargerAdapter: boolean;
}

/** null when the car's port is unknown: the toggle is then disabled with a note. */
export function carPlugs(port: unknown, access: unknown): CarPlugRule | null {
  switch (port) {
    case 'nacs':
      return { plugs: ['nacs', 'j1772'], superchargerAdapter: false };
    case 'ccs1':
      if (access === 'yes') return { plugs: ['ccs1', 'j1772', 'nacs'], superchargerAdapter: false };
      return { plugs: ['ccs1', 'j1772'], superchargerAdapter: access === 'via_adapter' };
    case 'chademo':
      return { plugs: ['chademo', 'j1772'], superchargerAdapter: false };
    case 'j1772':
      return { plugs: ['j1772'], superchargerAdapter: false };
    default:
      return null;
  }
}

/** The source's network name for Tesla Superchargers (map-data.ts). */
export const SUPERCHARGER_NETWORK = 'Tesla';

/** A NACS port at a Supercharger that this car reaches only through an adapter. */
export function needsAdapter(rule: CarPlugRule | null | undefined, plug: Plug, network: string | undefined): boolean {
  return (
    !!rule &&
    rule.superchargerAdapter &&
    plug === 'nacs' &&
    network === SUPERCHARGER_NETWORK &&
    !rule.plugs.includes('nacs')
  );
}

export function carCanUse(rule: CarPlugRule, plug: Plug, network: string | undefined): boolean {
  return rule.plugs.includes(plug) || needsAdapter(rule, plug, network);
}

/** The car rule in force: only while the toggle is on. */
const activeRule = (f: MapFilters, car: CarPlugRule | null | undefined) => (f.myCar && car ? car : null);

export function portMatches(
  [level, plug, kw]: MapPort,
  f: MapFilters,
  car?: CarPlugRule | null,
  network?: string,
): boolean {
  if (!(f.levels[level] === true && inPowerRange(level, kw, f.power[level]) && f.plugs[plug] === true)) return false;
  const rule = activeRule(f, car);
  return !rule || carCanUse(rule, plug, network);
}

/** The highest level among a station's matching ports (3 or 2), or 0 when none match. */
export function matchLevel(
  ports: readonly MapPort[],
  f: MapFilters,
  car?: CarPlugRule | null,
  network?: string,
): 0 | ChargerLevel {
  let best: 0 | ChargerLevel = 0;
  for (const p of ports) if (portMatches(p, f, car, network) && p[0] > best) best = p[0];
  return best;
}

/** What the map's GeoJSON source holds per pin: id, level for the icon, and the unavailable flag. */
export interface PinProps {
  i: number;
  lv: ChargerLevel;
  t?: 1;
}

/** The pins to draw for these filters. A mixed site shown only for its Level 2 ports gets the Level 2 icon. */
export function filterStations(
  features: readonly MapFeature[],
  f: MapFilters,
  car?: CarPlugRule | null,
): FeatureCollection<Point, PinProps> {
  const out: Feature<Point, PinProps>[] = [];
  for (const feat of features) {
    const lv = matchLevel(feat.properties.p, f, car, feat.properties.nw);
    if (!lv) continue;
    const props: PinProps = { i: feat.properties.i, lv };
    if (feat.properties.t) props.t = 1;
    out.push({ type: 'Feature', geometry: feat.geometry, properties: props });
  }
  return { type: 'FeatureCollection', features: out };
}

/** The station's top DC (Level 3) rated kW among the ports the car can use (all, with no car),
 *  for "How fast would my car charge here?" (B31). null when no such port has a known kW. */
export function topDcKw(ports: readonly MapPort[], car?: CarPlugRule | null, network?: string): number | null {
  let best: number | null = null;
  for (const [level, plug, kw] of ports) {
    if (level !== 3 || kw == null || !Number.isFinite(kw) || kw <= 0) continue;
    if (car && !carCanUse(car, plug, network)) continue;
    if (best == null || kw > best) best = kw;
  }
  return best;
}

// ---- Links into the map (B31): "/?power=<kW>&plugs=a,b" from the curve viewer's charger preset.

/** The plugs for a "Find chargers this fast" link (adapter use at Superchargers counts as NACS). */
export function linkPlugs(rule: CarPlugRule): Plug[] {
  const out = [...rule.plugs];
  if (rule.superchargerAdapter && !out.includes('nacs')) out.push('nacs');
  return out;
}

export function mapLink(kw: number, plugs: readonly Plug[] | null | undefined): string {
  const q = new URLSearchParams({ power: String(Math.round(kw)) });
  if (plugs && plugs.length) q.set('plugs', plugs.join(','));
  return `/?${q.toString()}`;
}

/** Applies the link's params to the filters, or null when the URL has neither.
 *  kW → the Level 3 stop at or below it as the minimum and Max as the maximum; Level 3 on,
 *  Level 2 off. plugs → exactly those listed (unknown names ignored; none valid leaves plugs alone). */
export function applyMapLink(search: string, base: MapFilters): MapFilters | null {
  const q = new URLSearchParams(search);
  const rawKw = q.get('power');
  const rawPlugs = q.get('plugs');
  if (rawKw == null && rawPlugs == null) return null;
  const f: MapFilters = {
    ...base,
    levels: { ...base.levels },
    power: { ...base.power },
    plugs: { ...base.plugs },
  };
  const kw = rawKw == null || rawKw.trim() === '' ? NaN : Number(rawKw);
  if (Number.isFinite(kw) && kw > 0) {
    const stops = POWER_STOPS[3];
    const last = stops.length - 1;
    let lo = 0;
    for (let i = 0; i < last; i++) if (stops[i] <= kw) lo = i;
    f.power[3] = [lo, last];
    f.levels = { 3: true, 2: false };
  }
  if (rawPlugs != null) {
    const wanted = rawPlugs.split(',').map((x) => x.trim());
    const valid = PLUGS.filter((p) => wanted.includes(p));
    if (valid.length) for (const p of PLUGS) f.plugs[p] = valid.includes(p);
  }
  return f;
}

/** What the map needs from a car file (/data/cars/<id>.json): Tesla or not, and its plug rule. */
export interface CarMapInfo {
  isTesla: boolean;
  access: string | null;
  rule: CarPlugRule | null;
}

export function carMapInfo(file: unknown): CarMapInfo {
  const c = (file && typeof file === 'object' ? file : {}) as {
    make?: { id?: unknown };
    fields?: Record<string, { value?: { value?: unknown } | null } | null | undefined>;
  };
  const val = (k: string) => c.fields?.[k]?.value?.value;
  const access = val('supercharger_access');
  return {
    isTesla: c.make?.id === 'tesla',
    access: typeof access === 'string' ? access : null,
    rule: carPlugs(val('charge_port'), access),
  };
}
