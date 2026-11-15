import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildCars, hasConflict, oneWheelPerSize, rank, resolve } from '../scripts/lib/build.ts';
import { chooseTemplate, estimateCurve } from '../src/lib/estimated-curve.ts';
import type { SourcedValue } from '../src/lib/types.ts';

const REPO = join(import.meta.dirname, '..');
const sv = (value: number | string, kind: SourcedValue['kind'], source_id: string, extra: Partial<SourcedValue> = {}): SourcedValue => ({ value, kind, source_id, ...extra });

describe('precedence (vehicle-data-model.md §7, decision B4)', () => {
  it('range: NRCan → EPA → manufacturer → tested; WLTP never the default', () => {
    const r = resolve('range_km', [
      { v: sv(500, 'rated_wltp', 'src-w'), via: 'other' },
      { v: sv(430, 'tested', 'src-t'), via: 'other' },
      { v: sv(488, 'rated_epa', 'src-e'), via: 'regulatory' },
      { v: sv(463, 'rated_nrcan', 'src-n'), via: 'regulatory' },
    ]);
    expect(r?.value.kind).toBe('rated_nrcan');
    expect(r?.others.map((o) => o.kind)).toEqual(['rated_epa', 'tested', 'rated_wltp']);
    expect(resolve('range_km', [{ v: sv(500, 'rated_wltp', 'src-w'), via: 'other' }, { v: sv(430, 'tested', 'src-t'), via: 'other' }])?.value.kind).toBe('tested');
  });

  it('battery/DC: manufacturer page → tested → manufacturer via OpenEV → Chargeprice', () => {
    const c = [
      { v: sv(74, 'manufacturer', 'src-chargeprice-x'), via: 'chargeprice' as const },
      { v: sv(72.6, 'manufacturer', 'src-openev-x'), via: 'openev' as const },
      { v: sv(73, 'tested', 'src-test'), via: 'other' as const },
      { v: sv(80, 'manufacturer', 'src-oem'), via: 'oem' as const },
    ];
    expect(resolve('capacity_usable_kwh', c)?.value.source_id).toBe('src-oem');
    expect(resolve('capacity_usable_kwh', c.slice(0, 3))?.value.source_id).toBe('src-test');
    expect(resolve('capacity_usable_kwh', c.slice(0, 2))?.value.source_id).toBe('src-openev-x');
  });

  it('facts: manufacturer page → OpenEV → other', () => {
    const r = resolve('charge_port', [
      { v: sv('ccs1', 'manufacturer', 'src-openev-x'), via: 'openev' },
      { v: sv('nacs', 'manufacturer', 'src-oem'), via: 'oem' },
    ]);
    expect(r?.value.value).toBe('nacs');
  });

  it('a confident value beats a low-confidence one in the same tier', () => {
    expect(rank('spec', sv(1, 'manufacturer', 'a', { low_confidence: true }), 'oem')).toBeGreaterThan(rank('spec', sv(1, 'manufacturer', 'b'), 'oem'));
  });

  it('nothing to resolve → null (shown as Unknown)', () => {
    expect(resolve('range_km', [])).toBeNull();
  });
});

describe('conflict flag (>5 %, same kind)', () => {
  it('flags same-kind values more than 5 % apart', () => {
    expect(hasConflict([sv(100, 'manufacturer', 'a'), sv(106, 'manufacturer', 'b')])).toBe(true);
    expect(hasConflict([sv(100, 'manufacturer', 'a'), sv(104, 'manufacturer', 'b')])).toBe(false);
  });
  it('does not compare different kinds (rated vs tested is expected to differ)', () => {
    expect(hasConflict([sv(488, 'rated_epa', 'a'), sv(400, 'tested', 'b')])).toBe(false);
  });
  it('flags differing facts of the same kind', () => {
    expect(hasConflict([sv('nacs', 'manufacturer', 'a'), sv('ccs1', 'manufacturer', 'b')])).toBe(true);
  });
});

describe('estimated curves (charging-curve-viewer.md §9)', () => {
  it('picks LFP by chemistry, else NMC by voltage class, and says what it assumed', () => {
    expect(chooseTemplate('lfp', '800v').id).toBe('lfp');
    expect(chooseTemplate('nmc', '800v').id).toBe('800v-nmc');
    expect(chooseTemplate(null, null)).toEqual({ id: '400v-nmc', caveats: ['chemistry unknown, NMC template used', 'voltage class unknown, 400V template used'] });
  });
  it('scales the template by the peak and records its basis', () => {
    const c = estimateCurve({ dcMaxKw: 200, chemistry: 'nmc', voltageClass: '800v', sourceId: 'src-x' });
    expect(c.kind).toBe('estimated');
    expect(c.points.find((p) => p.soc_percent === 10)?.power_kw).toBe(200);
    expect(c.points.find((p) => p.soc_percent === 80)?.power_kw).toBe(90);
    expect(c.basis).toMatch(/800V NMC.*200 kW/);
  });
});

describe('buildCars on the fixture', () => {
  let dirs: string[] = [];
  afterEach(() => { dirs.forEach((d) => rmSync(d, { recursive: true, force: true })); dirs = []; });
  const repo = () => {
    const d = mkdtempSync(join(tmpdir(), 'voltway-build-'));
    dirs.push(d);
    cpSync(join(import.meta.dirname, 'fixtures', 'valid-repo'), d, { recursive: true });
    return d;
  };
  const setCrosswalk = (d: string, rows: string[]) =>
    writeFileSync(join(d, 'crosswalk/crosswalk.csv'), ['our_variant_id,source,source_key,match_method,confirmed,our_trim_id,notes', ...rows].join('\n') + '\n');
  const V = 'testmake/sparkle/2025/long-range-awd';

  it('gives every figure a default, others and a source; missing ones are null', () => {
    const [car] = buildCars(repo()).cars;
    expect(car.fields.range_km?.value).toMatchObject({ kind: 'rated_nrcan', value: 450 });
    expect(car.fields.range_km?.others[0]).toMatchObject({ kind: 'manufacturer', value: 455 });
    expect(car.fields.preconditioning).toBeNull();
    expect(car.sources.map((s) => s.id)).toContain('src-test-regulator');
  });

  it('keeps the stored tested curve as default over the generated estimate', () => {
    const [car] = buildCars(repo()).cars;
    expect(car.curves.map((c) => [c.kind, c.is_display_default])).toEqual([['tested', true], ['estimated', false]]);
  });

  it('prefers a curve borrowed from a same-pack sibling over the template, and explains it (B16)', () => {
    const d = repo();
    const file = join(d, 'data/curves', V, 'test-2025.json');
    const c = JSON.parse(readFileSync(file, 'utf8'));
    rmSync(file);
    writeFileSync(join(d, 'data/curves', V, 'borrowed.json'), JSON.stringify({
      ...c, id: 'borrowed', kind: 'estimated', low_confidence: true, is_display_default: false,
      based_on: { variant_id: 'testmake/sparkle/2025/twin', reason: 'Same 80 kWh 800 V pack.' },
    }));
    const [car] = buildCars(d).cars;
    const def = car.curves.find((x) => x.is_display_default);
    expect(def).toMatchObject({ id: 'borrowed', kind: 'estimated', basis: 'Same 80 kWh 800 V pack.' });
    expect(car.curves.filter((x) => x.kind === 'estimated')).toHaveLength(2);
  });

  it('makes the estimate the default only when nothing measured exists', () => {
    const d = repo();
    rmSync(join(d, 'data/curves'), { recursive: true });
    const [car] = buildCars(d).cars;
    expect(car.curves).toHaveLength(1);
    expect(car.curves[0]).toMatchObject({ kind: 'estimated', is_display_default: true });
    expect(car.derived.estimated).toBe(true);
  });

  it('derives sold_in_canada from a confirmed NRCan row', () => {
    const d = repo();
    expect(buildCars(d).cars[0].sold_in_canada).toBe(true);
    setCrosswalk(d, [`${V},nrcan,"2025 · Testmake · Sparkle AWD, LR",automatic,false,,`]);
    expect(buildCars(d).cars[0].sold_in_canada).toBe(false);
  });

  it('ignores unconfirmed crosswalk rows', () => {
    const d = repo();
    setCrosswalk(d, [`${V},chargeprice,00000000-0000-4000-8000-000000000001,manual,false,,`]);
    expect(buildCars(d).cars[0].curves.some((c) => c.source_id === 'src-test-oem-spec' && c.id.startsWith('chargeprice'))).toBe(false);
    setCrosswalk(d, [`${V},chargeprice,00000000-0000-4000-8000-000000000001,manual,true,,`]);
    expect(buildCars(d).cars[0].curves.some((c) => c.id.startsWith('chargeprice'))).toBe(true);
  });

  it('uses OpenEV "standard or optional" heat pump only when the trim has none of its own', () => {
    const d = repo();
    setCrosswalk(d, [`${V},openev,testmake:sparkle:2025:awd,manual,true,,`]);
    const [car] = buildCars(d).cars;
    expect(car.trims[0].heat_pump?.value.value).toBe('optional'); // the fixture's own manufacturer value wins
    expect(car.trims[0].heat_pump?.others[0].value).toBe('standard_or_optional');
  });

  it('computes uncapped 10–80 % and km per 10 min with the default curve', () => {
    const [car] = buildCars(repo()).cars;
    expect(car.derived.battery_basis).toBe('usable');
    expect(car.derived.minutes_10_80).toBeGreaterThan(10);
    expect(car.derived.km_per_10_min).toBeGreaterThan(50);
  });
});

describe('the real build', () => {
  it('builds every variant, and every default value carries kind + source', () => {
    const { cars } = buildCars(REPO);
    expect(cars.length).toBeGreaterThan(0);
    for (const car of cars) {
      for (const f of Object.values(car.fields)) {
        if (f) { expect(f.value.kind).toBeTruthy(); expect(f.value.source_id).toMatch(/^src-/); }
      }
      expect(car.curves.filter((c) => c.is_display_default).length).toBeLessThanOrEqual(1);
      if (car.curves.length) expect(car.curves.filter((c) => c.is_display_default)).toHaveLength(1);
    }
  });

  it('never makes an estimated curve the default when a measured one exists', () => {
    for (const car of buildCars(REPO).cars) {
      if (car.curves.some((c) => c.kind !== 'estimated')) expect(car.curves.find((c) => c.is_display_default)?.kind).not.toBe('estimated');
    }
  });

  it('every cited source exists', () => {
    for (const car of buildCars(REPO).cars) {
      const ids = new Set(car.sources.map((s) => s.id));
      const cited = JSON.stringify(car).match(/"source_id":"([^"]+)"/g)?.map((m) => m.slice(13, -1)) ?? [];
      for (const id of cited) expect(ids.has(id)).toBe(true);
    }
  });
});


describe('hand-entered wheels (B14)', () => {
  it('keeps one entry per size when two sources list wheels', () => {
    const out = oneWheelPerSize([
      { diameter_in: 19, is_standard: false, source_id: 'src-a' },
      { diameter_in: 21, is_standard: false, source_id: 'src-a' },
      { diameter_in: 19, is_standard: true, source_id: 'src-b' },
    ]);
    expect(out).toEqual([
      { diameter_in: 19, is_standard: true, source_id: 'src-a' },
      { diameter_in: 21, is_standard: false, source_id: 'src-a' },
    ]);
  });
});
