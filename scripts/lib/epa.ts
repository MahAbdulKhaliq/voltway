// Turns fueleconomy.gov (US EPA / DOE) vehicle rows into normalized, sourced records (B90, DESIGN-9 §2).
// Only battery-electric rows (atvType "EV") from 2011 on. Every figure becomes a `rated_epa` sourced value.
// EPA publishes miles and kWh/100 mi; we store km and Wh/km (metric inside, CLAUDE.md).

import { inflateRawSync } from 'node:zlib';

export const EPA_COLUMNS = {
  id: 'id',
  year: 'year',
  make: 'make',
  model: 'model',
  baseModel: 'baseModel',
  atvType: 'atvType',
  drive: 'drive',
  evMotor: 'evMotor',
  vehicleClass: 'VClass',
  range: 'range',
  city: 'cityE',
  highway: 'highwayE',
  combined: 'combE',
  charge240: 'charge240',
} as const;

export const EPA_FIRST_YEAR = 2011;
export const KM_PER_MILE = 1.609344;

export interface EpaNumber {
  value: number;
  unit: string;
  kind: 'rated_epa';
  source_id: string;
}

export interface EpaRecord {
  source_key: string;
  epa_id: string;
  year: number;
  make: string;
  model: string;
  base_model: string;
  drive: string;
  vehicle_class: string;
  motor: string;
  range_km?: EpaNumber[];
  consumption_city_wh_per_km?: EpaNumber[];
  consumption_highway_wh_per_km?: EpaNumber[];
  consumption_combined_wh_per_km?: EpaNumber[];
  recharge_time_240v_h?: EpaNumber[];
}

/** EPA's key for a row: year · make · model, plus EPA's vehicle id (model strings repeat across rows). */
export function epaKey(year: number, make: string, model: string, id: string): string {
  return `${year} · ${make} · ${model} · #${id}`;
}

/** miles → km, rounded to 0.1. */
export const milesToKm = (mi: number) => Math.round(mi * KM_PER_MILE * 10) / 10;
/** kWh/100 mi → Wh/km (× 1000 / 100 / 1.609344), rounded to 0.1. */
export const kwhPer100miToWhPerKm = (x: number) => Math.round(((x * 10) / KM_PER_MILE) * 10) / 10;

export function checkEpaColumns(header: string[]): void {
  const have = new Set(header.map((h) => h.trim()));
  const missing = Object.values(EPA_COLUMNS).filter((c) => !have.has(c));
  if (missing.length) throw new Error(`EPA CSV is missing columns: ${missing.join(', ')}. The format may have changed.`);
}

export const isEpaBev = (row: Record<string, string>) =>
  row[EPA_COLUMNS.atvType]?.trim() === 'EV' && Number(row[EPA_COLUMNS.year]) >= EPA_FIRST_YEAR;

export function normalizeEpaRows(rows: Record<string, string>[], sourceId: string): EpaRecord[] {
  const out: EpaRecord[] = [];
  for (const row of rows) {
    if (!isEpaBev(row)) continue;
    const s = (c: string) => (row[c] ?? '').trim();
    const year = Number(s(EPA_COLUMNS.year));
    const id = s(EPA_COLUMNS.id);
    const pos = (c: string) => { const n = Number(s(c)); return s(c) !== '' && Number.isFinite(n) && n > 0 ? n : null; };
    const val = (value: number | null, unit: string): EpaNumber[] | undefined =>
      value === null ? undefined : [{ value, unit, kind: 'rated_epa', source_id: sourceId }];
    const mi = pos(EPA_COLUMNS.range), city = pos(EPA_COLUMNS.city), hwy = pos(EPA_COLUMNS.highway), comb = pos(EPA_COLUMNS.combined), ch = pos(EPA_COLUMNS.charge240);
    const rec: EpaRecord = {
      source_key: epaKey(year, s(EPA_COLUMNS.make), s(EPA_COLUMNS.model), id),
      epa_id: id,
      year,
      make: s(EPA_COLUMNS.make),
      model: s(EPA_COLUMNS.model),
      base_model: s(EPA_COLUMNS.baseModel),
      drive: s(EPA_COLUMNS.drive),
      vehicle_class: s(EPA_COLUMNS.vehicleClass),
      motor: s(EPA_COLUMNS.evMotor),
      range_km: val(mi === null ? null : milesToKm(mi), 'km'),
      consumption_city_wh_per_km: val(city === null ? null : kwhPer100miToWhPerKm(city), 'Wh/km'),
      consumption_highway_wh_per_km: val(hwy === null ? null : kwhPer100miToWhPerKm(hwy), 'Wh/km'),
      consumption_combined_wh_per_km: val(comb === null ? null : kwhPer100miToWhPerKm(comb), 'Wh/km'),
      recharge_time_240v_h: val(ch, 'h'),
    };
    out.push(Object.fromEntries(Object.entries(rec).filter(([, x]) => x !== undefined)) as EpaRecord);
  }
  return out.sort((a, b) => a.year - b.year || a.source_key.localeCompare(b.source_key));
}

/** Reads the one file in a single-entry zip (fueleconomy.gov's vehicles.csv.zip) without a zip library. */
export function unzipSingle(zip: Buffer): { name: string; data: Buffer } {
  // Central directory gives reliable sizes even when the local header uses a data descriptor.
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('Not a zip file');
  const cd = zip.readUInt32LE(eocd + 16);
  if (zip.readUInt32LE(cd) !== 0x02014b50) throw new Error('Zip central directory not found');
  const method = zip.readUInt16LE(cd + 10);
  const compSize = zip.readUInt32LE(cd + 20);
  const nameLen = zip.readUInt16LE(cd + 28);
  const localOff = zip.readUInt32LE(cd + 42);
  const name = zip.subarray(cd + 46, cd + 46 + nameLen).toString('utf8');
  const lNameLen = zip.readUInt16LE(localOff + 26), lExtra = zip.readUInt16LE(localOff + 28);
  const start = localOff + 30 + lNameLen + lExtra;
  const raw = zip.subarray(start, start + compSize);
  if (method === 0) return { name, data: Buffer.from(raw) };
  if (method === 8) return { name, data: inflateRawSync(raw) };
  throw new Error(`Unsupported zip compression method ${method}`);
}
