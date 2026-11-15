// Turns OpenEV Data release records into normalized, sourced records.
// Values become "manufacturer via OpenEV Data": kind from the upstream source,
// source_id = the release's source record (vehicle-data-model.md §7, decision B4).

import { isHomepageUrl } from './validate-data.ts';

// --- The parts of an OpenEV record we read (release JSON, schema 1.0.0) ---
export interface OpenEvVehicle {
  unique_code: string;
  make: { slug: string; name: string };
  model: { slug: string; name: string };
  year: number;
  trim: { slug: string; name: string };
  variant?: { slug: string; name: string; kind?: string };
  markets?: string[];
  powertrain?: { drivetrain?: string; system_power_kw?: number };
  battery?: {
    chemistry?: string;
    pack_capacity_kwh_gross?: number;
    pack_capacity_kwh_net?: number;
    heat_pump?: boolean;
  };
  charge_ports?: { kind?: string; connector?: string }[];
  charging?: {
    ac?: { max_power_kw?: number };
    dc?: { max_power_kw?: number; architecture_voltage_class?: string };
    charging_time?: { dc?: { from_soc_percent: number; to_soc_percent: number; time_min: number; charger_power_kw?: number }[] };
  };
  range?: { rated?: { cycle: string; range_km: number; notes?: string }[] };
  weights?: { curb_weight_kg?: number };
  wheels_tires?: { standard_wheel_size_in?: number; tire_sizes?: string[]; optional_wheel_sizes_in?: number[] };
  sources?: { type: string; title?: string; url: string }[];
}

type Kind = 'manufacturer' | 'community' | 'rated_epa' | 'rated_wltp';
interface Num { value: number; unit: string; kind: Kind; source_id: string; notes?: string; low_confidence?: true }
interface Fact { value: string; kind: Kind; source_id: string; notes?: string; low_confidence?: true }

export interface OpenEvRecord {
  source_key: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  variant?: string;
  drivetrain?: 'fwd' | 'rwd' | 'awd';
  markets: string[];
  upstream_sources: { type: string; title?: string; url: string }[];
  motor_kw?: Num[];
  capacity_gross_kwh?: Num[];
  capacity_usable_kwh?: Num[];
  chemistry?: Fact[] | 'unknown';
  nominal_voltage_class?: Fact[] | 'unknown';
  ac_max_kw?: Num[];
  dc_max_kw?: Num[];
  charge_port?: Fact[] | 'unknown';
  heat_pump?: Fact[] | 'unknown';
  range_km?: Num[];
  curb_weight_kg?: Num[];
  published_10_80_min?: Num[];
  wheels?: { diameter_in: number; is_standard: boolean; tire_size?: string }[];
}

/** North American plugs only. European/Chinese plugs (ccs2, type2, gb_t) say nothing about Canadian cars. */
const DC_CONNECTORS: Record<string, string> = { nacs: 'nacs', ccs1: 'ccs1', chademo: 'chademo' };
const AC_CONNECTORS: Record<string, string> = { type1: 'j1772', j1772: 'j1772' };
const CHEMISTRY: Record<string, string> = { nmc: 'nmc', nca: 'nca', lfp: 'lfp', lmfp: 'lmfp' };

export function isNorthAmerican(v: OpenEvVehicle): boolean {
  return (v.markets ?? []).some((m) => m === 'CA' || m === 'US');
}

export function normalizeOpenEv(v: OpenEvVehicle, sourceId: string): OpenEvRecord {
  const upstream = (v.sources ?? []).map((s) => ({ type: s.type, ...(s.title ? { title: s.title } : {}), url: s.url }));
  const weak = upstream.length === 0 || upstream.every((s) => isHomepageUrl(s.url));
  const specKind: Kind = upstream.length > 0 && upstream.every((s) => s.type === 'community') ? 'community' : 'manufacturer';
  const flag = weak ? { low_confidence: true as const } : {};

  const num = (value: number | undefined, unit: string, kind: Kind = specKind, notes?: string): Num[] | undefined =>
    typeof value === 'number' && value > 0
      ? [{ value, unit, kind, source_id: sourceId, ...(notes ? { notes } : {}), ...flag }]
      : undefined;
  const fact = (value: string, notes?: string): Fact[] => [
    { value, kind: specKind, source_id: sourceId, ...(notes ? { notes } : {}), ...flag },
  ];

  // Chemistry: "li-ion" is generic and tells us nothing (vehicle-data-model.md §9).
  const chem = v.battery?.chemistry ? CHEMISTRY[v.battery.chemistry] : undefined;
  // Voltage class.
  const vc = v.charging?.dc?.architecture_voltage_class;
  // Port: prefer a North American DC connector; fall back to J1772 for AC-only cars.
  const connectors = (v.charge_ports ?? []).map((p) => p.connector ?? '');
  const dc = ['nacs', 'ccs1', 'chademo'].find((c) => connectors.includes(c));
  const ac = connectors.map((c) => AC_CONNECTORS[c]).find(Boolean);
  const port = dc ? DC_CONNECTORS[dc] : ac;
  // Heat pump: OpenEV only ever says `true`; it doesn't say standard or optional.
  const heatPump = v.battery?.heat_pump === true
    ? fact('standard_or_optional', 'OpenEV Data reports a heat pump but not whether it is standard or optional.')
    : 'unknown';

  const ranges: Num[] = [];
  for (const r of v.range?.rated ?? []) {
    const kind = r.cycle === 'epa' ? 'rated_epa' : r.cycle === 'wltp' ? 'rated_wltp' : undefined;
    if (kind && r.range_km > 0) ranges.push(...num(r.range_km, 'km', kind, r.notes)!);
  }

  const tenTo80 = v.charging?.charging_time?.dc?.find((t) => t.from_soc_percent === 10 && t.to_soc_percent === 80);
  const wheels: OpenEvRecord['wheels'] = [];
  if (v.wheels_tires?.standard_wheel_size_in) {
    wheels.push({
      diameter_in: v.wheels_tires.standard_wheel_size_in,
      is_standard: true,
      ...(v.wheels_tires.tire_sizes?.length === 1 ? { tire_size: v.wheels_tires.tire_sizes[0] } : {}),
    });
  }
  for (const d of v.wheels_tires?.optional_wheel_sizes_in ?? []) wheels.push({ diameter_in: d, is_standard: false });

  const drivetrain = v.powertrain?.drivetrain;
  const rec: OpenEvRecord = {
    source_key: v.unique_code,
    year: v.year,
    make: v.make.name,
    model: v.model.name,
    trim: v.trim.name,
    ...(v.variant?.name ? { variant: v.variant.name } : {}),
    ...(drivetrain === 'fwd' || drivetrain === 'rwd' || drivetrain === 'awd' ? { drivetrain } : {}),
    markets: [...(v.markets ?? [])].sort(),
    upstream_sources: upstream,
    motor_kw: num(v.powertrain?.system_power_kw, 'kW'),
    capacity_gross_kwh: num(v.battery?.pack_capacity_kwh_gross, 'kWh'),
    capacity_usable_kwh: num(v.battery?.pack_capacity_kwh_net, 'kWh'),
    chemistry: chem ? fact(chem) : 'unknown',
    nominal_voltage_class: vc === '400v' || vc === '800v' ? fact(vc) : 'unknown',
    ac_max_kw: num(v.charging?.ac?.max_power_kw, 'kW'),
    dc_max_kw: num(v.charging?.dc?.max_power_kw, 'kW'),
    charge_port: port ? fact(port) : 'unknown',
    heat_pump: heatPump,
    range_km: ranges.length ? ranges : undefined,
    curb_weight_kg: num(v.weights?.curb_weight_kg, 'kg'),
    published_10_80_min: tenTo80
      ? num(tenTo80.time_min, 'min', specKind, tenTo80.charger_power_kw ? `On a ${tenTo80.charger_power_kw} kW charger` : undefined)
      : undefined,
    ...(wheels.length ? { wheels } : {}),
  };
  // Drop undefined keys so files stay tidy and the schema's additionalProperties check is meaningful.
  return Object.fromEntries(Object.entries(rec).filter(([, x]) => x !== undefined)) as OpenEvRecord;
}
