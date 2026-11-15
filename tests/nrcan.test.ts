import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseCsv } from '../scripts/lib/csv.ts';
import { kwhPer100kmToWhPerKm, normalizeNrcanRows } from '../scripts/lib/nrcan.ts';
import { validateRepo } from '../scripts/lib/validate-data.ts';

const REPO = join(import.meta.dirname, '..');
const HEADER =
  'Model year,Make,Model,Vehicle class,Motor (kW),Transmission,Fuel type,City (kWh/100 km),Highway (kWh/100 km),Combined (kWh/100 km),City (Le/100 km),Highway (Le/100 km),Combined (Le/100 km),Range (km),CO2 emissions (g/km),CO2 rating ,Smog rating,Recharge time (h)';
// A real row from the 2026-09-29 NRCan file, copied verbatim (quoted inch marks, trailing-space-free).
const VOLVO_ROW = '2026,Volvo,"EX30 Cross Country (18"" Wheels)",Sport utility vehicle: Small,315,A1,B,22.1,25.2,23.5,2.5,2.8,2.6,327,0,10,10,8';

const rows = (body: string) => parseCsv(`${HEADER}\r\n${body}\r\n`);

describe('kWh/100 km → Wh/km', () => {
  it('multiplies by 10 without floating-point noise', () => {
    expect(kwhPer100kmToWhPerKm(22.1)).toBe(221);
    expect(kwhPer100kmToWhPerKm(16.7)).toBe(167);
    expect(kwhPer100kmToWhPerKm(19.35)).toBe(193.5);
  });
});

describe('normalizeNrcanRows', () => {
  it('converts a known row into rated_nrcan sourced values', () => {
    const [r] = normalizeNrcanRows(rows(VOLVO_ROW), 'src-nrcan-test');
    expect(r.source_key).toBe('2026 · Volvo · EX30 Cross Country (18" Wheels)');
    expect(r.model).toBe('EX30 Cross Country (18" Wheels)');
    expect(r.vehicle_class).toBe('Sport utility vehicle: Small');
    const one = (unit: string, value: number) => [{ value, unit, kind: 'rated_nrcan', source_id: 'src-nrcan-test' }];
    expect(r.consumption_city_wh_per_km).toEqual(one('Wh/km', 221));
    expect(r.consumption_highway_wh_per_km).toEqual(one('Wh/km', 252));
    expect(r.consumption_combined_wh_per_km).toEqual(one('Wh/km', 235));
    expect(r.range_km).toEqual(one('km', 327));
    expect(r.recharge_time_240v_h).toEqual(one('h', 8));
    expect(r.motor_kw).toEqual(one('kW', 315));
  });

  it('trims stray spaces in make names (NRCan has "Tesla " and "Ford ")', () => {
    const [r] = normalizeNrcanRows(rows('2024,Tesla ,Model 3,Mid-size,208,A1,B,13.9,15.7,14.7,1.6,1.8,1.7,438,0,10,10,7'), 'src-x');
    expect(r.make).toBe('Tesla');
    expect(r.source_key).toBe('2024 · Tesla · Model 3');
  });

  it('fails loudly on a non-numeric figure', () => {
    expect(() => normalizeNrcanRows(rows(VOLVO_ROW.replace(',327,', ',n/a,')), 'src-x')).toThrow(/Range \(km\)/);
  });

  it('fails loudly when a column is missing (format change)', () => {
    const csv = parseCsv(`${HEADER.replace('Range (km)', 'Range')}\r\n${VOLVO_ROW}\r\n`);
    expect(() => normalizeNrcanRows(csv, 'src-x')).toThrow(/missing columns: Range \(km\)/);
  });

  it('rejects duplicate rows', () => {
    expect(() => normalizeNrcanRows(rows(`${VOLVO_ROW}\r\n${VOLVO_ROW}`), 'src-x')).toThrow(/Duplicate/);
  });
});

describe('the committed NRCan import', () => {
  const meta = JSON.parse(readFileSync(join(REPO, 'sources/nrcan/FETCHED.json'), 'utf8'));

  it('matches the raw CSV row for row', () => {
    const raw = parseCsv(readFileSync(join(REPO, 'sources/nrcan', meta.file), 'utf8'));
    const imported = normalizeNrcanRows(raw, meta.suggested_source_id);
    const year2026 = JSON.parse(readFileSync(join(REPO, 'data/imported/nrcan/2026.json'), 'utf8'));
    const fromRaw = imported.filter((r) => r.year === 2026).sort((a, b) => a.source_key.localeCompare(b.source_key));
    expect(year2026.records).toEqual(fromRaw);
  });

  it('cites a source record that exists', () => {
    expect(() => readFileSync(join(REPO, 'data/sources', `${meta.suggested_source_id}.json`))).not.toThrow();
  });
});

describe('validator on imported NRCan files', () => {
  let dir = '';
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const repoWith = (change: (json: any) => void) => {
    dir = mkdtempSync(join(tmpdir(), 'voltway-nrcan-'));
    cpSync(join(import.meta.dirname, 'fixtures', 'valid-repo'), dir, { recursive: true });
    cpSync(join(REPO, 'schema'), join(dir, 'schema'), { recursive: true });
    const file = join(dir, 'data/imported/nrcan/2025.json');
    const json = JSON.parse(readFileSync(file, 'utf8'));
    change(json);
    writeFileSync(file, JSON.stringify(json));
    return validateRepo(dir).errors;
  };

  it('rejects a bare number in an imported record', () => {
    expect(repoWith((f) => { f.records[0].range_km = 450; }).some((e) => e.includes('/records/0/range_km'))).toBe(true);
  });

  it('rejects a crosswalk row whose NRCan key is not imported', () => {
    expect(repoWith((f) => { f.records[0].source_key = '2025 · Testmake · Something else'; })).toContainEqual(
      expect.stringContaining('is not in data/imported/nrcan'),
    );
  });
});
