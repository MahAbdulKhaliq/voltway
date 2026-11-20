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
  /** B55: the car has no Supercharger access (data), so Tesla-network NACS ports don't count. */
  noSupercharger?: boolean;
}

// ---- My car's plug toggles (B55, 2026-11-17): which DC plugs the driver says the car can use.

export type DcPlug = 'nacs' | 'ccs1' | 'chademo';
export const DC_PLUGS: readonly DcPlug[] = ['nacs', 'ccs1', 'chademo'];
export const isDcPlug = (x: unknown): x is DcPlug => typeof x === 'string' && (DC_PLUGS as readonly string[]).includes(x);

/** The DC plug an adapter that comes in the box adds (B115): "NACS → CCS1" lets a CCS1 car use
 *  NACS, "CCS1 → NACS" lets a NACS car use CCS1. Adapters sold or free on request add nothing. */
export function inBoxAdapterPlug(adapter: unknown): DcPlug | null {
  if (adapter === 'nacs_to_ccs1') return 'nacs';
  if (adapter === 'ccs1_to_nacs') return 'ccs1';
  return null;
}

/** The default toggles: the car's own DC plug, plus the plug of an adapter that comes in the box
 *  (B115, 2026-11-20; before, B55: own plug only). */
export function defaultDcPlugs(port: unknown, adapter?: unknown): DcPlug[] {
  if (!isDcPlug(port)) return [];
  const extra = inBoxAdapterPlug(adapter);
  return DC_PLUGS.filter((p) => p === port || p === extra);
}

/** The plug rule from the toggles. J1772 (Level 2) always counts: CCS1 and CHAdeMO inlets take
 *  it and NACS cars come with an adapter (B42). Supercharger access from the data still applies. */
export function plugRule(plugs: readonly DcPlug[], access: unknown): CarPlugRule {
  const rule: CarPlugRule = { plugs: [...DC_PLUGS.filter((p) => plugs.includes(p)), 'j1772'], superchargerAdapter: false };
  if (access === 'no') rule.noSupercharger = true;
  return rule;
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
  if (rule.noSupercharger && plug === 'nacs' && network === SUPERCHARGER_NETWORK) return false;
  return rule.plugs.includes(plug) || needsAdapter(rule, plug, network);
}

/** The car rule in force: only while the toggle is on. */
const activeRule = (f: MapFilters, car: CarPlugRule | null | undefined) => (f.myCar && car ? car : null);

/** Whether the car can use this plug type anywhere (a Supercharger adapter counts for NACS). The
 *  plug boxes use it so they never look ticked for a plug "Chargers my car can use" hides. */
export const carTakesPlug = (rule: CarPlugRule, plug: Plug): boolean =>
  rule.plugs.includes(plug) || (plug === 'nacs' && rule.superchargerAdapter);

/** How many filters hide chargers compared with the defaults: the car filter, fast chargers
 *  switched off, a narrowed power range on a ticked level, and any unticked plug the car filter
 *  doesn't already rule out. Shown beside the "Chargers" control (DESIGN-4 4.9). */
export function narrowedCount(f: MapFilters, car?: CarPlugRule | null): number {
  const rule = activeRule(f, car);
  const d = defaultFilters();
  let n = rule ? 1 : 0;
  if (!f.levels[3]) n++;
  for (const lv of LEVELS) {
    if (f.levels[lv] && (f.power[lv][0] !== d.power[lv][0] || f.power[lv][1] !== d.power[lv][1])) n++;
  }
  if (PLUGS.some((p) => !f.plugs[p] && (!rule || carTakesPlug(rule, p)))) n++;
  return n;
}

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

/** What the map's GeoJSON source holds per pin: id, level for the icon, the unavailable flag, and
 *  for the at-a-glance marks (B54) the top known Level 3 kW and which plugs are there, both from
 *  the ports the filters let through. Clusters add these up (map-icons.ts CLUSTER_PROPERTIES). */
export interface PinProps {
  i: number;
  lv: ChargerLevel;
  t?: 1;
  /** Top known Level 3 kW among the matching ports, 0 when none is known. */
  k: number;
  /** Plug present among the matching ports: CCS1, NACS, CHAdeMO, J1772 (1 or 0). */
  pc: 0 | 1;
  pn: 0 | 1;
  pd: 0 | 1;
  pj: 0 | 1;
  /** A Tesla network station (Supercharger or Destination), for its own pin (B55). */
  te: 0 | 1;
}

const PLUG_PROP = { ccs1: 'pc', nacs: 'pn', chademo: 'pd', j1772: 'pj' } as const;

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
    const nw = feat.properties.nw;
    const props: PinProps = { i: feat.properties.i, lv, k: 0, pc: 0, pn: 0, pd: 0, pj: 0, te: nw === SUPERCHARGER_NETWORK || nw === 'Tesla Destination' ? 1 : 0 };
    for (const port of feat.properties.p) {
      if (!portMatches(port, f, car, feat.properties.nw)) continue;
      const [level, plug, kw] = port;
      if (level === 3 && kw != null && Number.isFinite(kw) && kw > props.k) props.k = kw;
      props[PLUG_PROP[plug]] = 1;
    }
    if (feat.properties.t) props.t = 1;
    out.push({ type: 'Feature', geometry: feat.geometry, properties: props });
  }
  return { type: 'FeatureCollection', features: out };
}

// ---- Sending only what changed. With Level 2 on there are ~100k pins (~16 MB); sending them all
// to the map's worker on every filter click froze the page for ~0.8 s. A click usually changes a
// few hundred pins, so the map gets just those (GeoJSONSource.updateData, keyed by station id).

export type Pin = Feature<Point, PinProps>;
export type PinIndex = Map<number, Pin>;

export function pinIndex(fc: FeatureCollection<Point, PinProps>): PinIndex {
  const m: PinIndex = new Map();
  for (const f of fc.features) m.set(f.properties.i, f);
  return m;
}

function samePin(a: Pin, b: Pin): boolean {
  const p = a.properties;
  const q = b.properties;
  if (p.lv !== q.lv || p.k !== q.k || p.pc !== q.pc || p.pn !== q.pn || p.pd !== q.pd || p.pj !== q.pj || p.te !== q.te || p.t !== q.t) return false;
  if (a.geometry === b.geometry) return true;
  const [x, y] = a.geometry.coordinates;
  const [u, v] = b.geometry.coordinates;
  return x === u && y === v;
}

/** The pins to remove and add to turn what the map holds (`prev`) into `next`. A changed pin is
 *  removed and added again (the map applies removals first). `index` is `next`, keyed by id. */
export function pinDiff(prev: PinIndex, next: FeatureCollection<Point, PinProps>): { remove: number[]; add: Pin[]; index: PinIndex } {
  const index = pinIndex(next);
  const remove: number[] = [];
  const add: Pin[] = [];
  for (const [id, old] of prev) {
    const now = index.get(id);
    if (!now) remove.push(id);
    else if (!samePin(old, now)) { remove.push(id); add.push(now); }
  }
  for (const [id, f] of index) if (!prev.has(id)) add.push(f);
  return { remove, add, index };
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
  /** The car's charge port as the data gives it (null when unknown). */
  port: string | null;
  /** The adapters_included value (B112), null when the data has none. */
  adapter: string | null;
  rule: CarPlugRule | null;
}

export function carMapInfo(file: unknown): CarMapInfo {
  const c = (file && typeof file === 'object' ? file : {}) as {
    make?: { id?: unknown };
    fields?: Record<string, { value?: { value?: unknown } | null } | null | undefined>;
  };
  const val = (k: string) => c.fields?.[k]?.value?.value;
  const access = val('supercharger_access');
  const port = val('charge_port');
  const adapter = val('adapters_included');
  return {
    isTesla: c.make?.id === 'tesla',
    access: typeof access === 'string' ? access : null,
    port: typeof port === 'string' ? port : null,
    adapter: typeof adapter === 'string' ? adapter : null,
    rule: carPlugs(val('charge_port'), access),
  };
}

/** The plug rule in force for My car (B55): its saved toggles, or the default from its port and in-box adapter (B115).
 *  null when neither says anything (port unknown and nothing switched on). */
export function myCarRule(info: CarMapInfo | null, plugs: readonly DcPlug[] | undefined): CarPlugRule | null {
  if (!info) return null;
  const on = plugs ?? defaultDcPlugs(info.port, info.adapter);
  if (!plugs && !info.rule) return null;
  return plugRule(on, info.access);
}
