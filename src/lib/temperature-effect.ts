// Rough effect of outside temperature on range (B116, docs/design/outside-temperature.md).
// A fixed retention table, from published fleet and lab data, gives the share of mild-weather
// range a car keeps at a temperature. Two curves: heat pump or not (heating is what matters);
// chemistry doesn't change range in the published data and only adds an LFP charging note.
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
] as const;

export const cToF = (c: number): number => (c * 9) / 5 + 32;
export const fToC = (f: number): number => ((f - 32) * 5) / 9;

/** Share of mild-weather range kept at tC (°C), linear between table points, clamped to MIN_C…MAX_C. */
export function retention(tC: number, curve: HeatCurve): number {
  const table = RETENTION[curve];
  const t = Number.isFinite(tC) ? Math.min(MAX_C, Math.max(MIN_C, tC)) : MILD_C;
  for (let i = 1; i < table.length; i++) {
    const [t1, r1] = table[i];
    if (t <= t1) {
      const [t0, r0] = table[i - 1];
      return r0 + ((r1 - r0) * (t - t0)) / (t1 - t0);
    }
  }
  return table[table.length - 1][1];
}

export interface TemperatureEffect {
  /** Multiplies consumption (= 1 / retained); range is divided by it. */
  factor: number;
  /** Share of mild-weather range kept (range change = retained − 1). */
  retained: number;
  /** Curve used for the figures. */
  curve: HeatCurve;
  /** The heat-pump curve's share, for a trim whose heat pump is optional, when it differs. */
  withHeatPump: number | null;
  /** The trim's heat pump isn't known, so the figures assume none. */
  heatPumpUnknown: boolean;
  /** The temperature was outside MIN_C…MAX_C and was clamped. */
  clamped: boolean;
  /** Below SPARSE_BELOW_C: beyond most published data. */
  sparse: boolean;
  /** LFP pack below freezing: range loss is similar, but cold fast charging can be much slower. */
  lfpNote: boolean;
}

/**
 * The effect for a trim. `heatPump` is the trim's `heat_pump` value (B112): standard → heat-pump
 * curve; none, optional, standard_or_optional or unknown → no-heat-pump curve (the safe case),
 * with the heat-pump figure alongside for optional ones.
 */
export function temperatureEffect(tC: number, heatPump: string | null | undefined, chemistry: string | null | undefined): TemperatureEffect {
  const t = Number.isFinite(tC) ? tC : MILD_C;
  const curve: HeatCurve = heatPump === 'standard' ? 'heat_pump' : 'none';
  const retained = retention(t, curve);
  const optional = heatPump === 'optional' || heatPump === 'standard_or_optional';
  const hp = retention(t, 'heat_pump');
  return {
    factor: 1 / retained,
    retained,
    curve,
    withHeatPump: optional && Math.abs(hp - retained) > 1e-9 ? hp : null,
    heatPumpUnknown: !heatPump || heatPump === 'unknown',
    clamped: t < MIN_C || t > MAX_C,
    sparse: t < SPARSE_BELOW_C,
    lfpNote: (chemistry === 'lfp' || chemistry === 'lmfp') && t < 0,
  };
}
