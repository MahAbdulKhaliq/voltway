import { describe, expect, it } from 'vitest';
import { BETTER, bestIndices, compareHref, firstDir, readCarsParam, replaceAt, rowDiffers, sortBy } from '../src/lib/compare.ts';

const known = (id: string) => /^[a-z0-9-]+\/[a-z0-9-]+\/\d{4}\/[a-z0-9-]+$/.test(id) && !id.startsWith('zz');

describe('readCarsParam (?cars=)', () => {
  it('null without the param', () => {
    expect(readCarsParam('', known)).toBeNull();
    expect(readCarsParam('?x=1', known)).toBeNull();
  });
  it('keeps known ids in order, drops repeats, reports unknowns', () => {
    const r = readCarsParam('?cars=a/b/2026/c,zz/x/2026/y,a/b/2026/c,d/e/2025/f,bad', known)!;
    expect(r.ids).toEqual(['a/b/2026/c', 'd/e/2025/f']);
    expect(r.unknown).toEqual(['zz/x/2026/y', 'bad']);
    expect(r.dropped).toBe(0);
  });
  it('more than 4 → first 4', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'].map((x) => `${x}/m/2026/v`);
    const r = readCarsParam(`?cars=${ids.join(',')}`, known)!;
    expect(r.ids).toEqual(ids.slice(0, 4));
    expect(r.dropped).toBe(1);
  });
  it('round-trips through compareHref', () => {
    const ids = ['a/b/2026/c', 'd/e/2025/f'];
    const href = compareHref(ids);
    expect(href).toBe('/compare?cars=a/b/2026/c,d/e/2025/f');
    expect(readCarsParam(href.slice('/compare'.length), known)!.ids).toEqual(ids);
    expect(compareHref([])).toBe('/compare');
  });
});

describe('replaceAt (variant selector)', () => {
  it('swaps one slot, refuses a car already in another slot', () => {
    expect(replaceAt(['a', 'b'], 1, 'c')).toEqual(['a', 'c']);
    expect(replaceAt(['a', 'b'], 1, 'a')).toEqual(['a', 'b']);
    expect(replaceAt(['a', 'b'], 5, 'c')).toEqual(['a', 'b']);
  });
});

describe('bestIndices (best value per row, with direction)', () => {
  it('higher is better for range and kW', () => {
    expect(BETTER.range_km).toBe('higher');
    expect(bestIndices([400, 500, 450], 'higher')).toEqual([1]);
  });
  it('lower is better for 10–80 % and consumption', () => {
    expect(BETTER.published_10_80_min).toBe('lower');
    expect(BETTER.consumption_combined_wh_per_km).toBe('lower');
    expect(bestIndices([18, 25, 30], 'lower')).toEqual([0]);
  });
  it('ties are all marked', () => {
    expect(bestIndices([18, 18, 30], 'lower')).toEqual([0, 1]);
  });
  it('unknowns are never best', () => {
    expect(bestIndices([null, 300, 250], 'higher')).toEqual([1]);
    expect(bestIndices([null, 300], 'lower')).toEqual([]);
    expect(bestIndices([null, undefined, NaN], 'lower')).toEqual([]);
  });
  it('nothing when all equal or no direction', () => {
    expect(bestIndices([200, 200], 'higher')).toEqual([]);
    expect(bestIndices([1, 2], undefined)).toEqual([]);
    expect(BETTER.chemistry).toBeUndefined();
  });
});

describe('rowDiffers ("Only show differences")', () => {
  it('equal rows do not differ; unknown vs a value does', () => {
    expect(rowDiffers(['ccs1', 'ccs1'])).toBe(false);
    expect(rowDiffers([null, null])).toBe(false);
    expect(rowDiffers(['ccs1', 'nacs'])).toBe(true);
    expect(rowDiffers([null, 'ccs1'])).toBe(true);
    expect(rowDiffers([400])).toBe(false);
  });
});

describe('sortBy (results table)', () => {
  const rows = [{ id: 'a', v: 120 }, { id: 'b', v: null }, { id: 'c', v: 150 }, { id: 'd', v: 120 }];
  it('desc by default for km/10 min, unknown last, ties keep order', () => {
    expect(firstDir('per10')).toBe('desc');
    expect(sortBy(rows, (r) => r.v, 'desc').map((r) => r.id)).toEqual(['c', 'a', 'd', 'b']);
  });
  it('asc for time, unknown still last', () => {
    expect(firstDir('minutes')).toBe('asc');
    expect(sortBy(rows, (r) => r.v, 'asc').map((r) => r.id)).toEqual(['a', 'd', 'c', 'b']);
  });
});
