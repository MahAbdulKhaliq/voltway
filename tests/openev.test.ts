import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { isNorthAmerican, normalizeOpenEv, type OpenEvVehicle } from '../scripts/lib/openev.ts';
import { validateRepo } from '../scripts/lib/validate-data.ts';

const REPO = join(import.meta.dirname, '..');
const SRC = 'src-openev-test';

/** Shaped like a real OpenEV v1.24.0 record (2024 IONIQ 5 base), trimmed to the fields we read. */
function vehicle(overrides: Partial<OpenEvVehicle> = {}): OpenEvVehicle {
  return {
    unique_code: 'hyundai:ioniq_5:2024:ioniq_5',
    make: { slug: 'hyundai', name: 'Hyundai' },
    model: { slug: 'ioniq_5', name: 'IONIQ 5' },
    year: 2024,
    trim: { slug: 'base', name: 'Base' },
    markets: ['US', 'DE'],
    powertrain: { drivetrain: 'rwd', system_power_kw: 168 },
    battery: { chemistry: 'li-ion', pack_capacity_kwh_gross: 77.4, pack_capacity_kwh_net: 72.6 },
    charge_ports: [{ kind: 'combo', connector: 'ccs2' }],
    charging: { ac: { max_power_kw: 11 }, dc: { max_power_kw: 220, architecture_voltage_class: '800v' } },
    range: { rated: [{ cycle: 'wltp', range_km: 507 }, { cycle: 'epa', range_km: 488 }, { cycle: 'cltc', range_km: 560 }] },
    sources: [{ type: 'oem', title: 'Hyundai IONIQ 5 Official Specifications 2024', url: 'https://www.hyundai.com' }],
    ...overrides,
  };
}

describe('normalizeOpenEv', () => {
  it('maps battery, power and voltage as manufacturer values citing the release', () => {
    const r = normalizeOpenEv(vehicle({ sources: [{ type: 'oem', url: 'https://example.com/specs/ioniq5' }] }), SRC);
    expect(r.capacity_usable_kwh).toEqual([{ value: 72.6, unit: 'kWh', kind: 'manufacturer', source_id: SRC }]);
    expect(r.capacity_gross_kwh?.[0].value).toBe(77.4);
    expect(r.dc_max_kw?.[0]).toMatchObject({ value: 220, unit: 'kW' });
    expect(r.ac_max_kw?.[0]).toMatchObject({ value: 11, unit: 'kW' });
    expect(r.nominal_voltage_class).toEqual([{ value: '800v', kind: 'manufacturer', source_id: SRC }]);
    expect(r.drivetrain).toBe('rwd');
  });

  it('flags every value low_confidence when upstream sources are only homepages', () => {
    const r = normalizeOpenEv(vehicle(), SRC);
    expect(r.dc_max_kw?.[0].low_confidence).toBe(true);
    expect(r.capacity_usable_kwh?.[0].low_confidence).toBe(true);
  });

  it('treats generic "li-ion" chemistry as unknown, and keeps real chemistries', () => {
    expect(normalizeOpenEv(vehicle(), SRC).chemistry).toBe('unknown');
    const lfp = normalizeOpenEv(vehicle({ battery: { chemistry: 'lfp', pack_capacity_kwh_net: 60 } }), SRC);
    expect(lfp.chemistry).toMatchObject([{ value: 'lfp' }]);
  });

  it('ignores European ports instead of guessing a Canadian one', () => {
    expect(normalizeOpenEv(vehicle(), SRC).charge_port).toBe('unknown');
  });

  it('prefers a North American DC port, then falls back to J1772', () => {
    const both = vehicle({ charge_ports: [{ connector: 'type1' }, { connector: 'chademo' }] });
    expect(normalizeOpenEv(both, SRC).charge_port).toMatchObject([{ value: 'chademo' }]);
    const nacs = vehicle({ charge_ports: [{ connector: 'ccs1' }, { connector: 'nacs' }] });
    expect(normalizeOpenEv(nacs, SRC).charge_port).toMatchObject([{ value: 'nacs' }]);
    const acOnly = vehicle({ charge_ports: [{ connector: 'type1' }] });
    expect(normalizeOpenEv(acOnly, SRC).charge_port).toMatchObject([{ value: 'j1772' }]);
  });

  it('never claims a heat pump is standard', () => {
    const r = normalizeOpenEv(vehicle({ battery: { chemistry: 'nmc', pack_capacity_kwh_net: 70, heat_pump: true } }), SRC);
    expect(r.heat_pump).toMatchObject([{ value: 'standard_or_optional' }]);
    expect(normalizeOpenEv(vehicle(), SRC).heat_pump).toBe('unknown'); // missing = unknown, not "none"
  });

  it('keeps EPA and WLTP ranges with their own kinds, and drops other cycles', () => {
    const r = normalizeOpenEv(vehicle(), SRC);
    expect(r.range_km?.map((x) => [x.kind, x.value])).toEqual([
      ['rated_wltp', 507],
      ['rated_epa', 488],
    ]);
  });

  it('records a published 10→80% DC time, and ignores other windows', () => {
    const r = normalizeOpenEv(
      vehicle({
        charging: {
          dc: { max_power_kw: 220 },
          charging_time: { dc: [{ from_soc_percent: 30, to_soc_percent: 80, time_min: 15 }, { from_soc_percent: 10, to_soc_percent: 80, time_min: 18, charger_power_kw: 350 }] },
        },
      }),
      SRC,
    );
    expect(r.published_10_80_min).toMatchObject([{ value: 18, unit: 'min', notes: 'On a 350 kW charger' }]);
  });

  it('marks values community when every upstream source is community', () => {
    const r = normalizeOpenEv(vehicle({ sources: [{ type: 'community', url: 'https://forum.example.com/t/123' }] }), SRC);
    expect(r.dc_max_kw?.[0].kind).toBe('community');
  });

  it('keeps standard and optional wheel sizes', () => {
    const r = normalizeOpenEv(vehicle({ wheels_tires: { standard_wheel_size_in: 20, optional_wheel_sizes_in: [21, 22], tire_sizes: ['a', 'b', 'c'] } }), SRC);
    expect(r.wheels).toEqual([
      { diameter_in: 20, is_standard: true },
      { diameter_in: 21, is_standard: false },
      { diameter_in: 22, is_standard: false },
    ]);
  });

  it('selects North American records by market', () => {
    expect(isNorthAmerican(vehicle({ markets: ['CA'] }))).toBe(true);
    expect(isNorthAmerican(vehicle({ markets: ['DE', 'CN'] }))).toBe(false);
  });
});

describe('the committed OpenEV import', () => {
  const meta = JSON.parse(readFileSync(join(REPO, 'sources/openev/FETCHED.json'), 'utf8'));

  it('matches the pinned release record for record', () => {
    const release = JSON.parse(readFileSync(join(REPO, 'sources/openev', meta.file), 'utf8'));
    const expected = release.vehicles
      .filter(isNorthAmerican)
      .map((v: OpenEvVehicle) => normalizeOpenEv(v, meta.suggested_source_id))
      .sort((a: { source_key: string }, b: { source_key: string }) => a.source_key.localeCompare(b.source_key));
    const committed = readdirSync(join(REPO, 'data/imported/openev'))
      .flatMap((f) => JSON.parse(readFileSync(join(REPO, 'data/imported/openev', f), 'utf8')).records)
      .sort((a: { source_key: string }, b: { source_key: string }) => a.source_key.localeCompare(b.source_key));
    expect(committed).toEqual(expected);
  });
});

describe('validator on imported OpenEV files', () => {
  let dir = '';
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const repo = () => {
    dir = mkdtempSync(join(tmpdir(), 'voltway-openev-'));
    cpSync(join(import.meta.dirname, 'fixtures', 'valid-repo'), dir, { recursive: true });
    cpSync(join(REPO, 'schema'), join(dir, 'schema'), { recursive: true });
    return dir;
  };

  it('rejects "standard" as an imported heat-pump value', () => {
    const d = repo();
    const file = join(d, 'data/imported/openev/testmake.json');
    const json = JSON.parse(readFileSync(file, 'utf8'));
    json.records[0].heat_pump[0].value = 'standard';
    writeFileSync(file, JSON.stringify(json));
    expect(validateRepo(d).errors.some((e) => e.includes('/records/0/heat_pump'))).toBe(true);
  });

  it('rejects a crosswalk row whose OpenEV key is not imported', () => {
    const d = repo();
    writeFileSync(
      join(d, 'crosswalk/crosswalk.csv'),
      'our_variant_id,source,source_key,match_method,confirmed,notes\ntestmake/sparkle/2025/long-range-awd,openev,testmake:sparkle:2025:nope,manual,true,\n',
    );
    expect(validateRepo(d).errors).toContainEqual(expect.stringContaining('is not in data/imported/openev'));
  });
});
