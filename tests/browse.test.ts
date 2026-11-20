import { describe, expect, it } from 'vitest';
import { activeCount, defaultFilters, defaultState, matches, optionsFor, pageButtons, pageSlice, readState, sortCars, type BrowseFilters } from '../src/lib/browse.ts';
import { makeCarSearch, tripReadyFirst } from '../src/lib/car-search.ts';
import { addTo, COMPARE_MAX, readCompare, readMyCar } from '../src/lib/my-car.ts';
import type { IndexEntry } from '../src/lib/types.ts';

function car(o: Partial<IndexEntry> & { id: string }): IndexEntry {
  return {
    make: 'Hyundai', model: 'IONIQ 5', year: 2026, name: 'Long Range AWD', body_type: 'suv', drivetrain: 'awd', sold_in_canada: true, markets: ['CA'],
    range_km: 400, dc_max_kw: 200, usable_kwh: 80, charge_port: 'nacs', voltage_class: '800v', heat_pump: ['standard'], chemistry: 'nmc',
    consumption_wh_per_km: 190, supercharger_access: 'yes', trims: [], curve_kind: 'estimated', trip_ready: true,
    derived: { minutes_10_80: 20, km_per_10_min: 150, estimated: true, extrapolated: false, battery_basis: 'usable' },
    ...o,
  } as IndexEntry;
}

const A = car({ id: 'hyundai/ioniq-5/2026/long-range-awd', trims: ['Preferred AWD Long Range', 'SEL'] });
const B = car({ id: 'tesla/model-y/2026/long-range-awd', markets: ['CA', 'US'], make: 'Tesla', model: 'Model Y', range_km: 500, dc_max_kw: 250, voltage_class: '400v', consumption_wh_per_km: 160, curve_kind: 'tested', heat_pump: ['standard'], derived: { minutes_10_80: 25, km_per_10_min: 170, estimated: false, extrapolated: false, battery_basis: 'usable' } });
const C = car({ id: 'nissan/leaf/2025/s', make: 'Nissan', model: 'LEAF', year: 2025, name: 'S', body_type: 'hatchback', drivetrain: 'fwd', range_km: null, dc_max_kw: null, charge_port: null, voltage_class: null, chemistry: null, heat_pump: ['unknown'], consumption_wh_per_km: null, curve_kind: null, derived: { minutes_10_80: null, km_per_10_min: null, estimated: true, extrapolated: false, battery_basis: null } });
const D = car({ id: 'kia/ev9/2024/light', make: 'Kia', model: 'EV9', year: 2024, sold_in_canada: false, markets: ['US'], heat_pump: ['optional'] });
const ALL = [A, B, C, D];
const f = (over: Partial<BrowseFilters> = {}) => ({ ...defaultFilters(ALL), years: [2026, 2025], ...over });
const ids = (list: IndexEntry[]) => list.map((e) => e.id.split('/')[1]);

describe('browse filters (database-ui.md §4)', () => {
  it('defaults: every market and every model year (owner 2026-11-20)', () => {
    const d = defaultFilters(ALL);
    expect(d.markets).toEqual([]);
    expect(d.years).toEqual([]);
    expect(ids(ALL.filter((e) => matches(e, d)))).toEqual(['ioniq-5', 'model-y', 'leaf', 'ev9']);
    expect(matches(D, f({ years: [] }))).toBe(true);
  });

  it('Sold in (B98): a car passes when it is sold in any ticked market', () => {
    const all = f({ years: [] });
    expect(ids(ALL.filter((e) => matches(e, { ...all, markets: ['CA'] })))).toEqual(['ioniq-5', 'model-y', 'leaf']);
    expect(ids(ALL.filter((e) => matches(e, { ...all, markets: ['US'] })))).toEqual(['model-y', 'ev9']);
    expect(ids(ALL.filter((e) => matches(e, { ...all, markets: ['CA', 'US'] })))).toEqual(['ioniq-5', 'model-y', 'leaf', 'ev9']);
  });

  it('multi-selects: empty means all; a car with an unknown value only passes when the list is empty', () => {
    expect(ids(ALL.filter((e) => matches(e, f({ makes: ['Tesla', 'Nissan'] }))))).toEqual(['model-y', 'leaf']);
    expect(ids(ALL.filter((e) => matches(e, f({ bodies: ['hatchback'] }))))).toEqual(['leaf']);
    expect(ids(ALL.filter((e) => matches(e, f({ drivetrains: ['awd'] }))))).toEqual(['ioniq-5', 'model-y']);
    expect(ids(ALL.filter((e) => matches(e, f({ ports: ['nacs'] }))))).toEqual(['ioniq-5', 'model-y']);
    expect(ids(ALL.filter((e) => matches(e, f({ voltages: ['800v'] }))))).toEqual(['ioniq-5']);
    expect(ids(ALL.filter((e) => matches(e, f({ chemistries: ['nmc'] }))))).toEqual(['ioniq-5', 'model-y']);
  });

  it('min/max sliders: 0 is off; unknown figures drop only while the filter is set', () => {
    expect(ids(ALL.filter((e) => matches(e, f({ minRangeKm: 450 }))))).toEqual(['model-y']);
    expect(ids(ALL.filter((e) => matches(e, f({ minRangeKm: 400 }))))).toEqual(['ioniq-5', 'model-y']); // inclusive
    expect(ids(ALL.filter((e) => matches(e, f({ minDcKw: 210 }))))).toEqual(['model-y']);
    expect(ids(ALL.filter((e) => matches(e, f({ max1080Min: 20 }))))).toEqual(['ioniq-5']);
    expect(matches(C, f())).toBe(true);
  });

  it('heat pump: standard, or available (standard or optional)', () => {
    const all = f({ years: [] });
    expect(ids(ALL.filter((e) => matches(e, { ...all, heatPump: 'standard' })))).toEqual(['ioniq-5', 'model-y']);
    expect(ids(ALL.filter((e) => matches(e, { ...all, heatPump: 'available' })))).toEqual(['ioniq-5', 'model-y', 'ev9']);
  });

  it('measured curves only', () => {
    expect(ids(ALL.filter((e) => matches(e, f({ measuredOnly: true }))))).toEqual(['model-y']);
  });

  it('counts changed filters', () => {
    expect(activeCount(defaultFilters(ALL), ALL)).toBe(0);
    expect(activeCount({ ...defaultFilters(ALL), makes: ['Kia'], minRangeKm: 300 }, ALL)).toBe(2);
    expect(activeCount(f({ years: [2025, 2026] }), ALL)).toBe(1);
  });
});

describe('browse sorts', () => {
  it('name, then each figure in its better-first direction, unknowns last either way', () => {
    expect(ids(sortCars([B, C, A], 'name', 'asc'))).toEqual(['ioniq-5', 'leaf', 'model-y']);
    expect(ids(sortCars(ALL, 'range', 'desc'))).toEqual(['model-y', 'ioniq-5', 'ev9', 'leaf']);
    expect(ids(sortCars(ALL, 'range', 'asc')).at(-1)).toBe('leaf');
    expect(ids(sortCars([A, B, C], 'efficiency', 'asc'))).toEqual(['model-y', 'ioniq-5', 'leaf']);
    expect(ids(sortCars([A, B, C], 'dc', 'desc'))).toEqual(['model-y', 'ioniq-5', 'leaf']);
    expect(ids(sortCars([A, B, C], 'time1080', 'asc'))).toEqual(['ioniq-5', 'model-y', 'leaf']);
    expect(ids(sortCars([A, B, C], 'km10', 'desc'))).toEqual(['model-y', 'ioniq-5', 'leaf']);
    expect(ids(sortCars([D, C, A], 'newest', 'desc'))).toEqual(['ioniq-5', 'leaf', 'ev9']);
  });

  it('options list distinct known values', () => {
    expect(optionsFor(ALL, (e) => e.charge_port)).toEqual(['nacs']);
  });
});

describe('saved browse state', () => {
  it('keeps good keys and drops odd ones', () => {
    expect(readState(null, ALL)).toEqual(defaultState(ALL));
    expect(readState('junk', ALL)).toEqual(defaultState(ALL));
    const s = readState({ sort: 'km10', dir: 'desc', view: 'table', filters: { makes: ['Kia'], minRangeKm: 300, heatPump: 'nope', years: ['x'], canadaOnly: false, markets: ['US'] } }, ALL);
    expect(s.sort).toBe('km10');
    expect(s.view).toBe('table');
    expect(s.filters.makes).toEqual(['Kia']);
    expect(s.filters.minRangeKm).toBe(300);
    expect(s.filters.heatPump).toBe('any');
    expect(s.filters.years).toEqual([]);
    expect(s.filters.markets).toEqual(['US']); // an old saved canadaOnly is ignored
    expect(readState({ sort: 'price', view: 'grid', filters: { minDcKw: -5 } }, ALL)).toEqual(defaultState(ALL));
  });
});

describe('car search', () => {
  const search = makeCarSearch(ALL);
  it('finds by model, make + model, trim alias and prefix', () => {
    expect(search('ioniq 5')[0]).toBe(A.id);
    expect(search('model y')[0]).toBe(B.id);
    expect(search('tesla')).toEqual([B.id]);
    expect(search('preferred')).toEqual([A.id]);
    expect(search('ion')).toContain(A.id);
    expect(search('   ')).toEqual([]);
    expect(search('zzzz')).toEqual([]);
  });
});

describe('My car and the comparison list', () => {
  it('reads a saved My car, rejecting anything odd', () => {
    expect(readMyCar({ carId: A.id, trimId: 'x' })).toEqual({ carId: A.id, trimId: 'x' });
    expect(readMyCar({ carId: A.id })).toEqual({ carId: A.id, trimId: null });
    expect(readMyCar({ carId: '../etc' })).toBeNull();
    expect(readMyCar('x')).toBeNull();
  });

  it('comparison list: valid ids, no repeats, at most four', () => {
    expect(readCompare([A.id, A.id, 'bad', B.id])).toEqual([A.id, B.id]);
    expect(readCompare('x')).toEqual([]);
    expect(readCompare([A.id, B.id, C.id, D.id, 'a/b/2026/c'])).toHaveLength(COMPARE_MAX);
    expect(addTo([A.id], B.id)).toEqual({ list: [A.id, B.id], result: 'added' });
    expect(addTo([A.id], A.id).result).toBe('already');
    expect(addTo([A.id, B.id, C.id, D.id], 'a/b/2026/c').result).toBe('full');
  });
});

describe("tripReadyFirst (DESIGN-4 4.7: the map car picker)", () => {
  it('lists cars the trip planner can use first and keeps the search order inside each group', () => {
    const list = [{ id: 'a', trip_ready: false }, { id: 'b', trip_ready: true }, { id: 'c', trip_ready: false }, { id: 'd', trip_ready: true }];
    expect(tripReadyFirst(list).map((x) => x.id)).toEqual(['b', 'd', 'a', 'c']);
    expect(list.map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('pages (B106)', () => {
  const list = Array.from({ length: 437 }, (_, i) => i);
  it('cards: 48 per page, the last page holds the rest, out-of-range pages clamp', () => {
    expect(pageSlice(list, 1, 'cards')).toMatchObject({ page: 1, pages: 10, from: 1, to: 48 });
    expect(pageSlice(list, 2, 'cards').items[0]).toBe(48);
    expect(pageSlice(list, 10, 'cards')).toMatchObject({ from: 433, to: 437 });
    expect(pageSlice(list, 99, 'cards').page).toBe(10);
    expect(pageSlice([], 1, 'cards')).toMatchObject({ page: 1, pages: 1, from: 0, to: 0 });
  });
  it('table: 50 per page', () => {
    expect(pageSlice(list, 9, 'table')).toMatchObject({ pages: 9, from: 401, to: 437 });
  });
  it('page buttons: first, last, current ±1, gaps as null', () => {
    expect(pageButtons(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageButtons(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageButtons(3, 10)).toEqual([1, 2, 3, 4, null, 10]);
    expect(pageButtons(1, 1)).toEqual([1]);
  });
});
