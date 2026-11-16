// Highway factor calibration (route-planner.md §3, R10, B46/B48). Pure maths for
// scripts/calibrate-highway.ts: pair each car's NRCan highway rating with its tested
// mild-weather highway figure and find the factor that turns one into the other.

import type { CarDetail, SourcedValue } from '../../src/lib/types.ts';

export interface HighwayCase {
  id: string;
  name: string;
  /** NRCan highway rating (Wh/km, wall-side: includes charging losses). */
  nrcan: number;
  /** Tested highway figure (Wh/km, mostly battery-side). */
  tested: number;
  testedSource: string;
  /** tested ÷ NRCan: the factor that would be exact for this car. */
  ratio: number;
}

const num = (v: SourcedValue | undefined) => (v && typeof v.value === 'number' && v.value > 0 ? v.value : undefined);

/** A calibration case when the car has both an NRCan highway rating and a tested highway figure. */
export function highwayCase(car: CarDetail): HighwayCase | null {
  const f = car.fields.consumption_highway_wh_per_km;
  if (!f) return null;
  const all = [f.value, ...f.others];
  const nrcan = num(all.find((v) => v.kind === 'rated_nrcan'));
  const testedV = all.find((v) => v.kind === 'tested');
  const tested = num(testedV);
  if (nrcan === undefined || tested === undefined) return null;
  return { id: car.id, name: `${car.make.name} ${car.model.name} ${car.year} ${car.name}`, nrcan, tested, testedSource: testedV!.source_id, ratio: tested / nrcan };
}

/** Best fit on the log error: the geometric mean of the per-car ratios. */
export function bestFactor(cases: readonly HighwayCase[]): number {
  if (!cases.length) throw new Error('No calibration cases');
  return Math.exp(cases.reduce((a, c) => a + Math.log(c.ratio), 0) / cases.length);
}

/** The q-quantile (0–1) of the ratios, linear between neighbours. A higher factor is more conservative. */
export function ratioQuantile(cases: readonly HighwayCase[], q: number): number {
  const r = cases.map((c) => c.ratio).sort((a, b) => a - b);
  const pos = (r.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return r[lo] + (r[hi] - r[lo]) * (pos - lo);
}

/** Error of NRCan × factor against the tested figure: +10 % = the model uses 10 % more energy (safe side). */
export const errorAt = (c: HighwayCase, factor: number) => (c.nrcan * factor) / c.tested - 1;

export interface FactorSummary {
  factor: number;
  meanAbsError: number;
  /** Cars where the model would use less energy than tested (the risky side), and by more than 10 %. */
  under: number;
  underBy10: number;
  worst: number;
}

export function summariseFactor(cases: readonly HighwayCase[], factor: number): FactorSummary {
  const e = cases.map((c) => errorAt(c, factor));
  return {
    factor,
    meanAbsError: e.reduce((a, x) => a + Math.abs(x), 0) / e.length,
    under: e.filter((x) => x < 0).length,
    underBy10: e.filter((x) => x < -0.1).length,
    worst: Math.min(...e),
  };
}
