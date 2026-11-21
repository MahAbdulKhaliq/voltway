// Cars tab browse logic (database-ui.md §4, B39). Pure, so it is unit-tested and shared by
// the Browse island. Figures come from the index; 10–80 % and km per 10 min are the build's
// uncapped figures with each car's default curve.

import type { IndexEntry } from './types.ts';

export type SortKey = 'name' | 'range' | 'efficiency' | 'dc' | 'time1080' | 'km10' | 'newest';
export type SortDir = 'asc' | 'desc';
export type View = 'cards' | 'table';
export type HeatPumpFilter = 'any' | 'standard' | 'available';

export interface BrowseFilters {
  markets: string[];        // B98: CA / US; empty = all
  years: number[];          // empty = all
  makes: string[];          // empty = all (same for every list below)
  bodies: string[];
  drivetrains: string[];
  ports: string[];
  voltages: string[];
  chemistries: string[];
  heatPump: HeatPumpFilter;
  minRangeKm: number;       // 0 = off
  minDcKw: number;          // 0 = off
  max1080Min: number;       // 0 = off
  measuredOnly: boolean;    // only cars whose default curve is measured (tested, community or manufacturer)
}

/** B140 (owner 2026-11-20): cars per page, the same in both views; 10 by default. */
export const PER_PAGE = [5, 10, 25, 50] as const;
export type PerPage = (typeof PER_PAGE)[number];
export const DEFAULT_PER_PAGE: PerPage = 10;
export interface BrowseState { filters: BrowseFilters; sort: SortKey; dir: SortDir; view: View; perPage: PerPage }

export const SORTS: SortKey[] = ['name', 'range', 'efficiency', 'dc', 'time1080', 'km10', 'newest'];
/** The natural direction for each sort: better first (§4). */
export const DEFAULT_DIR: Record<SortKey, SortDir> = { name: 'asc', range: 'desc', efficiency: 'asc', dc: 'desc', time1080: 'asc', km10: 'desc', newest: 'desc' };

// Owner 2026-11-20: every model year by default (no years ticked), not the newest two.
export function defaultFilters(_index: IndexEntry[]): BrowseFilters {
  return {
    markets: [], years: [], makes: [], bodies: [], drivetrains: [], ports: [], voltages: [], chemistries: [],
    heatPump: 'any', minRangeKm: 0, minDcKw: 0, max1080Min: 0, measuredOnly: false,
  };
}

export function defaultState(index: IndexEntry[]): BrowseState {
  return { filters: defaultFilters(index), sort: 'name', dir: 'asc', view: 'cards', perPage: DEFAULT_PER_PAGE };
}

/** How many filters differ from their defaults (shown on the phone Filters button). */
export function activeCount(f: BrowseFilters, index: IndexEntry[]): number {
  const d = defaultFilters(index);
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  return (Object.keys(d) as (keyof BrowseFilters)[]).filter((k) => !same([...[f[k]].flat()].sort(), [...[d[k]].flat()].sort())).length;
}

/** A saved browse state, checked key by key; anything missing or odd keeps its default. */
export function readState(saved: unknown, index: IndexEntry[]): BrowseState {
  const s = defaultState(index);
  if (!saved || typeof saved !== 'object') return s;
  const o = saved as Record<string, unknown>;
  if (SORTS.includes(o.sort as SortKey)) s.sort = o.sort as SortKey;
  if (o.dir === 'asc' || o.dir === 'desc') s.dir = o.dir;
  if (o.view === 'cards' || o.view === 'table') s.view = o.view;
  if (PER_PAGE.includes(o.perPage as PerPage)) s.perPage = o.perPage as PerPage;
  const f = o.filters as Record<string, unknown> | undefined;
  if (f && typeof f === 'object') {
    for (const k of ['measuredOnly'] as const) if (typeof f[k] === 'boolean') s.filters[k] = f[k] as boolean;
    for (const k of ['minRangeKm', 'minDcKw', 'max1080Min'] as const) {
      const n = f[k];
      if (typeof n === 'number' && Number.isFinite(n) && n >= 0) s.filters[k] = n;
    }
    if (f.heatPump === 'any' || f.heatPump === 'standard' || f.heatPump === 'available') s.filters.heatPump = f.heatPump;
    if (Array.isArray(f.years) && f.years.every((y) => Number.isInteger(y))) s.filters.years = f.years as number[];
    for (const k of ['markets', 'makes', 'bodies', 'drivetrains', 'ports', 'voltages', 'chemistries'] as const) {
      const v = f[k];
      if (Array.isArray(v) && v.every((x) => typeof x === 'string')) s.filters[k] = v as string[];
    }
  }
  return s;
}

const inList = (list: string[], v: string | null) => list.length === 0 || (v !== null && list.includes(v));

/** True when the car passes every filter. An unknown figure fails a min/max filter only while it is set. */
export function matches(e: IndexEntry, f: BrowseFilters): boolean {
  if (f.markets.length && !e.markets.some((m) => f.markets.includes(m))) return false;
  if (f.years.length && !f.years.includes(e.year)) return false;
  if (!inList(f.makes, e.make) || !inList(f.bodies, e.body_type) || !inList(f.drivetrains, e.drivetrain)) return false;
  if (!inList(f.ports, e.charge_port) || !inList(f.voltages, e.voltage_class) || !inList(f.chemistries, e.chemistry)) return false;
  if (f.heatPump === 'standard' && !e.heat_pump.includes('standard')) return false;
  if (f.heatPump === 'available' && !e.heat_pump.some((h) => h === 'standard' || h === 'optional' || h === 'standard_or_optional')) return false;
  if (f.minRangeKm > 0 && !(e.range_km !== null && e.range_km >= f.minRangeKm)) return false;
  if (f.minDcKw > 0 && !(e.dc_max_kw !== null && e.dc_max_kw >= f.minDcKw)) return false;
  const time = e.derived.minutes_10_80;
  if (f.max1080Min > 0 && !(time !== null && time <= f.max1080Min)) return false;
  if (f.measuredOnly && !(e.curve_kind !== null && e.curve_kind !== 'estimated')) return false;
  return true;
}

const byName = (a: IndexEntry, b: IndexEntry) =>
  a.make.localeCompare(b.make, 'en', { sensitivity: 'base' }) ||
  a.model.localeCompare(b.model, 'en', { sensitivity: 'base' }) ||
  b.year - a.year ||
  a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });

export function sortValue(e: IndexEntry, key: SortKey): number | null {
  switch (key) {
    case 'range': return e.range_km;
    case 'efficiency': return e.consumption_wh_per_km;
    case 'dc': return e.dc_max_kw;
    case 'time1080': return e.derived.minutes_10_80;
    case 'km10': return e.derived.km_per_10_min;
    case 'newest': return e.year;
    default: return null;
  }
}

/** Sorted copy. Unknown values always go last, in either direction; ties fall back to name. */
export function sortCars(list: IndexEntry[], key: SortKey, dir: SortDir): IndexEntry[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    if (key === 'name') return sign * byName(a, b);
    const va = sortValue(a, key);
    const vb = sortValue(b, key);
    if (va === null && vb === null) return byName(a, b);
    if (va === null) return 1;
    if (vb === null) return -1;
    return sign * (va - vb) || byName(a, b);
  });
}

/** Distinct values for a filter's options, in a stable order. */
export function optionsFor(index: IndexEntry[], pick: (e: IndexEntry) => string | null): string[] {
  return [...new Set(index.map(pick).filter((x): x is string => x !== null))].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

/** Text that search looks at for a car. */
export const searchText = (e: IndexEntry) => ({ id: e.id, make: e.make, model: e.model, name: e.name, trims: e.trims.join(' '), year: String(e.year) });

export interface PageSlice<T> { items: T[]; page: number; pages: number; from: number; to: number }

/** One page of the results (1-based); an out-of-range page is clamped. `from`/`to` are 1-based positions. */
export function pageSlice<T>(list: T[], page: number, perPage: number): PageSlice<T> {
  const size = Math.max(1, Math.floor(perPage) || DEFAULT_PER_PAGE);
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const start = (p - 1) * size;
  const items = list.slice(start, start + size);
  return { items, page: p, pages, from: items.length ? start + 1 : 0, to: start + items.length };
}

/** Page buttons to show: first, last and the current page ±1, with null for a gap ("…"). */
export function pageButtons(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] === 2) out.push(n - 1);   // a single hidden page: show it rather than "…"
    else if (i > 0 && n - sorted[i - 1] > 2) out.push(null);
    out.push(n);
  });
  return out;
}
