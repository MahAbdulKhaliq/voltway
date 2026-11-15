// Rough effect of wheel size on efficiency and range (decision B13, brings D10 forward).
// Learned from official ratings that rate the same car at more than one wheel size, from
// ANY source (NRCan today; EPA, WLTP or others can add pairs later). Not NRCan-specific.

/** One official rating of a car at a known wheel size. `group` = "same car apart from wheels". */
export interface RatingRow {
  group: string;
  wheel_in: number;
  wh_per_km: number;
  source_id: string;
}

export interface WheelEffect {
  /** Median change in consumption per inch of wheel diameter (0.036 = +3.6 % per inch). */
  pct_per_inch: number;
  /** Middle half of the observed pairs (25th–75th percentile), to show how rough it is. */
  low: number;
  high: number;
  pairs: number;
  source_ids: string[];
}

const quantile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)))];

/** Derives the per-inch effect from rating rows. Returns null when there are no usable pairs. */
export function deriveWheelEffect(rows: RatingRow[]): WheelEffect | null {
  const groups = new Map<string, RatingRow[]>();
  for (const r of rows) groups.set(r.group, [...(groups.get(r.group) ?? []), r]);
  const per: number[] = [];
  const sources = new Set<string>();
  for (const g of groups.values()) {
    const sorted = [...g].sort((a, b) => a.wheel_in - b.wheel_in);
    const a = sorted[0];
    const b = sorted[sorted.length - 1];
    if (!a || !b || a.wheel_in === b.wheel_in || !(a.wh_per_km > 0)) continue;
    per.push((b.wh_per_km / a.wh_per_km - 1) / (b.wheel_in - a.wheel_in));
    sources.add(a.source_id).add(b.source_id);
  }
  if (per.length === 0) return null;
  per.sort((x, y) => x - y);
  const round = (x: number) => Math.round(x * 10000) / 10000;
  return { pct_per_inch: round(quantile(per, 0.5)), low: round(quantile(per, 0.25)), high: round(quantile(per, 0.75)), pairs: per.length, source_ids: [...sources].sort() };
}

/**
 * Applies the effect: consumption scales by (1 + pct × Δinches); range by the inverse
 * (same battery, more energy per km). Returns the factor so callers can say what changed.
 */
export function applyWheelEffect(baseInches: number, newInches: number, effect: WheelEffect, base: { whPerKm?: number | null; rangeKm?: number | null }) {
  const factor = Math.max(0.5, 1 + effect.pct_per_inch * (newInches - baseInches));
  return {
    factor,
    whPerKm: base.whPerKm ? base.whPerKm * factor : null,
    rangeKm: base.rangeKm ? base.rangeKm / factor : null,
  };
}
