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
  conditions?: Record<string, unknown>;
  low_confidence?: boolean;
}

export interface TrimOut {
  id: string;
  name: string;
  aliases?: string[];
  heat_pump: Field<string>;
  range_km: Field<number>;      // only set when it differs from the variant's
  consumption_combined_wh_per_km: Field<number>; // only set when the trim is rated on its own
  consumption_city_wh_per_km: Field<number>;
  consumption_highway_wh_per_km: Field<number>;
  ac_max_kw: Field<number>;     // the trim's own onboard charger (B7), when known
  wheels: { diameter_in: number; is_standard: boolean; tire_size?: string; source_id?: string; notes?: string; low_confidence?: boolean }[];
}

export interface Derived {
  /** Uncapped 10–80 % with the default curve; null when inputs are missing. */
  minutes_10_80: number | null;
  km_per_10_min: number | null;
  /** True when the time comes from an estimated curve or a gross-capacity fallback. */
  estimated: boolean;
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
  range_km: number | null;
  dc_max_kw: number | null;
  usable_kwh: number | null;
  charge_port: string | null;
  voltage_class: string | null;
  heat_pump: string[];          // distinct trim heat-pump values
  chemistry: string | null;
  curve_kind: CurveOut['kind'] | null;
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
