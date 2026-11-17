import { describe, expect, it } from 'vitest';
import { defaultFilters, filterStations, matchLevel, portMatches, readFilters } from '../src/lib/map-filter.ts';
import type { MapFeature, MapPort } from '../src/lib/map-data.ts';
import { inPowerRange, isFullRange, POWER_STOPS, rangeWords, type PowerRange } from '../src/lib/power-bands.ts';

const feat = (i: number, p: MapPort[], t?: 1): MapFeature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-75, 45] },
  properties: { i, n: `S${i}`, p, src: 'src-afdc-ca', ...(t ? { t } : {}) },
});

describe('defaults (charger-map §4, N8)', () => {
  const f = defaultFilters();
  it('Level 3 on, Level 2 off', () => {
    expect(f.levels).toEqual({ 3: true, 2: false });
  });
  it('each kW slider at its full range', () => {
    expect(f.power).toEqual({ 3: [0, 6], 2: [0, 5] });
    expect(isFullRange(3, f.power[3]) && isFullRange(2, f.power[2])).toBe(true);
  });
  it('all four plugs on', () => {
    expect(f.plugs).toEqual({ ccs1: true, nacs: true, chademo: true, j1772: true });
  });
});

describe('portMatches / matchLevel (any port matches)', () => {
  const f = defaultFilters();
  it('needs level, kW range and plug all to match', () => {
    expect(portMatches([3, 'ccs1', 150, 2], f)).toBe(true);
    expect(portMatches([2, 'j1772', 7.2, 2], f)).toBe(false); // Level 2 off
    const upTo100 = { ...f, power: { ...f.power, 3: [0, 2] as PowerRange } };
    expect(portMatches([3, 'ccs1', 150, 2], upTo100)).toBe(false);
    const noPlug = { ...f, plugs: { ...f.plugs, ccs1: false } };
    expect(portMatches([3, 'ccs1', 150, 2], noPlug)).toBe(false);
  });

  it('unknown power shows only while the slider covers its full range', () => {
    expect(portMatches([3, 'nacs', null, 8], f)).toBe(true);
    expect(portMatches([3, 'nacs', null, 8], { ...f, power: { ...f.power, 3: [1, 6] as PowerRange } })).toBe(false);
    expect(portMatches([3, 'nacs', null, 8], { ...f, power: { ...f.power, 3: [0, 5] as PowerRange } })).toBe(false);
  });

  it('a site with one matching port shows, at the highest matching level', () => {
    const ports: MapPort[] = [
      [3, 'chademo', 50, 1],
      [3, 'ccs1', 350, 2],
      [2, 'j1772', 7.2, 4],
    ];
    expect(matchLevel(ports, f)).toBe(3);
    const from250 = { ...f, power: { ...f.power, 3: [4, 6] as PowerRange } };
    expect(matchLevel(ports, from250)).toBe(3); // the 350 kW CCS port still matches
    const l2only = { ...f, levels: { 3: false, 2: true } as const };
    expect(matchLevel(ports, l2only)).toBe(2); // mixed site shows by its L2 port
    const nothing = { ...f, plugs: { ccs1: false, nacs: true, chademo: false, j1772: false } };
    expect(matchLevel(ports, nothing)).toBe(0);
  });
});

describe('filterStations', () => {
  it('keeps matching stations as slim pins with level, unavailable flag, top Level 3 kW and plugs (B54)', () => {
    const fc = filterStations(
      [feat(1, [[3, 'ccs1', 150, 2]], 1), feat(2, [[2, 'j1772', 7.2, 2]]), feat(3, [[3, 'chademo', 50, 1], [2, 'j1772', null, 2]])],
      { ...defaultFilters(), levels: { 3: true, 2: true } },
    );
    expect(fc.features.map((x) => x.properties)).toEqual([
      { i: 1, lv: 3, t: 1, k: 150, pc: 1, pn: 0, pd: 0, pj: 0, te: 0 },
      { i: 2, lv: 2, k: 0, pc: 0, pn: 0, pd: 0, pj: 1, te: 0 },
      { i: 3, lv: 3, k: 50, pc: 0, pn: 0, pd: 1, pj: 1, te: 0 },
    ]);
  });
  it('the marks count only ports the filters let through', () => {
    const fc = filterStations(
      [feat(4, [[3, 'ccs1', 350, 2], [3, 'nacs', 250, 4], [2, 'j1772', 7.2, 2]])],
      { ...defaultFilters(), levels: { 3: true, 2: false }, plugs: { ccs1: false, nacs: true, chademo: true, j1772: true } },
    );
    expect(fc.features[0].properties).toEqual({ i: 4, lv: 3, k: 250, pc: 0, pn: 1, pd: 0, pj: 0, te: 0 });
  });
  it('an unknown kW leaves k at 0', () => {
    const fc = filterStations([feat(5, [[3, 'ccs1', null, 1]])], defaultFilters());
    expect(fc.features[0].properties.k).toBe(0);
  });
});

describe('readFilters', () => {
  it('falls back to the defaults for missing or broken saved data', () => {
    expect(readFilters(null)).toEqual(defaultFilters());
    expect(readFilters('junk')).toEqual(defaultFilters());
    expect(readFilters({ levels: { 3: 'yes' } })).toEqual(defaultFilters());
  });
  it('restores saved choices and ignores unknown keys', () => {
    const f = readFilters({ levels: { 2: true }, power: { 3: [1, 4], 2: [0, 5] }, plugs: { chademo: false, bogus: true } });
    expect(f.levels).toEqual({ 3: true, 2: true });
    expect(f.power[3]).toEqual([1, 4]);
    expect(f.plugs.chademo).toBe(false);
    expect('bogus' in f.plugs).toBe(false);
  });
  it('rejects bad ranges and keeps the full range for saves from before the sliders', () => {
    const full = defaultFilters().power;
    for (const bad of [[2, 2], [3, 1], [0, 7], [-1, 3], [0.5, 3], 'x', [1]]) {
      expect(readFilters({ power: { 3: bad } }).power[3]).toEqual(full[3]);
    }
    expect(readFilters({ power: { 2: [0, 6] } }).power[2]).toEqual(full[2]); // Level 2 has 6 stops
    expect(readFilters({ bands: { l3_le_50: false } }).power).toEqual(full);
  });
});

describe('kW range (charger-map §4, B35)', () => {
  it('has the agreed stops, ending in "Max" (no limit)', () => {
    expect(POWER_STOPS[2]).toEqual([0, 3.6, 7.2, 11.5, 19.2, Infinity]);
    expect(POWER_STOPS[3]).toEqual([0, 50, 100, 150, 250, 350, Infinity]);
  });
  it('includes both ends of the range', () => {
    const r: PowerRange = [1, 2]; // 50–100 kW
    expect(inPowerRange(3, 50, r)).toBe(true);
    expect(inPowerRange(3, 100, r)).toBe(true);
    expect(inPowerRange(3, 49.9, r)).toBe(false);
    expect(inPowerRange(3, 100.3, r)).toBe(false);
    expect(inPowerRange(2, 7.2, [2, 3])).toBe(true);
    expect(inPowerRange(2, 7.1, [2, 3])).toBe(false);
  });
  it('the "Max" stop keeps ports above the top figure', () => {
    expect(inPowerRange(3, 480, [5, 6])).toBe(true);
    expect(inPowerRange(3, 480, [0, 5])).toBe(false);
    expect(inPowerRange(2, 39.8, [4, 5])).toBe(true);
    expect(inPowerRange(2, 19.2, [4, 5])).toBe(true);
  });
  it('a low-power DC port is still filtered as Level 3', () => {
    expect(inPowerRange(3, 20, [0, 1])).toBe(true);
  });
  it('treats missing, zero and invalid kW as unknown', () => {
    for (const kw of [null, 0, -5, Number.NaN]) {
      expect(inPowerRange(3, kw, [0, 6])).toBe(true);
      expect(inPowerRange(3, kw, [0, 5])).toBe(false);
    }
  });
  it('describes the range in words', () => {
    expect(rangeWords(3, [0, 6])).toEqual({ key: 'any' });
    expect(rangeWords(3, [0, 2])).toEqual({ key: 'upTo', max: 100 });
    expect(rangeWords(3, [1, 6])).toEqual({ key: 'from', min: 50 });
    expect(rangeWords(2, [2, 3])).toEqual({ key: 'between', min: 7.2, max: 11.5 });
  });
});

// ---- 5.2b: My car (B28) and links into the map (B31)
import {
  applyMapLink,
  carCanUse,
  carPlugs,
  linkPlugs,
  mapLink,
  needsAdapter,
  topDcKw,
  carMapInfo,
} from '../src/lib/map-filter.ts';

const featNw = (i: number, p: MapPort[], nw?: string): MapFeature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-75, 45] },
  properties: { i, n: `S${i}`, p, src: 'src-afdc-ca', ...(nw ? { nw } : {}) },
});

describe('carPlugs: car → plugs rule (charger-map §4)', () => {
  it('NACS car → NACS (+ J1772, by adapter; B42)', () => {
    expect(carPlugs('nacs', 'yes')).toEqual({ plugs: ['nacs', 'j1772'], superchargerAdapter: false });
  });
  it('CCS1 car with no Supercharger access → CCS1 (+ J1772)', () => {
    expect(carPlugs('ccs1', 'no')).toEqual({ plugs: ['ccs1', 'j1772'], superchargerAdapter: false });
    expect(carPlugs('ccs1', undefined)).toEqual({ plugs: ['ccs1', 'j1772'], superchargerAdapter: false });
  });
  it('CCS1 via adapter → CCS1, plus Superchargers marked "needs adapter"', () => {
    const r = carPlugs('ccs1', 'via_adapter')!;
    expect(r).toEqual({ plugs: ['ccs1', 'j1772'], superchargerAdapter: true });
    expect(carCanUse(r, 'nacs', 'Tesla')).toBe(true);
    expect(needsAdapter(r, 'nacs', 'Tesla')).toBe(true);
    expect(carCanUse(r, 'nacs', 'Tesla Destination')).toBe(false);
    expect(carCanUse(r, 'nacs', undefined)).toBe(false);
    expect(needsAdapter(r, 'ccs1', 'Tesla')).toBe(false);
  });
  it('"yes" on a CCS1 car → CCS1 + NACS, no adapter mark', () => {
    const r = carPlugs('ccs1', 'yes')!;
    expect(r.plugs).toContain('nacs');
    expect(needsAdapter(r, 'nacs', 'Tesla')).toBe(false);
  });
  it('unknown port → null (toggle disabled)', () => {
    expect(carPlugs(undefined, 'yes')).toBeNull();
    expect(carPlugs('unknown', 'no')).toBeNull();
    expect(carPlugs({ value: 'ccs1' }, 'no')).toBeNull();
  });
});

describe('My car filter', () => {
  const sc = featNw(1, [[3, 'nacs', 250, 8]], 'Tesla');
  const ea = featNw(2, [[3, 'ccs1', 150, 4], [3, 'chademo', 50, 1]], 'Electrify America');
  const td = featNw(3, [[3, 'nacs', 72, 2]]);
  const l2 = featNw(4, [[2, 'j1772', 7.2, 2]]);
  const all = [sc, ea, td, l2];
  const on = { ...defaultFilters(), myCar: true };
  const ids = (car: ReturnType<typeof carPlugs>, f = on) => filterStations(all, f, car).features.map((x) => x.properties.i);

  it('off, or with no car, changes nothing', () => {
    expect(ids(carPlugs('nacs', 'yes'), defaultFilters())).toEqual([1, 2, 3]);
    expect(ids(null)).toEqual([1, 2, 3]);
  });
  it('NACS car (a Tesla) sees NACS sites, and J1772 sites once Level 2 is on (B42)', () => {
    expect(ids(carPlugs('nacs', 'yes'))).toEqual([1, 3]);
    const withL2 = { ...on, levels: { 3: true, 2: true } as const };
    expect(ids(carPlugs('nacs', 'yes'), withL2)).toEqual([1, 3, 4]);
    expect(ids(carPlugs('ccs1', 'no'), withL2)).toEqual([2, 4]);
  });
  it('CCS1 via adapter: Superchargers yes, non-Supercharger NACS no', () => {
    expect(ids(carPlugs('ccs1', 'via_adapter'))).toEqual([1, 2]);
  });
  it('CCS1 with no access: CCS1 sites only', () => {
    expect(ids(carPlugs('ccs1', 'no'))).toEqual([2]);
  });
  it('still respects the plug ticks', () => {
    const f = { ...on, plugs: { ...on.plugs, nacs: false } };
    expect(ids(carPlugs('ccs1', 'via_adapter'), f)).toEqual([2]);
  });
  it('readFilters keeps a saved myCar flag', () => {
    expect(readFilters({ myCar: true }).myCar).toBe(true);
    expect(readFilters({ myCar: 'yes' }).myCar).toBe(false);
    expect(defaultFilters().myCar).toBe(false);
  });
});

describe('topDcKw (B31 "How fast would my car charge here?")', () => {
  const ports: MapPort[] = [[3, 'nacs', 250, 8], [3, 'ccs1', 150, 2], [2, 'j1772', 19.2, 2], [3, 'chademo', null, 1]];
  it('max DC kW over all ports with no car', () => {
    expect(topDcKw(ports)).toBe(250);
  });
  it('only ports the car can use', () => {
    expect(topDcKw(ports, carPlugs('ccs1', 'no'))).toBe(150);
    expect(topDcKw(ports, carPlugs('ccs1', 'via_adapter'), 'Tesla')).toBe(250);
    expect(topDcKw(ports, carPlugs('chademo', 'no'))).toBeNull();
  });
  it('null for a Level 2 only site', () => {
    expect(topDcKw([[2, 'j1772', 7.2, 4]])).toBeNull();
  });
});

describe('map link (B31 "Find chargers this fast")', () => {
  it('builds the link with plugs (adapter cars include NACS)', () => {
    expect(linkPlugs(carPlugs('ccs1', 'via_adapter')!)).toEqual(['ccs1', 'j1772', 'nacs']);
    expect(mapLink(150, ['ccs1', 'nacs'])).toBe('/?power=150&plugs=ccs1%2Cnacs');
    expect(mapLink(99.6, null)).toBe('/?power=100');
  });
  it('null when no link params', () => {
    expect(applyMapLink('', defaultFilters())).toBeNull();
    expect(applyMapLink('?foo=1', defaultFilters())).toBeNull();
  });
  it('kW → the L3 stop at or below it as min, Max as max; L3 on, L2 off', () => {
    const base = { ...defaultFilters(), levels: { 3: false, 2: true } };
    const cases: [string, number][] = [['150', 3], ['149', 2], ['50', 1], ['7', 0], ['400', 5], ['350', 5], ['1000', 5]];
    for (const [kw, lo] of cases) {
      const f = applyMapLink(`?power=${kw}`, base)!;
      expect(f.power[3], kw).toEqual([lo, POWER_STOPS[3].length - 1]);
      expect(f.levels).toEqual({ 3: true, 2: false });
    }
  });
  it('bad kW leaves power alone; plugs set exactly; unknown plugs ignored', () => {
    const f = applyMapLink('?power=abc&plugs=ccs1,bogus,nacs', defaultFilters())!;
    expect(f.power).toEqual(defaultFilters().power);
    expect(f.plugs).toEqual({ ccs1: true, nacs: true, chademo: false, j1772: false });
    const g = applyMapLink('?plugs=bogus', defaultFilters())!;
    expect(g.plugs).toEqual(defaultFilters().plugs);
  });
  it('does not mutate the base filters', () => {
    const base = defaultFilters();
    applyMapLink('?power=150&plugs=nacs', base);
    expect(base).toEqual(defaultFilters());
  });
});

describe('carMapInfo (car file → map info)', () => {
  const sv = (value: string) => ({ value: { value, kind: 'manufacturer', source_id: 's' }, others: [], conflict: false });
  it('reads make, port and access', () => {
    const tesla = carMapInfo({ make: { id: 'tesla' }, fields: { charge_port: sv('nacs'), supercharger_access: sv('yes') } });
    expect(tesla).toEqual({ isTesla: true, access: 'yes', port: 'nacs', rule: { plugs: ['nacs', 'j1772'], superchargerAdapter: false } });
    const ioniq = carMapInfo({ make: { id: 'hyundai' }, fields: { charge_port: sv('ccs1'), supercharger_access: sv('via_adapter') } });
    expect(ioniq.rule?.superchargerAdapter).toBe(true);
  });
  it('missing fields → unknown port', () => {
    expect(carMapInfo({ make: { id: 'bmw' }, fields: { charge_port: null } }).rule).toBeNull();
    expect(carMapInfo(null)).toEqual({ isTesla: false, access: null, port: null, rule: null });
  });
});

import { carTakesPlug, narrowedCount } from '../src/lib/map-filter.ts';

describe('narrowedCount / carTakesPlug (DESIGN-4 4.9)', () => {
  const ccs = carPlugs('ccs1', 'via_adapter')!;
  const nacs = carPlugs('nacs', 'yes')!;
  it('is 0 for the defaults, and turning Level 2 on does not count (it shows more)', () => {
    expect(narrowedCount(defaultFilters())).toBe(0);
    const f = defaultFilters();
    f.levels[2] = true;
    expect(narrowedCount(f)).toBe(0);
  });
  it('counts the car filter, fast chargers off, a narrowed range and unticked plugs once each', () => {
    const f = defaultFilters();
    f.myCar = true;
    expect(narrowedCount(f, null)).toBe(0); // port unknown: the filter is not in force
    expect(narrowedCount(f, ccs)).toBe(1);
    f.plugs.ccs1 = false;
    f.plugs.j1772 = false;
    expect(narrowedCount(f, ccs)).toBe(2);
    f.power[3] = [1, f.power[3][1]];
    expect(narrowedCount(f, ccs)).toBe(3);
    f.levels[3] = false; // its range no longer applies
    expect(narrowedCount(f, ccs)).toBe(3);
  });
  it('does not count an unticked plug the car filter already rules out', () => {
    const f = defaultFilters();
    f.myCar = true;
    f.plugs.chademo = false;
    expect(narrowedCount(f, ccs)).toBe(1);
    expect(narrowedCount({ ...f, myCar: false }, ccs)).toBe(1);
  });
  it('carTakesPlug: an adapter counts for NACS; other plugs follow the rule', () => {
    expect(carTakesPlug(ccs, 'nacs')).toBe(true);
    expect(carTakesPlug(ccs, 'chademo')).toBe(false);
    expect(carTakesPlug(carPlugs('ccs1', 'no')!, 'nacs')).toBe(false);
    expect(carTakesPlug(nacs, 'ccs1')).toBe(false);
    expect(carTakesPlug(nacs, 'j1772')).toBe(true);
  });
});

import { defaultDcPlugs, myCarRule, plugRule, carCanUse as canUse } from '../src/lib/map-filter.ts';

describe('My car plug switches (B55)', () => {
  const sv = (value: string) => ({ value: { value, kind: 'manufacturer', source_id: 's' }, others: [], conflict: false });
  it('defaults to the car\'s own DC plug only', () => {
    expect(defaultDcPlugs('nacs')).toEqual(['nacs']);
    expect(defaultDcPlugs('ccs1')).toEqual(['ccs1']);
    expect(defaultDcPlugs('chademo')).toEqual(['chademo']);
    expect(defaultDcPlugs('j1772')).toEqual([]);
    expect(defaultDcPlugs(null)).toEqual([]);
  });
  it('the rule holds the switched-on plugs plus J1772, never an adapter guess', () => {
    expect(plugRule(['ccs1'], 'via_adapter')).toEqual({ plugs: ['ccs1', 'j1772'], superchargerAdapter: false });
    expect(plugRule(['chademo', 'nacs'], 'yes')).toEqual({ plugs: ['nacs', 'chademo', 'j1772'], superchargerAdapter: false });
  });
  it('a CCS1 car with its NACS switch on can use Superchargers unless the data says no access', () => {
    expect(canUse(plugRule(['ccs1', 'nacs'], 'via_adapter'), 'nacs', 'Tesla')).toBe(true);
    expect(canUse(plugRule(['ccs1'], 'via_adapter'), 'nacs', 'Tesla')).toBe(false);
    const none = plugRule(['ccs1', 'nacs'], 'no');
    expect(canUse(none, 'nacs', 'Tesla')).toBe(false);
    expect(canUse(none, 'nacs', 'Electrify Canada')).toBe(true);
  });
  it('myCarRule: saved switches win; otherwise the own plug; null when nothing is known', () => {
    const ioniq = carMapInfo({ make: { id: 'hyundai' }, fields: { charge_port: sv('ccs1'), supercharger_access: sv('via_adapter') } });
    expect(myCarRule(ioniq, undefined)?.plugs).toEqual(['ccs1', 'j1772']);
    expect(myCarRule(ioniq, ['nacs', 'ccs1'])?.plugs).toEqual(['nacs', 'ccs1', 'j1772']);
    expect(myCarRule(ioniq, [])?.plugs).toEqual(['j1772']);
    const unknown = carMapInfo({ make: { id: 'bmw' }, fields: { charge_port: null } });
    expect(myCarRule(unknown, undefined)).toBeNull();
    expect(myCarRule(unknown, ['ccs1'])?.plugs).toEqual(['ccs1', 'j1772']);
    expect(myCarRule(null, ['ccs1'])).toBeNull();
  });
});

describe('Tesla network flag (B55)', () => {
  const f = (i: number, nw?: string) => ({ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [0, 0] as [number, number] }, properties: { i, n: 'S', p: [[3, 'nacs', 250, 4]] as never, src: 's', ...(nw ? { nw } : {}) } });
  it('marks Superchargers and Tesla Destination, nothing else', () => {
    const all = { ...defaultFilters(), levels: { 3: true, 2: true } };
    const te = filterStations([f(1, 'Tesla'), f(2, 'Tesla Destination'), f(3, 'Electrify Canada'), f(4)], all).features.map((x) => x.properties.te);
    expect(te).toEqual([1, 1, 0, 0]);
  });
});
