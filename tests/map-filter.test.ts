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
  it('keeps matching stations as slim pins with level and unavailable flag', () => {
    const fc = filterStations(
      [feat(1, [[3, 'ccs1', 150, 2]], 1), feat(2, [[2, 'j1772', 7.2, 2]]), feat(3, [[3, 'chademo', 50, 1], [2, 'j1772', null, 2]])],
      { ...defaultFilters(), levels: { 3: true, 2: true } },
    );
    expect(fc.features.map((x) => x.properties)).toEqual([
      { i: 1, lv: 3, t: 1 },
      { i: 2, lv: 2 },
      { i: 3, lv: 3 },
    ]);
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
