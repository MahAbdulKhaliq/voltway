import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildCars, fillCurbWeights, hasConflict, oneWheelPerSize, rank, resolve } from '../scripts/lib/build.ts';
import { chooseTemplate, estimateCurve } from '../src/lib/estimated-curve.ts';
import type { CarDetail, Source, SourcedValue } from '../src/lib/types.ts';

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
    expect(c.points.find((p) => p.soc_percent === 80)?.power_kw).toBe(84); // 0.42 × 200 (B41)
    expect(c.basis).not.toMatch(/calibrated/);
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
  const PT = 'testmake/sparkle/2025-long-range-awd';

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
    const file = join(d, 'data/curves', PT, 'test-2025.json');
    const c = JSON.parse(readFileSync(file, 'utf8'));
    rmSync(file);
    writeFileSync(join(d, 'data/curves', PT, 'borrowed.json'), JSON.stringify({
      ...c, id: 'borrowed', kind: 'estimated', low_confidence: true, is_display_default: false,
      based_on: { variant_id: 'testmake/sparkle/2025/twin', reason: 'Same 80 kWh 800 V pack.' },
      reviewed_note: 'Checked against the sibling test.',
    }));
    const [car] = buildCars(d).cars;
    const def = car.curves.find((x) => x.is_display_default);
    expect(def).toMatchObject({ id: 'borrowed', kind: 'estimated', basis: 'Same 80 kWh 800 V pack.' });
    expect(car.curves.filter((x) => x.kind === 'estimated')).toHaveLength(2);
  });

  it('keeps a warned curve off the default until a person clears it (B95)', () => {
    const d = repo();
    const file = join(d, 'data/curves', PT, 'test-2025.json');
    writeFileSync(file, JSON.stringify({ ...JSON.parse(readFileSync(file, 'utf8')), is_display_default: false })); // no hand-set default
    const [before] = buildCars(d).cars;
    const measured = before.curves.find((x) => x.kind !== 'estimated')!;
    expect(measured.issues?.length).toBeGreaterThan(0); // the fixture curve is sparse
    expect(before.curves.find((x) => x.is_display_default)?.kind).toBe('estimated');
    writeFileSync(join(d, 'crosswalk/curve-reviews.json'), JSON.stringify({ [`${before.id}#${measured.id}`]: 'Matches the published chart.' }));
    const [after] = buildCars(d).cars;
    expect(after.curves.find((x) => x.is_display_default)).toMatchObject({ id: measured.id, reviewed_note: 'Matches the published chart.' });
  });

  it('makes the estimate the default only when nothing measured exists', () => {
    const d = repo();
    rmSync(join(d, 'data/curves'), { recursive: true });
    const [car] = buildCars(d).cars;
    expect(car.curves).toHaveLength(1);
    expect(car.curves[0]).toMatchObject({ kind: 'estimated', is_display_default: true });
    expect(car.derived.estimated).toBe(true);
  });

  it('derives sold_in_canada from the variant markets or a confirmed NRCan row (B91)', () => {
    const d = repo();
    expect(buildCars(d).cars[0]).toMatchObject({ sold_in_canada: true, markets: ['CA'] });
    setCrosswalk(d, [`${V},nrcan,"2025 · Testmake · Sparkle AWD, LR",automatic,false,,`]);
    const file = join(d, 'data/variants', `${V}.json`);
    writeFileSync(file, JSON.stringify({ ...JSON.parse(readFileSync(file, 'utf8')), markets: ['US'] }));
    expect(buildCars(d).cars[0]).toMatchObject({ sold_in_canada: false, markets: ['US'] });
  });

  const epaRecord = (key: string, model: string, range: number) => ({
    source_key: key, epa_id: key, year: 2025, make: 'Testmake', model, base_model: 'Sparkle', drive: 'All-Wheel Drive',
    range_km: [{ value: range, unit: 'km', kind: 'rated_epa', source_id: 'src-test-regulator' }],
    consumption_combined_wh_per_km: [{ value: 190, unit: 'Wh/km', kind: 'rated_epa', source_id: 'src-test-regulator' }],
  });
  const writeEpa = (d: string, records: unknown[]) => {
    mkdirSync(join(d, 'data/imported/epa'), { recursive: true });
    writeFileSync(join(d, 'data/imported/epa/2025.json'), JSON.stringify({ source: 'epa', source_id: 'src-test-regulator', year: 2025, records }));
  };
  const dropMarkets = (d: string, ...also: string[]) => {
    const file = join(d, 'data/variants', `${V}.json`);
    const { markets: _m, ...rest } = JSON.parse(readFileSync(file, 'utf8'));
    for (const k of also) delete rest[k];
    writeFileSync(file, JSON.stringify(rest));
  };

  it('ranks EPA after NRCan on a two-market variant and derives both markets from the crosswalk (B90)', () => {
    const d = repo();
    writeEpa(d, [epaRecord('e1', 'Sparkle AWD LR', 440)]);
    setCrosswalk(d, [`${V},nrcan,"2025 · Testmake · Sparkle AWD, LR",automatic,true,,`, `${V},epa,e1,manual,true,,`]);
    dropMarkets(d);
    const [car] = buildCars(d).cars;
    expect(car.markets).toEqual(['CA', 'US']);
    expect(car.fields.range_km?.value).toMatchObject({ kind: 'rated_nrcan', value: 450 });
    expect(car.fields.range_km?.others).toContainEqual(expect.objectContaining({ kind: 'rated_epa', value: 440 }));
  });

  it('rates a US-only variant from EPA rows, one wheel option per EPA wheel row (B90, B91)', () => {
    const d = repo();
    writeEpa(d, [epaRecord('e19', 'Sparkle AWD LR (19 inch wheels)', 440), epaRecord('e20', 'Sparkle AWD LR (20 inch wheels)', 410)]);
    const trim = JSON.parse(readFileSync(join(d, 'data/variants', `${V}.json`), 'utf8')).trims[0].id;
    setCrosswalk(d, [`${V},epa,e19,manual,true,${trim},`, `${V},epa,e20,manual,true,${trim},`]);
    dropMarkets(d, 'range_km', 'consumption_combined_wh_per_km');
    const [car] = buildCars(d).cars;
    expect(car.markets).toEqual(['US']);
    expect(car.sold_in_canada).toBe(false);
    expect(car.fields.range_km?.value).toMatchObject({ kind: 'rated_epa', value: 440 });
    const wheels = car.trims[0].wheels;
    // The trim's own wheel list wins; EPA's per-wheel rating lands on the matching size.
    expect(wheels.find((w) => w.diameter_in === 19)?.rated_range_km).toMatchObject({ kind: 'rated_epa', value: 440 });
  });

  it('inherits pack and charging figures and curves from the powertrain (B95)', () => {
    const [car] = buildCars(repo()).cars;
    expect(car.powertrain_id).toBe(PT);
    expect(car.fields.dc_max_kw?.value.value).toBeGreaterThan(0);
    expect(car.curves.some((c) => c.id === 'test-2025')).toBe(true);
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

  it('never makes an estimated curve the default when a checked or cleared measured one exists (B95)', () => {
    for (const car of buildCars(REPO).cars) {
      const ok = car.curves.some((c) => c.kind !== 'estimated' && (!c.issues?.length || c.reviewed_note));
      if (ok) expect(car.curves.find((c) => c.is_display_default)?.kind).not.toBe('estimated');
    }
  });

  it('attaches Chargeprice records only within the same generation, as community curves (B95)', () => {
    for (const car of buildCars(REPO).cars) {
      for (const c of car.curves.filter((x) => x.id.startsWith('chargeprice-'))) expect(c.kind).toBe('community');
    }
    const m3 = buildCars(REPO).cars.filter((c) => c.id.startsWith('tesla/model-3/2026/'));
    // 2021 is the pre-Highland generation; a 2023 European record may be Highland (its NA year is 2024),
    // so it attaches, but its flat 250 kW plateau keeps it off the default until reviewed.
    for (const car of m3) {
      expect(car.curves.map((c) => c.id)).not.toContain('chargeprice-2021');
      const cp = car.curves.find((c) => c.id === 'chargeprice-2023');
      if (cp) expect(cp).toMatchObject({ is_display_default: false, issues: expect.arrayContaining([expect.objectContaining({ code: 'flat_peak' })]) });
    }
  });

  it('passes the output check (every figure anywhere in a car file is sourced)', async () => {
    const { outputProblems } = await import('../scripts/lib/output-check.ts');
    const cars = buildCars(REPO).cars;
    expect(cars.flatMap(outputProblems)).toEqual([]);
    const broken = structuredClone(cars[0]);
    const tr = broken.trims[0] as unknown as Record<string, unknown>;
    tr.range_km = { value: { value: 1, unit: 'km', kind: 'tested', source_id: 'src-nowhere' }, others: [], conflict: false };
    expect(outputProblems(broken).length).toBeGreaterThan(0);
    // No kind and no source (QA re-check), and a wheel with no source.
    const bare = structuredClone(cars[0]);
    (bare.trims[0] as unknown as Record<string, unknown>).range_km = { value: { value: 999, unit: 'km' }, others: [], conflict: false };
    expect(outputProblems(bare).some((p) => p.includes('no kind'))).toBe(true);
    const wheel = structuredClone(cars[0]);
    wheel.trims[0].wheels = [{ diameter_in: 19, is_standard: true }];
    expect(outputProblems(wheel).some((p) => p.includes('wheel'))).toBe(true);
  });

  it('marks 10–80 % as estimated when the window reaches past the measured points (B24)', () => {
    for (const car of buildCars(REPO).cars) {
      const c = car.curves.find((x) => x.is_display_default);
      if (!c || car.derived.minutes_10_80 === null) continue;
      const outside = c.points[0].soc_percent > 10 || c.points.at(-1)!.soc_percent < 80;
      expect(car.derived.extrapolated).toBe(outside);
      if (outside) expect(car.derived.estimated).toBe(true);
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

describe('curb weight defaults (B47)', () => {
  const src = (id: string): Source => ({ id, type: 'dataset', title: id, url: `https://example.com/${id}`, accessed_on: '2026-11-16' });
  const sources = new Map(['src-a', 'src-b'].map((id) => [id, src(id)]));
  let n = 0;
  const car = (body: string, kg?: number, source_id = 'src-a'): CarDetail => ({
    id: `m/x/2026/${n++}`,
    make: { id: 'm', name: 'M' },
    model: { id: 'm/x', name: 'X', body_type: body },
    year: 2026,
    name: 'X',
    sold_in_canada: true,
    fields: { curb_weight_kg: kg === undefined ? null : { value: { value: kg, unit: 'kg', kind: 'manufacturer', source_id }, others: [], conflict: false } },
    trims: [],
    curves: [],
    derived: { minutes_10_80: null, km_per_10_min: null, estimated: true, extrapolated: false, battery_basis: null },
    sources: kg === undefined ? [] : [src(source_id)],
  } as unknown as CarDetail);

  it('fills a missing weight with the median of its body type, as estimated with its basis', () => {
    const cars = [car('suv', 2000), car('suv', 2400, 'src-b'), car('suv', 2100), car('suv', 2300), car('suv')];
    fillCurbWeights(cars, sources);
    const w = cars[4].fields.curb_weight_kg!.value;
    expect(w).toMatchObject({ value: 2200, unit: 'kg', kind: 'estimated', source_id: 'src-a' });
    expect(w.notes).toContain('median of 4 sourced SUVs');
    expect(cars[4].sources.map((s) => s.id)).toEqual(['src-a']); // the cited source is listed
  });

  it('falls back to the overall median when the body type has fewer than 3 sourced weights', () => {
    const cars = [car('sedan', 1800), car('sedan', 1900), car('sedan', 2000), car('truck', 3000), car('truck', 3200), car('truck')];
    fillCurbWeights(cars, sources);
    const w = cars[5].fields.curb_weight_kg!.value;
    expect(w).toMatchObject({ value: 2000, kind: 'estimated' });
    expect(w.notes).toContain('median of 5 sourced cars of every body type');
  });

  it('leaves sourced weights untouched and never counts estimates in a median', () => {
    const cars = [car('suv', 2000), car('suv', 2100), car('suv', 2900), car('suv')];
    const before = structuredClone(cars.slice(0, 3).map((c) => c.fields.curb_weight_kg));
    fillCurbWeights(cars, sources);
    expect(cars.slice(0, 3).map((c) => c.fields.curb_weight_kg)).toEqual(before);
    const later = car('suv');
    fillCurbWeights([...cars, later], sources); // a second pass sees 3 sourced weights, not 4
    expect(later.fields.curb_weight_kg!.value).toMatchObject({ value: 2100, kind: 'estimated' });
    expect(later.fields.curb_weight_kg!.value.notes).toContain('median of 3 sourced');
  });

  it('gives every car in the real build a weight, each sourced or estimated with a basis', () => {
    const { cars } = buildCars(REPO);
    expect(cars.length).toBeGreaterThan(0);
    for (const c of cars) {
      const w = c.fields.curb_weight_kg?.value;
      expect(w, c.id).toBeTruthy();
      if (w!.kind === 'estimated') expect(w!.notes).toMatch(/median of \d+ sourced /);
    }
  });
});
