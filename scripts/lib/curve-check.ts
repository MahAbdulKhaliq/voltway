// Curve plausibility checks (B95, DESIGN-9 §3). Errors are impossible curves; warnings are
// curves a person should look at before they are shown as a car's default. Messages go to the
// gap report (a maintainer file), not to the site.

import { chooseTemplate, TEMPLATES, TEMPLATE_SOC } from '../../src/lib/estimated-curve.ts';

export interface CurveIssue {
  level: 'error' | 'warning';
  code: 'unsorted' | 'out_of_range' | 'above_peak' | 'sparse' | 'gap' | 'flat_peak' | 'year_mismatch' | 'off_template';
  message: string;
}

export interface CurveContext {
  dcMaxKw?: number | null;
  chemistry?: string | null;
  voltageClass?: string | null;
  /** True when the curve was recorded for a different generation (or year, when the model lists no generations). */
  yearMismatch?: boolean;
}

type Point = { soc_percent: number; power_kw: number };

/** Widest SoC window (in %) a template-type car plausibly holds within 5 % of its peak. */
export const FLAT_PEAK_LIMIT: Record<'400v-nmc' | '800v-nmc' | 'lfp', number> = { '400v-nmc': 25, '800v-nmc': 45, lfp: 20 };
export const MIN_POINTS = 8;
export const MAX_GAP = 15;
export const OFF_TEMPLATE = 0.4;

/** Linear interpolation of power at a SoC. */
export function powerAt(points: Point[], soc: number): number {
  if (soc <= points[0].soc_percent) return points[0].power_kw;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (soc <= b.soc_percent) return a.power_kw + ((b.power_kw - a.power_kw) * (soc - a.soc_percent)) / (b.soc_percent - a.soc_percent || 1);
  }
  return points[points.length - 1].power_kw;
}

export function checkCurve(points: Point[], ctx: CurveContext = {}): CurveIssue[] {
  const issues: CurveIssue[] = [];
  const err = (code: CurveIssue['code'], message: string) => issues.push({ level: 'error', code, message });
  const warn = (code: CurveIssue['code'], message: string) => issues.push({ level: 'warning', code, message });

  if (points.some((p) => p.soc_percent < 0 || p.soc_percent > 100 || p.power_kw < 0)) err('out_of_range', 'a point is outside 0–100 % SoC or below 0 kW');
  if (points.some((p, i) => i > 0 && p.soc_percent <= points[i - 1].soc_percent)) err('unsorted', 'points are not in rising SoC order');
  if (issues.length || points.length === 0) return issues;

  const peak = Math.max(...points.map((p) => p.power_kw));
  if (ctx.dcMaxKw && peak > ctx.dcMaxKw * 1.05) err('above_peak', `peak ${peak} kW is more than 5 % above the car's DC peak of ${ctx.dcMaxKw} kW`);

  const below = points.filter((p) => p.soc_percent < 100);
  if (below.length < MIN_POINTS) warn('sparse', `${below.length} points below 100 % (at least ${MIN_POINTS} wanted)`);

  let gap = 0;
  for (let i = 1; i < points.length; i++) gap = Math.max(gap, points[i].soc_percent - points[i - 1].soc_percent);
  if (gap > MAX_GAP) warn('gap', `a ${gap} % SoC gap between points (at most ${MAX_GAP} wanted)`);

  const { id } = chooseTemplate(ctx.chemistry ?? null, ctx.voltageClass ?? null);
  const flat = below.filter((p) => p.power_kw >= peak * 0.95).map((p) => p.soc_percent);
  const window = flat.length ? Math.max(...flat) - Math.min(...flat) : 0;
  if (window > FLAT_PEAK_LIMIT[id]) warn('flat_peak', `holds within 5 % of its ${peak} kW peak over ${window} % SoC (a ${id} car rarely holds more than ${FLAT_PEAK_LIMIT[id]} %)`);

  if (ctx.yearMismatch) warn('year_mismatch', 'recorded for a different generation or model year');

  const ref = ctx.dcMaxKw ?? peak;
  const tmpl = TEMPLATES[id][TEMPLATE_SOC.indexOf(50)] * ref;
  const at50 = powerAt(points, 50);
  if (points[0].soc_percent <= 50 && points[points.length - 1].soc_percent >= 50 && Math.abs(at50 - tmpl) / tmpl > OFF_TEMPLATE) {
    warn('off_template', `${Math.round(at50)} kW at 50 % is more than ${OFF_TEMPLATE * 100} % away from the ${id} template's ${Math.round(tmpl)} kW`);
  }
  return issues;
}
