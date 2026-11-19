import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCars, ratingRows } from '../scripts/lib/build.ts';
import { applyWheelEffect, deriveWheelEffect, ratedWheelFor, standardWheel, type RatingRow } from '../src/lib/wheel-effect.ts';

const REPO = join(import.meta.dirname, '..');
const row = (group: string, wheel_in: number, wh_per_km: number, source_id = 'src-a'): RatingRow => ({ group, wheel_in, wh_per_km, source_id });

describe('deriveWheelEffect (B13)', () => {
  it('takes the median change per inch across pairs from any source', () => {
    const e = deriveWheelEffect([
      row('a', 19, 200), row('a', 20, 206),           // +3 %/in
      row('b', 18, 100), row('b', 20, 110, 'src-b'),  // +5 %/in, a second source
      row('c', 20, 150), row('c', 21, 151.5),         // +1 %/in
    ]);
    expect(e?.pct_per_inch).toBeCloseTo(0.03, 6);
    expect(e?.pairs).toBe(3);
    expect(e?.source_ids).toEqual(['src-a', 'src-b']);
  });

  it('ignores groups with a single wheel size, and returns null with no pairs', () => {
    expect(deriveWheelEffect([row('a', 19, 200), row('b', 20, 210)])).toBeNull();
  });
});

describe('applyWheelEffect', () => {
  const effect = { pct_per_inch: 0.04, low: 0, high: 0.08, pairs: 10, source_ids: ['s'] };
  it('raises consumption and lowers range for bigger wheels', () => {
    const r = applyWheelEffect(19, 21, effect, { whPerKm: 200, rangeKm: 500 });
    expect(r.factor).toBeCloseTo(1.08, 10);
    expect(r.whPerKm).toBeCloseTo(216, 10);
    expect(r.rangeKm).toBeCloseTo(500 / 1.08, 10);
  });
  it('does the opposite for smaller wheels, and nothing for the same size', () => {
    expect(applyWheelEffect(20, 18, effect, { rangeKm: 400 }).rangeKm).toBeCloseTo(400 / 0.92, 10);
    expect(applyWheelEffect(19, 19, effect, {}).factor).toBe(1);
  });
});

describe('the real build: per-trim ratings and wheels', () => {
  const { cars, estimates } = buildCars(REPO);
  const car = (id: string) => cars.find((c) => c.id === id)!;

  it('learns a wheel effect from the imported ratings', () => {
    expect(estimates.wheel?.pairs).toBeGreaterThan(10);
    expect(estimates.wheel?.pct_per_inch).toBeGreaterThan(0);
  });

  it('gives a trim rated on its own row its own charger, efficiency and range (LYRIQ AWD 19.2 kW)', () => {
    const t = car('cadillac/lyriq/2026/awd').trims.find((x) => x.id === '19-2-kw-charger')!;
    expect(t.ac_max_kw?.value).toMatchObject({ value: 19.2, unit: 'kW', kind: 'rated_nrcan' });
    expect(t.range_km?.value.value).toBe(488);
    expect(t.consumption_combined_wh_per_km?.value.value).toBeGreaterThan(0);
    const base = car('cadillac/lyriq/2026/awd').trims.find((x) => x.id === '11-5-kw-charger')!;
    expect(base.ac_max_kw?.value.value).toBe(11.5);
  });

  it('takes wheel sizes from NRCan model names (IONIQ 5 AWD 19″ / 20″)', () => {
    const trims = car('hyundai/ioniq-5/2026/long-range-awd').trims;
    expect(trims.map((t) => t.wheels[0]?.diameter_in)).toEqual([19, 20]);
    expect(trims[1].consumption_combined_wh_per_km?.value.value).toBe(215);
  });

  it('builds rating rows from NRCan names with a source on each', () => {
    const rows = ratingRows({ nrcan: new Map([['k', { year: 2026, make: 'X', model: 'Y AWD (20" Wheels)', motor_kw: [{ value: 200 }], consumption_combined_wh_per_km: [{ value: 200, source_id: 'src-n' }] }]]) });
    expect(rows).toEqual([{ group: 'nrcan|2026|X|Y AWD|200', wheel_in: 20, wh_per_km: 200, source_id: 'src-n' }]);
  });
});

describe('ratedWheelFor (4.3: which wheels the shown rating belongs to)', () => {
  const w = (n: number) => [{ diameter_in: n, is_standard: true }];
  const base = { wheels: w(19) };
  const ownRated = { wheels: w(20), range_km: { value: 1 } };
  const unrated = { wheels: w(21) };
  it("uses the trim's own wheels when it is rated on its own", () => {
    expect(ratedWheelFor([base, ownRated], ownRated)).toBe(20);
  });
  it("uses the first trim's wheels (the variant's rating) for a trim without its own", () => {
    expect(ratedWheelFor([base, unrated], unrated)).toBe(19);
    expect(ratedWheelFor([base, unrated], base)).toBe(19);
  });
  it("falls back to the trim's wheels when the first trim's are unknown", () => {
    expect(ratedWheelFor([{ wheels: [] }, unrated], unrated)).toBe(21);
    expect(standardWheel({ wheels: [] })).toBeNull();
  });
});

describe('wheelSizeOptions (B93)', () => {
  it('runs from 2″ below the smallest to 2″ above the largest factory size', async () => {
    const { wheelSizeOptions } = await import('../src/lib/wheel-effect.ts');
    expect(wheelSizeOptions([18, 19, 20], 18)).toEqual([16, 17, 18, 19, 20, 21, 22]);
    expect(wheelSizeOptions([19], 19)).toEqual([17, 18, 19, 20, 21]);
    expect(wheelSizeOptions([], null)).toEqual([]);
  });
});
