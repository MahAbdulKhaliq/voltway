// Rough effect of outside temperature on range (B116, docs/design/outside-temperature.md).
// A fixed retention table, from published fleet and lab data, gives the share of mild-weather
// range a car keeps at a temperature. Two curves: heat pump or not (heating matters most); LFP
// packs lose a few points more in the cold (owner, 2026-11-20), growing as it gets colder.
// Temperatures are °C internally (°F is display only). Derived, never stored.

export type TempUnit = 'C' | 'F';
export type HeatCurve = 'none' | 'heat_pump';

/** Mild weather: the rating's conditions, where the factor is 1. */
export const MILD_C = 20;
export const MIN_C = -30;
export const MAX_C = 45;
/** Below this the estimate is beyond most published data (design §3). */
export const SPARSE_BELOW_C = -20;

/** [°C, share of mild-weather range kept]. Design §3; every anchor is explained there. */
export const RETENTION: Record<HeatCurve, ReadonlyArray<readonly [number, number]>> = {
  none: [[-30, 0.40], [-25, 0.43], [-20, 0.48], [-15, 0.54], [-10, 0.60], [-7, 0.64], [0, 0.75], [5, 0.83], [10, 0.91], [15, 0.97], [20, 1], [25, 1], [30, 0.97], [32, 0.95], [35, 0.91], [38, 0.85], [40, 0.82], [45, 0.75]],
  heat_pump: [[-30, 0.40], [-25, 0.44], [-20, 0.50], [-15, 0.58], [-10, 0.67], [-7, 0.72], [0, 0.83], [5, 0.89], [10, 0.94], [15, 0.98], [20, 1], [25, 1], [30, 0.97], [32, 0.95], [35, 0.91], [38, 0.85], [40, 0.82], [45, 0.75]],
};

export type Outcome = 'best' | 'mid' | 'worst';

/**
 * Best and worst case around the middle (owner, 2026-11-20; design §3 "Best and worst case"):
 * best = preheated while plugged in, longer drives, a car that does well in the cold;
 * worst = cold-soaked, short trips, cabin at 22 °C (the lab tests), a car that does poorly.
 * The figures on the page use the middle; the band is shown in the note.
 */
export const RETENTION_BAND: Record<'best' | 'worst', Record<HeatCurve, ReadonlyArray<readonly [number, number]>>> = {
  best: {
    none: [[-30, 0.50], [-25, 0.54], [-20, 0.60], [-15, 0.66], [-10, 0.72], [-7, 0.76], [0, 0.85], [5, 0.90], [10, 0.96], [15, 0.99], [20, 1], [25, 1], [30, 0.99], [32, 0.98], [35, 0.96], [38, 0.92], [40, 0.90], [45, 0.85]],
    heat_pump: [[-30, 0.52], [-25, 0.56], [-20, 0.62], [-15, 0.70], [-10, 0.80], [-7, 0.84], [0, 0.90], [5, 0.94], [10, 0.97], [15, 0.99], [20, 1], [25, 1], [30, 0.99], [32, 0.98], [35, 0.96], [38, 0.92], [40, 0.90], [45, 0.85]],
  },
  worst: {
    none: [[-30, 0.32], [-25, 0.35], [-20, 0.40], [-15, 0.45], [-10, 0.52], [-7, 0.55], [0, 0.65], [5, 0.74], [10, 0.85], [15, 0.94], [20, 1], [25, 1], [30, 0.94], [32, 0.91], [35, 0.86], [38, 0.78], [40, 0.74], [45, 0.66]],
    heat_pump: [[-30, 0.32], [-25, 0.36], [-20, 0.41], [-15, 0.48], [-10, 0.58], [-7, 0.62], [0, 0.72], [5, 0.80], [10, 0.88], [15, 0.95], [20, 1], [25, 1], [30, 0.94], [32, 0.91], [35, 0.86], [38, 0.78], [40, 0.74], [45, 0.66]],
  },
};

/** A best-to-worst band (shares of mild-weather range kept). */
export interface Band { best: number; worst: number }

/** LFP/LMFP extra loss in points of range (design §3 "LFP adjustment"): 0 from 10 °C up. Low confidence. */
export const LFP_PENALTY: ReadonlyArray<readonly [number, number]> = [[-30, 0.08], [-20, 0.07], [-10, 0.05], [0, 0.03], [10, 0]];

const isLfp = (chemistry: string | null | undefined) => chemistry === 'lfp' || chemistry === 'lmfp';

/** Linear interpolation in a [x, y] table, holding the end values outside it. */
function interpolate(table: ReadonlyArray<readonly [number, number]>, x: number): number {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i];
    if (x <= x1) {
      const [x0, y0] = table[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return table[table.length - 1][1];
}

/** LFP penalty at tC (°C), in share of range; 0 for other chemistries. */
export function lfpPenalty(tC: number, chemistry: string | null | undefined): number {
  if (!isLfp(chemistry)) return 0;
  const t = Number.isFinite(tC) ? Math.min(MAX_C, Math.max(MIN_C, tC)) : MILD_C;
  return interpolate(LFP_PENALTY, t);
}

/** The studies the model rests on (data/sources); the build fails if one is missing. The first is cited on each estimate. */
export const TEMPERATURE_SOURCE_IDS = [
  'src-b116-recurrent-heat-pump-split',
  'src-b116-recurrent-winter-2025',
  'src-b116-recurrent-heat-pumps',
  'src-b116-doe-cold-ambient',
  'src-b116-aaa-2019',
  'src-b116-aaa-2026',
  'src-b116-geotab-temperature',
  'src-b116-recurrent-summer-2025',
  'src-b116-recurrent-lfp',
  'src-b116-p3-cell-low-temperature',
] as const;

export const cToF = (c: number): number => (c * 9) / 5 + 32;
export const fToC = (f: number): number => ((f - 32) * 5) / 9;

/**
 * Share of mild-weather range kept at tC (°C), linear between table points, clamped to MIN_C…MAX_C.
 * With a chemistry, LFP/LMFP packs take the cold penalty.
 */
export function retention(tC: number, curve: HeatCurve, chemistry?: string | null, outcome: Outcome = 'mid'): number {
  const t = Number.isFinite(tC) ? Math.min(MAX_C, Math.max(MIN_C, tC)) : MILD_C;
  const table = outcome === 'mid' ? RETENTION[curve] : RETENTION_BAND[outcome][curve];
  return interpolate(table, t) - lfpPenalty(t, chemistry);
}

const band = (t: number, curve: HeatCurve, chemistry: string | null | undefined): Band =>
  ({ best: retention(t, curve, chemistry, 'best'), worst: retention(t, curve, chemistry, 'worst') });

export interface TemperatureEffect {
  /** Multiplies consumption (= 1 / retained); range is divided by it. */
  factor: number;
  /** Share of mild-weather range kept (range change = retained − 1). */
  retained: number;
  /** Best-to-worst band around `retained` (shown in the note; the figures use the middle). */
  band: Band;
  /** Curve used for the figures. */
  curve: HeatCurve;
  /** The heat-pump curve's share, for an optional heat pump the visitor hasn't ticked, when it differs. */
  withHeatPump: number | null;
  /** The heat-pump curve's band, alongside `withHeatPump`. */
  withHeatPumpBand: Band | null;
  /** The trim's heat pump is optional, so the page offers a Heat pump checkbox. */
  heatPumpOptional: boolean;
  /** LFP cold penalty included in retained (share of range; 0 when none). */
  lfpPenalty: number;
  /** The trim's heat pump isn't known, so the figures assume none. */
  heatPumpUnknown: boolean;
  /** The temperature was outside MIN_C…MAX_C and was clamped. */
  clamped: boolean;
  /** Below SPARSE_BELOW_C: beyond most published data. */
  sparse: boolean;
  /** LFP pack below freezing: a little more range lost, and cold fast charging can be much slower. */
  lfpNote: boolean;
}

/**
 * The effect for a trim. `heatPump` is the trim's `heat_pump` value (B112): standard → heat-pump
 * curve; none or unknown → no-heat-pump curve; optional or standard_or_optional → the heat-pump
 * curve only when the visitor ticks Heat pump (`heatPumpFitted`), else the safe no-heat-pump
 * curve with the heat-pump figure alongside.
 */
export function temperatureEffect(
  tC: number,
  heatPump: string | null | undefined,
  chemistry: string | null | undefined,
  opts: { heatPumpFitted?: boolean } = {},
): TemperatureEffect {
  const t = Number.isFinite(tC) ? tC : MILD_C;
  const optional = heatPump === 'optional' || heatPump === 'standard_or_optional';
  const curve: HeatCurve = heatPump === 'standard' || (optional && opts.heatPumpFitted) ? 'heat_pump' : 'none';
  const retained = retention(t, curve, chemistry);
  const hp = retention(t, 'heat_pump', chemistry);
  const showHp = optional && curve === 'none' && Math.abs(hp - retained) > 1e-9;
  return {
    factor: 1 / retained,
    retained,
    band: band(t, curve, chemistry),
    curve,
    withHeatPump: showHp ? hp : null,
    withHeatPumpBand: showHp ? band(t, 'heat_pump', chemistry) : null,
    heatPumpOptional: optional,
    lfpPenalty: lfpPenalty(t, chemistry),
    heatPumpUnknown: !heatPump || heatPump === 'unknown',
    clamped: t < MIN_C || t > MAX_C,
    sparse: t < SPARSE_BELOW_C,
    lfpNote: isLfp(chemistry) && t < 0,
  };
}
