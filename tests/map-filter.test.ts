import { describe, expect, it } from 'vitest';
import { defaultFilters, filterStations, matchLevel, portMatches, readFilters } from '../src/lib/map-filter.ts';
import type { MapFeature, MapPort } from '../src/lib/map-data.ts';

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
  it('every band on, including both "Unknown power" bands', () => {
    expect(Object.keys(f.bands)).toHaveLength(10);
    expect(Object.values(f.bands).every(Boolean)).toBe(true);
    expect(f.bands.l3_unknown && f.bands.l2_unknown).toBe(true);
  });
  it('all four plugs on', () => {
    expect(f.plugs).toEqual({ ccs1: true, nacs: true, chademo: true, j1772: true });
  });
});

describe('portMatches / matchLevel (any port matches)', () => {
  const f = defaultFilters();
  it('needs level, band and plug all ticked', () => {
    expect(portMatches([3, 'ccs1', 150, 2], f)).toBe(true);
    expect(portMatches([2, 'j1772', 7.2, 2], f)).toBe(false); // Level 2 off
    const noBand = { ...f, bands: { ...f.bands, l3_le_250: false } };
    expect(portMatches([3, 'ccs1', 150, 2], noBand)).toBe(false);
    const noPlug = { ...f, plugs: { ...f.plugs, ccs1: false } };
    expect(portMatches([3, 'ccs1', 150, 2], noPlug)).toBe(false);
  });

  it('unknown power goes through the "Unknown power" box', () => {
    expect(portMatches([3, 'nacs', null, 8], f)).toBe(true);
    expect(portMatches([3, 'nacs', null, 8], { ...f, bands: { ...f.bands, l3_unknown: false } })).toBe(false);
  });

  it('a site with one matching port shows, at the highest matching level', () => {
    const ports: MapPort[] = [
      [3, 'chademo', 50, 1],
      [3, 'ccs1', 350, 2],
      [2, 'j1772', 7.2, 4],
    ];
    expect(matchLevel(ports, f)).toBe(3);
    const onlyOver250 = { ...f, bands: { ...f.bands, l3_le_50: false } };
    expect(matchLevel(ports, onlyOver250)).toBe(3); // the 350 kW CCS port still matches
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
    const f = readFilters({ levels: { 2: true }, bands: { l3_le_50: false, bogus: true }, plugs: { chademo: false } });
    expect(f.levels).toEqual({ 3: true, 2: true });
    expect(f.bands.l3_le_50).toBe(false);
    expect('bogus' in f.bands).toBe(false);
    expect(f.plugs.chademo).toBe(false);
  });
});
