// Charging maths (charging-curve-viewer.md §3–§4). Pure functions, used at build time
// (browse/sort figures) and in the browser (curve viewer, compare).
//
// v1 assumptions: warm battery, no charging-loss factor (C9): the curve's kW is power
// going into the battery, and energy is "added to battery". Charger limits are applied
// here, never stored (vehicle-data-model.md §5, C4).

export interface CurvePoint {
  soc_percent: number;
  power_kw: number;
}

export interface ChargeInput {
  points: CurvePoint[];        // sorted by SoC, ≥ 2 points
  usableKwh: number;
  startSoc: number;            // %
  endSoc: number;              // %
  chargerKw?: number | null;   // undefined/null = "No limit"
  whPerKm?: number;            // consumption for km added; omit if unknown
  stepPercent?: number;        // default 0.5
}

export interface ChargeStep {
  soc: number;                 // SoC at the end of the step
  carKw: number;               // car curve power at the step's midpoint
  deliveredKw: number;         // min(car, charger)
  elapsedMin: number;          // minutes since the start, at the end of the step
}

export interface ChargeResult {
  minutes: number;             // total charging time
  idealMinutes: number;        // same window with no charger limit
  lostToChargerMinutes: number;
  energyKwh: number;           // added to battery
  averageKw: number;           // energy ÷ time (0 if no time)
  kmAdded: number | null;      // null when consumption is unknown
  kmPer10Min: number | null;   // the headline comparison figure (C7)
  peakKw: number;              // highest delivered power in the window
  peakAtSoc: number;
  minutesAbove: Record<100 | 150 | 200, number>;
  steps: ChargeStep[];         // for the power-vs-time chart
  /** B24: true when the window reaches past the curve's first or last point (flat extension). */
  extrapolated: boolean;
}

/** SoC range the curve's points actually cover (B24). Outside it, powerAt() extends flat. */
export function measuredSpan(points: CurvePoint[]): { from: number; to: number } {
  return { from: points[0].soc_percent, to: points[points.length - 1].soc_percent };
}

/** True when a start→end window uses SoC outside the measured span (B24). */
export function usesExtension(points: CurvePoint[], startSoc: number, endSoc: number): boolean {
  if (endSoc <= startSoc) return false;
  const { from, to } = measuredSpan(points);
  return startSoc < from - 1e-9 || endSoc > to + 1e-9;
}

/** Power at any SoC, joining points with straight lines; flat beyond the first/last point. */
export function powerAt(points: CurvePoint[], soc: number): number {
  if (points.length === 0) throw new Error('Curve has no points');
  if (soc <= points[0].soc_percent) return points[0].power_kw;
  const last = points[points.length - 1];
  if (soc >= last.soc_percent) return last.power_kw;
  for (let i = 1; i < points.length; i++) {
    const b = points[i];
    if (soc <= b.soc_percent) {
      const a = points[i - 1];
      const t = (soc - a.soc_percent) / (b.soc_percent - a.soc_percent);
      return a.power_kw + t * (b.power_kw - a.power_kw);
    }
  }
  return last.power_kw;
}

export function calculateCharge(input: ChargeInput): ChargeResult {
  const { points, usableKwh, startSoc, endSoc } = input;
  const step = input.stepPercent ?? 0.5;
  const limit = input.chargerKw ?? Infinity;

  if (points.length < 2) throw new Error('A curve needs at least 2 points');
  if (!(usableKwh > 0)) throw new Error('Usable battery capacity must be positive');
  if (!(startSoc >= 0 && endSoc <= 100 && startSoc <= endSoc)) {
    throw new Error(`SoC window must satisfy 0 ≤ start ≤ end ≤ 100 (got ${startSoc} → ${endSoc})`);
  }
  if (!(limit > 0)) throw new Error('Charger power must be positive');
  if (!(step > 0)) throw new Error('Step must be positive');

  let hours = 0;
  let idealHours = 0;
  let peakKw = 0;
  let peakAtSoc = startSoc;
  const above = { 100: 0, 150: 0, 200: 0 };
  const steps: ChargeStep[] = [];

  for (let soc = startSoc; soc < endSoc - 1e-9; soc += step) {
    const width = Math.min(step, endSoc - soc);
    const mid = soc + width / 2; // midpoint rule: exact for flat curves, accurate for sloped ones
    const carKw = powerAt(points, mid);
    if (!(carKw > 0)) throw new Error(`Curve power is zero at ${mid.toFixed(1)}% SoC; the window can't be charged`);
    const deliveredKw = Math.min(carKw, limit);
    const energy = (usableKwh * width) / 100;
    const h = energy / deliveredKw;
    hours += h;
    idealHours += energy / carKw;
    for (const k of [100, 150, 200] as const) if (deliveredKw >= k) above[k] += h * 60;
    if (deliveredKw > peakKw) { peakKw = deliveredKw; peakAtSoc = mid; }
    steps.push({ soc: soc + width, carKw, deliveredKw, elapsedMin: hours * 60 });
  }

  const minutes = hours * 60;
  const idealMinutes = idealHours * 60;
  const energyKwh = (usableKwh * (endSoc - startSoc)) / 100;
  const kmAdded = input.whPerKm && input.whPerKm > 0 ? (energyKwh * 1000) / input.whPerKm : null;

  return {
    minutes,
    idealMinutes,
    lostToChargerMinutes: Math.max(0, minutes - idealMinutes),
    energyKwh,
    averageKw: hours > 0 ? energyKwh / hours : 0,
    kmAdded,
    kmPer10Min: kmAdded !== null && minutes > 0 ? (kmAdded / minutes) * 10 : null,
    peakKw,
    peakAtSoc,
    minutesAbove: above,
    steps,
    extrapolated: usesExtension(points, startSoc, endSoc),
  };
}

/**
 * Minutes as shown to people. Results from estimated curves are rounded to the nearest
 * 5 minutes so they don't look more precise than they are (charging-curve-viewer.md §9).
 */
export function displayMinutes(minutes: number, estimated: boolean): number {
  if (!(minutes > 0)) return 0; // an empty window takes no time (QA 9.1)
  return estimated ? Math.max(5, Math.round(minutes / 5) * 5) : Math.round(minutes);
}
