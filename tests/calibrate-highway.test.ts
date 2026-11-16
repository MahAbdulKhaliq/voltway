import { describe, expect, it } from 'vitest';
import { bestFactor, errorAt, highwayCase, ratioQuantile, summariseFactor, type HighwayCase } from '../scripts/lib/calibrate-highway.ts';
import type { CarDetail, Kind } from '../src/lib/types.ts';

const car = (values: { value: number; kind: Kind }[]): CarDetail => ({
  id: 'm/x/2026/v', make: { id: 'm', name: 'M' }, model: { id: 'm/x', name: 'X', body_type: 'suv' }, year: 2026, name: 'V',
  drivetrain: 'awd', sold_in_canada: true, trims: [], curves: [], sources: [],
  derived: { minutes_10_80: null, km_per_10_min: null, estimated: true, extrapolated: false, battery_basis: null },
  fields: values.length ? { consumption_highway_wh_per_km: { value: { ...values[0], source_id: 's0' }, others: values.slice(1).map((v, i) => ({ ...v, source_id: `s${i + 1}` })), conflict: false } } : {},
});
const c = (ratio: number): HighwayCase => ({ id: 'x', name: 'x', nrcan: 200, tested: 200 * ratio, testedSource: 's', ratio });

describe('highwayCase', () => {
  it('pairs NRCan with a tested figure wherever it sits in the field', () => {
    const r = highwayCase(car([{ value: 200, kind: 'rated_nrcan' }, { value: 190, kind: 'tested' }]))!;
    expect(r.nrcan).toBe(200);
    expect(r.tested).toBe(190);
    expect(r.ratio).toBeCloseTo(0.95);
    expect(r.testedSource).toBe('s1');
  });

  it('needs both figures', () => {
    expect(highwayCase(car([{ value: 200, kind: 'rated_nrcan' }]))).toBeNull();
    expect(highwayCase(car([{ value: 190, kind: 'tested' }]))).toBeNull();
    expect(highwayCase(car([]))).toBeNull();
  });
});

describe('factor maths', () => {
  it('best fit is the geometric mean of the ratios', () => {
    expect(bestFactor([c(0.8), c(1.25)])).toBeCloseTo(1, 6);
    expect(() => bestFactor([])).toThrow();
  });

  it('quantiles interpolate between ratios', () => {
    const cs = [c(0.8), c(0.9), c(1.0), c(1.1)];
    expect(ratioQuantile(cs, 0.5)).toBeCloseTo(0.95);
    expect(ratioQuantile(cs, 1)).toBeCloseTo(1.1);
  });

  it('error sign: + is the safe side', () => {
    expect(errorAt(c(1), 1.1)).toBeCloseTo(0.1);
    expect(errorAt(c(1.2), 1.0)).toBeCloseTo(1 / 1.2 - 1);
  });

  it('summary counts cars on the risky side', () => {
    const s = summariseFactor([c(0.9), c(1.0), c(1.3)], 1.0);
    expect(s.under).toBe(1);
    expect(s.underBy10).toBe(1);
    expect(s.worst).toBeCloseTo(1 / 1.3 - 1);
  });
});
