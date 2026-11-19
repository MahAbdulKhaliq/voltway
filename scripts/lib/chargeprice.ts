// Turns records from the archived Chargeprice "Open EV Data" set into normalized records.
// Measured curves become `community` (B95): simplified Fastned charts relayed by Chargeprice, not our own
// independent test (data-sources.md §2). The build attaches them only within the same generation.
// Generic filler shapes are skipped (decision B3), including ones not flagged as default.

export interface ChargepriceVehicle {
  id: string;
  brand: string;
  model: string;
  variant?: string | null;
  release_year: number;
  vehicle_type: string;
  usable_battery_size?: number;
  ac_charger?: { max_power?: number; ports?: string[] };
  dc_charger?: {
    max_power?: number;
    ports?: string[];
    charging_curve?: { percentage: number; power: number }[];
    is_default_charging_curve?: boolean;
  };
  charging_voltage?: number;
}

interface Num { value: number; unit: string; kind: 'manufacturer'; source_id: string; low_confidence: true; notes: string }
interface Fact { value: string; kind: 'manufacturer'; source_id: string; low_confidence: true; notes: string }

export interface ChargepriceRecord {
  source_key: string;
  year: number;
  make: string;
  model: string;
  variant?: string;
  capacity_usable_kwh?: Num[];
  dc_max_kw?: Num[];
  ac_max_kw?: Num[];
  nominal_voltage_class?: Fact[];
  curve?: {
    kind: 'community';
    source_id: string;
    points: { soc_percent: number; power_kw: number }[];
    notes: string;
  };
  curve_skipped?: 'flagged_default' | 'generic_shape' | 'no_curve';
}

const SPEC_NOTE = 'The Chargeprice archive does not cite a source for its specs.';
const CURVE_NOTE =
  'Measured curve as published in the Chargeprice Open EV Data archive, which described its measured curves as simplified versions of Fastned charging charts (battery around 30 °C). Chain recorded in data-sources.md; the original chargeprice/open-ev-data README is no longer online to re-check (2026-11-15).';

/**
 * A curve is a generic shape, not a measurement, when it has fewer than 3 points or when
 * every point below 100% sits on a round fraction (multiple of 0.05) of the curve's own peak.
 * Real measured curves essentially never do; the archive's filler templates always do
 * (e.g. 100% of peak to 50% SoC, 60% at 80%, 30% at 100%). The 100% point is excluded
 * because some templates end on an odd value.
 */
export function isGenericShape(points: { percentage: number; power: number }[]): boolean {
  if (points.length < 3) return true;
  const peak = Math.max(...points.map((p) => p.power));
  if (!(peak > 0)) return true;
  return points
    .filter((p) => p.percentage < 100)
    .every((p) => {
      const ratio = p.power / peak;
      return Math.abs(ratio / 0.05 - Math.round(ratio / 0.05)) * 0.05 < 0.006;
    });
}

export function normalizeChargeprice(v: ChargepriceVehicle, sourceId: string): ChargepriceRecord {
  const num = (value: number | undefined, unit: string): Num[] | undefined =>
    typeof value === 'number' && value > 0
      ? [{ value, unit, kind: 'manufacturer', source_id: sourceId, low_confidence: true, notes: SPEC_NOTE }]
      : undefined;

  const curvePoints = v.dc_charger?.charging_curve ?? [];
  let curve: ChargepriceRecord['curve'];
  let skipped: ChargepriceRecord['curve_skipped'];
  if (curvePoints.length === 0) skipped = 'no_curve';
  else if (v.dc_charger?.is_default_charging_curve !== false) skipped = 'flagged_default';
  else if (isGenericShape(curvePoints)) skipped = 'generic_shape';
  else {
    curve = {
      kind: 'community',
      source_id: sourceId,
      points: curvePoints.map((p) => ({ soc_percent: p.percentage, power_kw: p.power })),
      notes: CURVE_NOTE,
    };
  }

  const volts = v.charging_voltage === 400 ? '400v' : v.charging_voltage === 800 ? '800v' : undefined;
  const variant = v.variant?.trim();
  const rec: ChargepriceRecord = {
    source_key: v.id,
    year: v.release_year,
    make: v.brand.trim(),
    model: v.model.trim(),
    ...(variant ? { variant } : {}),
    capacity_usable_kwh: num(v.usable_battery_size, 'kWh'),
    dc_max_kw: num(v.dc_charger?.max_power, 'kW'),
    ac_max_kw: num(v.ac_charger?.max_power, 'kW'),
    nominal_voltage_class: volts
      ? [{ value: volts, kind: 'manufacturer', source_id: sourceId, low_confidence: true, notes: SPEC_NOTE }]
      : undefined,
    curve,
    curve_skipped: skipped,
  };
  return Object.fromEntries(Object.entries(rec).filter(([, x]) => x !== undefined)) as ChargepriceRecord;
}

export function makeSlug(brand: string): string {
  return brand.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
