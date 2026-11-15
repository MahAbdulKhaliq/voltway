// Turns NRCan BEV ratings CSV rows into normalized, sourced records.
// Every figure becomes a `rated_nrcan` sourced value (vehicle-data-model.md §3).

export const NRCAN_COLUMNS = {
  year: 'Model year',
  make: 'Make',
  model: 'Model',
  vehicleClass: 'Vehicle class',
  motorKw: 'Motor (kW)',
  city: 'City (kWh/100 km)',
  highway: 'Highway (kWh/100 km)',
  combined: 'Combined (kWh/100 km)',
  range: 'Range (km)',
  recharge: 'Recharge time (h)',
} as const;

export interface SourcedNumber {
  value: number;
  unit: string;
  kind: 'rated_nrcan';
  source_id: string;
}

export interface NrcanRecord {
  source_key: string;
  year: number;
  make: string;
  model: string;
  vehicle_class: string;
  motor_kw: SourcedNumber[];
  consumption_city_wh_per_km: SourcedNumber[];
  consumption_highway_wh_per_km: SourcedNumber[];
  consumption_combined_wh_per_km: SourcedNumber[];
  range_km: SourcedNumber[];
  recharge_time_240v_h: SourcedNumber[];
}

/** NRCan's own key for a row: year · make · model, exactly as published (trimmed). */
export function nrcanKey(year: number, make: string, model: string): string {
  return `${year} · ${make} · ${model}`;
}

/** kWh/100 km → Wh/km (× 10), rounded to 0.1 to drop floating-point noise. */
export function kwhPer100kmToWhPerKm(kwhPer100km: number): number {
  return Math.round(kwhPer100km * 100) / 10;
}

function num(row: Record<string, string>, column: string, key: string): number {
  const raw = (row[column] ?? '').trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) throw new Error(`${key}: column "${column}" is not a number ("${raw}")`);
  return Number(raw);
}

export function checkColumns(header: string[]): void {
  const have = new Set(header.map((h) => h.trim()));
  const missing = Object.values(NRCAN_COLUMNS).filter((c) => !have.has(c));
  if (missing.length) throw new Error(`NRCan CSV is missing columns: ${missing.join(', ')}. The format may have changed.`);
}

export function normalizeNrcanRows(rows: Record<string, string>[], sourceId: string): NrcanRecord[] {
  const trimmedRows = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), v])));
  if (trimmedRows.length) checkColumns(Object.keys(trimmedRows[0]));

  const value = (v: number, unit: string): SourcedNumber[] => [{ value: v, unit, kind: 'rated_nrcan', source_id: sourceId }];
  const seen = new Set<string>();

  return trimmedRows.map((row) => {
    const year = Number(row[NRCAN_COLUMNS.year].trim());
    const make = row[NRCAN_COLUMNS.make].trim();
    const model = row[NRCAN_COLUMNS.model].trim();
    const key = nrcanKey(year, make, model);
    if (!Number.isInteger(year)) throw new Error(`Row with model "${model}" has a bad model year`);
    if (seen.has(key)) throw new Error(`Duplicate NRCan row: ${key}`);
    seen.add(key);

    return {
      source_key: key,
      year,
      make,
      model,
      vehicle_class: row[NRCAN_COLUMNS.vehicleClass].trim(),
      motor_kw: value(num(row, NRCAN_COLUMNS.motorKw, key), 'kW'),
      consumption_city_wh_per_km: value(kwhPer100kmToWhPerKm(num(row, NRCAN_COLUMNS.city, key)), 'Wh/km'),
      consumption_highway_wh_per_km: value(kwhPer100kmToWhPerKm(num(row, NRCAN_COLUMNS.highway, key)), 'Wh/km'),
      consumption_combined_wh_per_km: value(kwhPer100kmToWhPerKm(num(row, NRCAN_COLUMNS.combined, key)), 'Wh/km'),
      range_km: value(num(row, NRCAN_COLUMNS.range, key), 'km'),
      recharge_time_240v_h: value(num(row, NRCAN_COLUMNS.recharge, key), 'h'),
    };
  });
}
