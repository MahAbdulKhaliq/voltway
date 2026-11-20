// Shapes of the build output (public/data/), shared by the data build and the site.

export type Kind = 'rated_nrcan' | 'rated_epa' | 'rated_wltp' | 'manufacturer' | 'tested' | 'community' | 'estimated';

export interface SourcedValue<T = number | string> {
  value: T;
  unit?: string;
  kind: Kind;
  source_id: string;
  notes?: string;
  low_confidence?: boolean;
}

/** A figure after precedence: the default shown, every other value, and a "sources differ" flag. */
export interface Resolved<T = number | string> {
  value: SourcedValue<T>;
  others: SourcedValue<T>[];
  conflict: boolean;
}

/** null = no source has it yet; shown as "Unknown" (data model principle 3). */
export type Field<T = number | string> = Resolved<T> | null;

export interface Source {
  id: string;
  type: string;
  title: string;
  url: string;
  license?: string;
  attribution?: string;
  accessed_on: string;
  via?: string;
  notes?: string;
}

export interface CurveOut {
  id: string;
  kind: 'tested' | 'community' | 'manufacturer' | 'estimated';
  source_id: string;
  points: { soc_percent: number; power_kw: number }[];
  is_display_default: boolean;
  notes?: string;
  basis?: string;               // estimated curves: template and inputs used
  based_on?: { variant_id: string; reason: string }; // borrowed from a same-pack sibling (B16)
  conditions?: Record<string, unknown>;
  low_confidence?: boolean;
  issues?: { level: 'error' | 'warning'; code: string; message: string }[]; // B95 plausibility checks
  reviewed_note?: string;       // B95: a person cleared the warnings
}

export interface TrimOut {
  id: string;
  name: string;                 // the name in the variant's first market
  names: Partial<Record<'CA' | 'US', string>>; // B91: per-market names
  aliases?: string[];
  heat_pump: Field<string>;
  range_km: Field<number>;      // only set when it differs from the variant's
  consumption_combined_wh_per_km: Field<number>; // only set when the trim is rated on its own
  consumption_city_wh_per_km: Field<number>;
  consumption_highway_wh_per_km: Field<number>;
  recharge_time_240v_h?: Field<number>; // B104: only set when the trim is rated on its own row and differs
  ac_max_kw: Field<number>;     // the trim's own onboard charger (B7), when known
  wheels: { diameter_in: number; is_standard: boolean; tire_size?: string; source_id?: string; notes?: string; low_confidence?: boolean; rated_range_km?: SourcedValue; rated_consumption_wh_per_km?: SourcedValue }[];
}

export interface Derived {
  /** Uncapped 10–80 % with the default curve; null when inputs are missing. */
  minutes_10_80: number | null;
  km_per_10_min: number | null;
  /** True when the time comes from an estimated curve, a gross-capacity fallback, or SoC outside the measured points (B24). */
  estimated: boolean;
  /** B24: the 10–80 % window reaches past the default curve's measured points. */
  extrapolated: boolean;
  /** Which battery figure the maths used. */
  battery_basis: 'usable' | 'gross' | null;
}

export interface CarDetail {
  id: string;                   // make/model/year/variant
  make: { id: string; name: string };
  model: { id: string; name: string; body_type: string };
  year: number;
  name: string;                 // variant name
  drivetrain: string;
  sold_in_canada: boolean;
  markets: string[];            // B91: CA / US
  powertrain_id?: string;       // B95
  fields: Record<string, Field>;
  trims: TrimOut[];
  curves: CurveOut[];
  derived: Derived;
  sources: Source[];            // every source cited on this car
}

export interface IndexEntry {
  id: string;
  make: string;
  model: string;
  year: number;
  name: string;
  body_type: string;
  drivetrain: string;
  sold_in_canada: boolean;
  markets: string[];
  range_km: number | null;
  dc_max_kw: number | null;
  usable_kwh: number | null;
  charge_port: string | null;
  voltage_class: string | null;
  heat_pump: string[];          // distinct trim heat-pump values
  chemistry: string | null;
  /** Combined consumption (Wh/km), for the efficiency sort. */
  consumption_wh_per_km: number | null;
  supercharger_access: string | null;
  /** Trim names and aliases, for search. */
  trims: string[];
  curve_kind: CurveOut['kind'] | null;
  /** The trip planner has what it needs for this car (trip-car.ts); the map's car picker lists the rest last. */
  trip_ready: boolean;
  derived: Derived;
}

/** The fields a variant must end up with (vehicle-data-model.md §4, MVP). */
export const MVP_FIELDS = [
  'capacity_usable_kwh',
  'chemistry',
  'nominal_voltage_class',
  'preconditioning',
  'ac_max_kw',
  'dc_max_kw',
  'charge_port',
  'supercharger_access',
  'consumption_combined_wh_per_km',
  'consumption_city_wh_per_km',
  'consumption_highway_wh_per_km',
  'range_km',
] as const;
