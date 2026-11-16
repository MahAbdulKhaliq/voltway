// Template calibration (charging-curve-viewer.md §9, checklist 2.2). Pure, so it is unit-tested.
// For each car with a measured curve or a published 10–80 % time, build the template estimate
// from its DC peak and compare 10–80 % times. Tuning nudges each template's fractions to cut the
// weighted error, keeping the shape falling after its peak.

import { calculateCharge, usesExtension, type CurvePoint } from '../../src/lib/charging.ts';
import { chooseTemplate, TEMPLATE_SOC, type TemplateId } from '../../src/lib/estimated-curve.ts';
import type { CarDetail } from '../../src/lib/types.ts';

export type RefKind = 'tested-curve' | 'community-curve' | 'manufacturer-curve' | 'published-tested' | 'published-community' | 'published-manufacturer';

/** How much each kind of reference counts (§9 step 3: tested beats manufacturer claims, which tend to be best-case). */
export const WEIGHTS: Record<RefKind, number> = {
  'tested-curve': 3,
  'community-curve': 2,
  'manufacturer-curve': 1,
  'published-tested': 2,
  'published-community': 1.5,
  'published-manufacturer': 1,
};

export interface CalibrationCase {
  ids: string[];            // variants sharing identical inputs count once
  template: TemplateId;
  dcMaxKw: number;
  kwh: number;
  refMinutes: number;
  refKind: RefKind;
  weight: number;
  /** The measured curve doesn't cover 10–80 %, so its time leans on the flat extension (B24). */
  refExtrapolated: boolean;
  published: number | null; // the published 10–80 %, shown alongside a curve reference
}

const num = (f: CarDetail['fields'][string]) => (f && typeof f.value.value === 'number' ? (f.value.value as number) : null);
const str = (f: CarDetail['fields'][string]) => (f && typeof f.value.value === 'string' ? (f.value.value as string) : null);

export function minutes1080(points: CurvePoint[], kwh: number): number {
  return calculateCharge({ points, usableKwh: kwh, startSoc: 10, endSoc: 80 }).minutes;
}

/** One case per car that has a DC peak, a battery size and a reference time; null otherwise. */
export function caseFor(car: CarDetail): CalibrationCase | null {
  const dc = num(car.fields.dc_max_kw);
  const kwh = num(car.fields.capacity_usable_kwh) ?? num(car.fields.capacity_gross_kwh);
  if (!dc || !kwh) return null;
  const measured = car.curves.filter((c) => c.kind !== 'estimated' && !c.based_on);
  const order = { tested: 0, community: 1, manufacturer: 2 } as const;
  const curve = measured.sort((a, b) => order[a.kind as keyof typeof order] - order[b.kind as keyof typeof order])[0];
  const pub = car.fields.published_10_80_min;
  const published = num(pub);
  let refMinutes: number;
  let refKind: RefKind;
  let refExtrapolated = false;
  if (curve) {
    refMinutes = minutes1080(curve.points, kwh);
    refKind = `${curve.kind}-curve` as RefKind;
    refExtrapolated = usesExtension(curve.points, 10, 80);
  } else if (published && pub) {
    refMinutes = published;
    const k = pub.value.kind;
    refKind = k === 'tested' ? 'published-tested' : k === 'community' ? 'published-community' : 'published-manufacturer';
  } else return null;
  const weight = WEIGHTS[refKind] * (refExtrapolated ? 0.5 : 1);
  const { id: template } = chooseTemplate(str(car.fields.chemistry), str(car.fields.nominal_voltage_class));
  return { ids: [car.id], template, dcMaxKw: dc, kwh, refMinutes, refKind, weight, refExtrapolated, published: curve ? published : null };
}

/** Variants with identical inputs and reference (trims of one pack) would count several times; merge them. */
export function dedupe(cases: CalibrationCase[]): CalibrationCase[] {
  const out = new Map<string, CalibrationCase>();
  for (const c of cases) {
    const key = [c.template, c.dcMaxKw, c.kwh, c.refMinutes.toFixed(2), c.refKind].join('|');
    const seen = out.get(key);
    if (seen) seen.ids.push(...c.ids);
    else out.set(key, { ...c, ids: [...c.ids] });
  }
  return [...out.values()];
}

export function estimateMinutes(c: CalibrationCase, fractions: number[]): number {
  const points = TEMPLATE_SOC.map((soc, i) => ({ soc_percent: soc, power_kw: fractions[i] * c.dcMaxKw }));
  return minutes1080(points, c.kwh);
}

/** Signed error of the estimate against the reference: +0.1 = estimate 10 % slower. */
export function relError(estimate: number, reference: number): number {
  return (estimate - reference) / reference;
}

/** Huber penalty: squared inside ±delta, linear beyond, so one odd reference can't drag a whole template. */
export function huber(e: number, delta = HUBER_DELTA): number {
  const a = Math.abs(e);
  return a <= delta ? 0.5 * e * e : delta * (a - 0.5 * delta);
}
export const HUBER_DELTA = 0.15; // the ±15 % target (§9)

/** Weighted mean Huber loss on the log error, plus a small pull toward the starting shape so unconstrained points stay sensible. */
export function loss(cases: CalibrationCase[], fractions: number[], start: number[], pull = 0.02): number {
  let sum = 0;
  let w = 0;
  for (const c of cases) {
    const e = Math.log(estimateMinutes(c, fractions) / c.refMinutes);
    sum += c.weight * huber(e);
    w += c.weight;
  }
  const reg = fractions.reduce((s, f, i) => s + (f - start[i]) ** 2, 0);
  return (w ? sum / w : 0) + pull * reg;
}

/** The template keeps its peak at 1.0 and never rises again after it (from 10 % SoC on). */
export function isValidShape(f: number[]): boolean {
  const i10 = TEMPLATE_SOC.indexOf(10);
  if (f[i10] !== 1) return false;
  for (let i = i10 + 1; i < f.length; i++) if (f[i] > f[i - 1] + 1e-9 || f[i] <= 0) return false;
  return f.every((x) => x > 0 && x <= 1);
}

/**
 * Coordinate search over the fractions that shape 10–80 % (30, 50, 70, 80 % SoC), in 0.01 steps.
 * 0 %, 10 %, 90 % and 100 % stay put: they don't change a 10–80 % time.
 */
export function tune(cases: CalibrationCase[], start: number[]): number[] {
  if (!cases.length) return [...start];
  const free = [30, 50, 70, 80].map((s) => TEMPLATE_SOC.indexOf(s));
  const round2 = (x: number) => Math.round(x * 100) / 100;
  let best = [...start];
  let bestLoss = loss(cases, best, start);
  for (let pass = 0; pass < 500; pass++) {
    let improved = false;
    for (const i of free) {
      for (const d of [0.01, -0.01]) {
        const next = [...best];
        next[i] = round2(next[i] + d);
        if (!isValidShape(next)) continue;
        const l = loss(cases, next, start);
        if (l < bestLoss - 1e-12) { best = next; bestLoss = l; improved = true; }
      }
    }
    if (!improved) break;
  }
  return best;
}

export interface Summary { n: number; within15: number; meanAbs: number; meanSigned: number }

export function summarise(cases: CalibrationCase[], fractions: number[]): Summary {
  const errs = cases.map((c) => relError(estimateMinutes(c, fractions), c.refMinutes));
  const n = errs.length;
  return {
    n,
    within15: errs.filter((e) => Math.abs(e) <= 0.15 + 1e-9).length,
    meanAbs: n ? errs.reduce((s, e) => s + Math.abs(e), 0) / n : 0,
    meanSigned: n ? errs.reduce((s, e) => s + e, 0) / n : 0,
  };
}
