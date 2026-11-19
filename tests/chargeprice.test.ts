import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { isGenericShape, makeSlug, normalizeChargeprice, type ChargepriceVehicle } from '../scripts/lib/chargeprice.ts';
import { validateRepo } from '../scripts/lib/validate-data.ts';

const REPO = join(import.meta.dirname, '..');
const SRC = 'src-chargeprice-test';
const pts = (pairs: [number, number][]) => pairs.map(([percentage, power]) => ({ percentage, power }));

// The 2021 IONIQ 5 Long Range 2WD curve, verbatim from the archive.
const IONIQ5 = pts([[0, 210], [46, 233], [47, 175], [48, 175], [60, 175], [70, 150], [72, 110], [84, 110], [100, 10]]);

function vehicle(overrides: Partial<ChargepriceVehicle> = {}): ChargepriceVehicle {
  return {
    id: 'b58bc94d-d929-ad71-d95b-08b877bf76ba',
    brand: 'Hyundai',
    model: 'IONIQ 5',
    variant: 'Long Range 2WD',
    release_year: 2021,
    vehicle_type: 'car',
    usable_battery_size: 74,
    ac_charger: { max_power: 11, ports: ['type2'] },
    dc_charger: { max_power: 233, ports: ['ccs'], charging_curve: IONIQ5, is_default_charging_curve: false },
    charging_voltage: 800,
    ...overrides,
  };
}

describe('isGenericShape', () => {
  it('keeps a real measured curve', () => {
    expect(isGenericShape(IONIQ5)).toBe(false);
  });

  it('catches the archive’s most common template (not flagged as default)', () => {
    // 175 "measured" curves have exactly this shape: 100% → 50% SoC, 60% at 80%, 30% at 100%.
    expect(isGenericShape(pts([[0, 150], [50, 150], [80, 90], [100, 45]]))).toBe(true);
  });

  it('catches a template whose 100% point is odd', () => {
    // 2022 Leaf in the archive: 0%=39 50%=39 80%=23.4 100%=3.6
    expect(isGenericShape(pts([[0, 39], [50, 39], [80, 23.4], [100, 3.6]]))).toBe(true);
  });

  it('compares with the curve’s own peak, not the stated max power', () => {
    expect(isGenericShape(pts([[0, 112], [50, 112], [80, 67.2], [100, 33.6]]))).toBe(true);
  });

  it('treats two-point lines as generic', () => {
    expect(isGenericShape(pts([[0, 170], [100, 25]]))).toBe(true);
  });
});

describe('normalizeChargeprice', () => {
  it('imports a measured curve as community (B95), with the Fastned chain noted', () => {
    const r = normalizeChargeprice(vehicle(), SRC);
    expect(r.curve?.kind).toBe('community');
    expect(r.curve?.source_id).toBe(SRC);
    expect(r.curve?.points[1]).toEqual({ soc_percent: 46, power_kw: 233 });
    expect(r.curve?.notes).toMatch(/Fastned/);
    expect(r.curve_skipped).toBeUndefined();
  });

  it('skips curves the archive flags as default', () => {
    const r = normalizeChargeprice(vehicle({ dc_charger: { max_power: 233, charging_curve: IONIQ5, is_default_charging_curve: true } }), SRC);
    expect(r.curve).toBeUndefined();
    expect(r.curve_skipped).toBe('flagged_default');
  });

  it('skips unflagged generic shapes', () => {
    const r = normalizeChargeprice(
      vehicle({ dc_charger: { max_power: 150, charging_curve: pts([[0, 150], [50, 150], [80, 90], [100, 45]]), is_default_charging_curve: false } }),
      SRC,
    );
    expect(r.curve_skipped).toBe('generic_shape');
  });

  it('marks uncited specs low_confidence and maps voltage class', () => {
    const r = normalizeChargeprice(vehicle(), SRC);
    expect(r.capacity_usable_kwh?.[0]).toMatchObject({ value: 74, unit: 'kWh', kind: 'manufacturer', low_confidence: true });
    expect(r.dc_max_kw?.[0].value).toBe(233);
    expect(r.nominal_voltage_class?.[0].value).toBe('800v');
  });

  it('makes file-safe make slugs', () => {
    expect(makeSlug('Mercedes-Benz')).toBe('mercedes-benz');
    expect(makeSlug(' Škoda ')).toBe('skoda');
    expect(makeSlug('DS Automobiles')).toBe('ds-automobiles');
  });
});

describe('the committed Chargeprice import', () => {
  const meta = JSON.parse(readFileSync(join(REPO, 'sources/chargeprice/FETCHED.json'), 'utf8'));
  const committed = readdirSync(join(REPO, 'data/imported/chargeprice'))
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(join(REPO, 'data/imported/chargeprice', f), 'utf8')).records);

  it('matches the pinned archive record for record', () => {
    const archive = JSON.parse(readFileSync(join(REPO, 'sources/chargeprice', meta.file), 'utf8'));
    const expected = archive.data
      .filter((v: ChargepriceVehicle) => v.vehicle_type === 'car')
      .map((v: ChargepriceVehicle) => normalizeChargeprice(v, meta.suggested_source_id));
    const byKey = (a: { source_key: string }, b: { source_key: string }) => a.source_key.localeCompare(b.source_key);
    expect([...committed].sort(byKey)).toEqual([...expected].sort(byKey));
  });

  it('contains no curve that looks generic', () => {
    const generic = committed.filter((r) => r.curve && isGenericShape(r.curve.points.map((p: { soc_percent: number; power_kw: number }) => ({ percentage: p.soc_percent, power: p.power_kw }))));
    expect(generic).toEqual([]);
  });
});

describe('validator on imported Chargeprice files', () => {
  let dir = '';
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const repoWith = (change: (json: any) => void) => {
    dir = mkdtempSync(join(tmpdir(), 'voltway-cp-'));
    cpSync(join(import.meta.dirname, 'fixtures', 'valid-repo'), dir, { recursive: true });
    cpSync(join(REPO, 'schema'), join(dir, 'schema'), { recursive: true });
    const file = join(dir, 'data/imported/chargeprice/testmake.json');
    const json = JSON.parse(readFileSync(file, 'utf8'));
    change(json);
    writeFileSync(file, JSON.stringify(json));
    return validateRepo(dir).errors;
  };

  it('rejects an imported curve that is not "community" (B95)', () => {
    expect(repoWith((f) => { f.records[0].curve.kind = 'estimated'; }).some((e) => e.includes('/curve/kind'))).toBe(true);
  });

  it('rejects unsorted imported curve points', () => {
    expect(repoWith((f) => { f.records[0].curve.points.reverse(); })).toContainEqual(expect.stringContaining('must be sorted'));
  });

  it('rejects a record with neither a curve nor a skip reason', () => {
    expect(repoWith((f) => { delete f.records[0].curve; }).length).toBeGreaterThan(0);
  });
});
