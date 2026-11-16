import { describe, expect, it } from 'vitest';
import { caseFor, dedupe, estimateMinutes, huber, isValidShape, relError, summarise, tune, WEIGHTS, type CalibrationCase } from '../scripts/lib/calibrate.ts';
import { TEMPLATES } from '../src/lib/estimated-curve.ts';
import type { CarDetail, CurveOut } from '../src/lib/types.ts';

const sv = (value: number | string, kind = 'manufacturer') => ({ value: { value, kind, source_id: 's' } as never, others: [], conflict: false });

function car(over: { id?: string; dc?: number; usable?: number; gross?: number; published?: [number, string]; curves?: CurveOut[]; chem?: string; volt?: string }): CarDetail {
  const fields: CarDetail['fields'] = {};
  if (over.dc) fields.dc_max_kw = sv(over.dc);
  if (over.usable) fields.capacity_usable_kwh = sv(over.usable);
  if (over.gross) fields.capacity_gross_kwh = sv(over.gross);
  if (over.published) fields.published_10_80_min = sv(over.published[0], over.published[1]);
  if (over.chem) fields.chemistry = sv(over.chem);
  if (over.volt) fields.nominal_voltage_class = sv(over.volt);
  return { id: over.id ?? 'a/b/2026/c', fields, curves: over.curves ?? [] } as unknown as CarDetail;
}
const flat = (kw: number, kind: CurveOut['kind'] = 'tested', from = 0, to = 100): CurveOut => ({
  id: 'x', kind, source_id: 's', is_display_default: true,
  points: [{ soc_percent: from, power_kw: kw }, { soc_percent: to, power_kw: kw }],
});

describe('calibration cases', () => {
  it('needs a DC peak, a battery and a reference', () => {
    expect(caseFor(car({ usable: 70, published: [30, 'manufacturer'] }))).toBeNull();
    expect(caseFor(car({ dc: 150, published: [30, 'manufacturer'] }))).toBeNull();
    expect(caseFor(car({ dc: 150, usable: 70 }))).toBeNull();
  });

  it('uses a tested curve over a published time, and keeps the published figure alongside', () => {
    // 70 kWh × 70 % = 49 kWh at a flat 100 kW = 29.4 min (the QA.md hand example)
    const c = caseFor(car({ dc: 150, usable: 70, published: [25, 'manufacturer'], curves: [flat(100)] }))!;
    expect(c.refKind).toBe('tested-curve');
    expect(c.refMinutes).toBeCloseTo(29.4, 5);
    expect(c.published).toBe(25);
    expect(c.weight).toBe(WEIGHTS['tested-curve']);
  });

  it('weights tested above manufacturer claims, and halves a curve that does not cover 10–80 %', () => {
    expect(WEIGHTS['tested-curve']).toBeGreaterThan(WEIGHTS['published-manufacturer']);
    expect(WEIGHTS['published-tested']).toBeGreaterThan(WEIGHTS['published-manufacturer']);
    const c = caseFor(car({ dc: 150, usable: 70, curves: [flat(100, 'tested', 20, 70)] }))!;
    expect(c.refExtrapolated).toBe(true);
    expect(c.weight).toBe(WEIGHTS['tested-curve'] / 2);
  });

  it('ignores estimated and borrowed curves as references, falling back to the published time', () => {
    const borrowed = { ...flat(100), kind: 'estimated' as const, based_on: { variant_id: 'x', reason: 'y' } };
    const c = caseFor(car({ dc: 150, usable: 70, published: [30, 'tested'], curves: [flat(100, 'estimated'), borrowed] }))!;
    expect(c.refKind).toBe('published-tested');
    expect(c.refMinutes).toBe(30);
  });

  it('falls back to gross capacity and picks the template like the build', () => {
    expect(caseFor(car({ dc: 150, gross: 80, published: [30, 'manufacturer'], chem: 'lfp' }))!.kwh).toBe(80);
    expect(caseFor(car({ dc: 150, gross: 80, published: [30, 'manufacturer'], chem: 'lfp' }))!.template).toBe('lfp');
    expect(caseFor(car({ dc: 150, usable: 80, published: [30, 'manufacturer'], volt: '800v' }))!.template).toBe('800v-nmc');
  });

  it('merges trims with identical inputs so they count once', () => {
    const a = caseFor(car({ id: 'a', dc: 150, usable: 70, published: [30, 'manufacturer'] }))!;
    const b = caseFor(car({ id: 'b', dc: 150, usable: 70, published: [30, 'manufacturer'] }))!;
    const c = caseFor(car({ id: 'c', dc: 150, usable: 71, published: [30, 'manufacturer'] }))!;
    const d = dedupe([a, b, c]);
    expect(d).toHaveLength(2);
    expect(d[0].ids).toEqual(['a', 'b']);
  });
});

describe('errors and tuning', () => {
  it('signs the error: positive = estimate slower', () => {
    expect(relError(33, 30)).toBeCloseTo(0.1);
    expect(relError(27, 30)).toBeCloseTo(-0.1);
  });

  it('Huber is squared inside ±15 % and linear beyond', () => {
    expect(huber(0.1)).toBeCloseTo(0.005);
    expect(huber(-0.1)).toBeCloseTo(0.005);
    expect(huber(0.35) - huber(0.25)).toBeCloseTo(0.15 * 0.1);
  });

  it('shape rules: peak 1.0 at 10 %, never rising after it', () => {
    expect(isValidShape(TEMPLATES['400v-nmc'])).toBe(true);
    expect(isValidShape([0.7, 1, 1.01, 0.7, 0.5, 0.4, 0.2, 0.1])).toBe(false);
    expect(isValidShape([0.7, 1, 0.6, 0.7, 0.5, 0.4, 0.2, 0.1])).toBe(false);
    expect(isValidShape([0.7, 0.9, 0.8, 0.7, 0.5, 0.4, 0.2, 0.1])).toBe(false);
  });

  it('tuning moves a template toward slower references and stays valid', () => {
    const base: Omit<CalibrationCase, 'refMinutes'> = { ids: ['x'], template: '400v-nmc', dcMaxKw: 150, kwh: 75, refKind: 'tested-curve', weight: 3, refExtrapolated: false, published: null };
    const start = TEMPLATES['400v-nmc'];
    const est = estimateMinutes({ ...base, refMinutes: 1 }, start);
    const slow = [{ ...base, refMinutes: est * 1.2 }];
    const tuned = tune(slow, start);
    expect(isValidShape(tuned)).toBe(true);
    expect(estimateMinutes(slow[0], tuned)).toBeGreaterThan(est);
    expect(summarise(slow, tuned).meanAbs).toBeLessThan(summarise(slow, start).meanAbs);
    expect(tune([], start)).toEqual(start);
  });
});
