// Compare screen helpers (database-ui.md §6, charging-curve-viewer.md §6, DESIGN-1b 6.1). Pure, so
// they are unit-tested: the list from the link, which value is best per row, whether a row
// differs, and the results-table sort.

import { COMPARE_MAX } from './my-car.ts';

/** Which way is better for a spec row; rows not listed have no "best" (text, or no clear better). */
export const BETTER: Readonly<Record<string, 'higher' | 'lower'>> = {
  capacity_usable_kwh: 'higher',
  dc_max_kw: 'higher',
  ac_max_kw: 'higher',
  range_km: 'higher',
  published_10_80_min: 'lower',
  recharge_time_240v_h: 'lower',
  consumption_combined_wh_per_km: 'lower',
  consumption_city_wh_per_km: 'lower',
  consumption_highway_wh_per_km: 'lower',
  nominal_voltage_class: 'higher', // owner 2026-11-20 (B119): 800v charges faster than 400v
};

/** A spec value as a number to rank, or null. Text rows that have an order ("400v", "800v") rank by
 *  their number; other text never ranks. */
export function rankValue(key: string, v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (key === 'nominal_voltage_class' && typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** The cars in a /compare?cars=a,b link: known ids only, no repeats, at most four.
 *  null when the link has no cars param (then the saved list is used). */
export function readCarsParam(
  search: string,
  known: (id: string) => boolean,
): { ids: string[]; unknown: string[]; dropped: number } | null {
  const raw = new URLSearchParams(search).get('cars');
  if (raw == null) return null;
  const parts = [...new Set(raw.split(',').map((x) => x.trim()).filter(Boolean))];
  const ids = parts.filter(known);
  const unknown = parts.filter((x) => !known(x));
  return { ids: ids.slice(0, COMPARE_MAX), unknown, dropped: Math.max(0, ids.length - COMPARE_MAX) };
}

/** The link for this list, with readable slashes in the ids. */
export function compareHref(ids: readonly string[]): string {
  return ids.length ? `/compare?cars=${ids.map((id) => id.split('/').map(encodeURIComponent).join('/')).join(',')}` : '/compare';
}

/** Swap the car at `i` for another (the variant selector); a repeat of another slot is refused. */
export function replaceAt(list: readonly string[], i: number, id: string): string[] {
  if (i < 0 || i >= list.length || (list.includes(id) && list[i] !== id)) return [...list];
  const out = [...list];
  out[i] = id;
  return out;
}

/** Indices of the best value in a row. Unknowns (null) are never best; ties are all marked.
 *  Nothing is marked when fewer than two cars have a figure, or when every known figure is equal. */
export function bestIndices(values: readonly (number | null | undefined)[], better: 'higher' | 'lower' | undefined): number[] {
  if (!better) return [];
  const known = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => typeof x.v === 'number' && Number.isFinite(x.v));
  if (known.length < 2) return [];
  const pick = better === 'higher' ? Math.max(...known.map((x) => x.v)) : Math.min(...known.map((x) => x.v));
  const best = known.filter((x) => x.v === pick).map((x) => x.i);
  return best.length === known.length ? [] : best;
}

/** Whether a row differs between the cars: values compared as shown (unknown counts as a value). */
export function rowDiffers(values: readonly unknown[]): boolean {
  const key = (v: unknown) => JSON.stringify(v ?? null);
  return values.some((v) => key(v) !== key(values[0]));
}

export type SortDir = 'asc' | 'desc';

/** Sort rows by a numeric column; unknowns always last, ties keep the car order. */
export function sortBy<T>(rows: readonly T[], value: (r: T) => number | null | undefined, dir: SortDir): T[] {
  return rows
    .map((r, i) => ({ r, i, v: value(r) }))
    .sort((a, b) => {
      const an = typeof a.v === 'number' && Number.isFinite(a.v);
      const bn = typeof b.v === 'number' && Number.isFinite(b.v);
      if (an !== bn) return an ? -1 : 1;
      if (an && bn && a.v !== b.v) return dir === 'asc' ? a.v! - b.v! : b.v! - a.v!;
      return a.i - b.i;
    })
    .map((x) => x.r);
}

/** The column's natural first sort: more is better for km and kW, less for time. */
export const firstDir = (col: 'minutes' | 'km' | 'per10' | 'avgKw'): SortDir => (col === 'minutes' ? 'asc' : 'desc');
