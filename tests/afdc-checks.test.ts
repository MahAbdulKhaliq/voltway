import { describe, expect, it } from 'vitest';
import type { Station, StationsFile } from '../scripts/lib/afdc.ts';
import { checkAfdc, stationLevel, summaryMarkdown } from '../scripts/lib/afdc-checks.ts';

function st(id: number, over: Partial<Station> = {}): Station {
  return {
    id,
    name: `Site ${id}`,
    street: null,
    city: null,
    province: 'ON',
    postal: null,
    lat: 45.4,
    lon: -75.7,
    network: 'FLO',
    status: 'E',
    expected_date: null,
    restricted: false,
    access_detail: null,
    hours: null,
    pricing: null,
    pricing_fr: null,
    updated: null,
    confirmed: null,
    ports: [{ level: 2, plug: 'j1772', kw: 7.2, count: 2 }],
    ...over,
  };
}

function file(stations: Station[], dropped: Partial<StationsFile['dropped']> = {}): StationsFile {
  return {
    source: 'afdc-ca',
    source_id: 'src-afdc-ca',
    fetched_at: '2026-11-16T00:00:00Z',
    raw_sha256: 'x',
    raw_count: stations.length,
    dropped: { private: 0, planned: 0, no_location: 0, no_l2_l3_ports: 0, ...dropped },
    ignored_ports: {},
    stations,
  };
}

const range = (n: number, from = 1) => Array.from({ length: n }, (_, i) => st(from + i));

describe('checkAfdc', () => {
  it('passes a normal day: small changes, nothing missing', () => {
    const prev = file(range(100));
    const next = file([...range(98), st(500)]);
    const r = checkAfdc(prev, next);
    expect(r.ok).toBe(true);
    expect(r.failures).toEqual([]);
    expect(r.totals.added.L2).toBe(1);
    expect(r.totals.removed.L2).toBe(2);
  });

  it('passes the first import (nothing committed yet)', () => {
    const r = checkAfdc(null, file(range(10)));
    expect(r.ok).toBe(true);
    expect(r.totals.added.L2).toBe(10);
  });

  it('allows exactly a 10 % drop', () => {
    expect(checkAfdc(file(range(100)), file(range(90))).ok).toBe(true);
  });

  it('fails when the count drops more than 10 %', () => {
    const r = checkAfdc(file(range(100)), file(range(89)));
    expect(r.ok).toBe(false);
    expect(r.failures.join()).toMatch(/fell 11\.0 %/);
  });

  it('fails when more than 2 % of usable stations were dropped for missing location or ports', () => {
    const next = file(range(97), { no_location: 2, no_l2_l3_ports: 1 }); // 3 of 100
    const r = checkAfdc(file(range(97)), next);
    expect(r.ok).toBe(false);
    expect(r.missing).toBe(3);
    expect(r.usable).toBe(100);
    expect(r.failures.join()).toMatch(/lack coordinates, level or plugs/);
  });

  it('allows exactly 2 % missing', () => {
    expect(checkAfdc(null, file(range(98), { no_location: 2 })).ok).toBe(true);
  });

  it('counts kept stations with bad coordinates or empty ports as missing', () => {
    const bad = [
      st(1, { lat: Number.NaN }),
      st(2, { lat: 0, lon: 0 }), // null island, outside Canada
      st(3, { ports: [] }),
    ];
    const r = checkAfdc(null, file([...bad, ...range(97, 10)]));
    expect(r.missing).toBe(3);
    expect(r.ok).toBe(false);
  });

  it('ignores private and planned drops (they are by design, not missing data)', () => {
    expect(checkAfdc(null, file(range(50), { private: 40, planned: 5 })).ok).toBe(true);
  });

  it('fails an empty import', () => {
    const r = checkAfdc(file(range(10)), file([]));
    expect(r.ok).toBe(false);
  });

  it('groups added, removed and changed by province and level', () => {
    const l3 = { ports: [{ level: 3 as const, plug: 'ccs1' as const, kw: 150, count: 4 }] };
    const prev = file([st(1), st(2, { province: 'QC' }), st(3, { province: 'BC', ...l3 })]);
    const next = file([
      st(1, { pricing: '$0.30/kWh' }), // changed, ON, L2
      st(3, { province: 'BC', ...l3 }), // unchanged
      st(4, { province: 'BC', ...l3 }), // added, BC, L3
    ]);
    const r = checkAfdc(prev, next);
    expect(r.byProvince.get('ON')!.changed.L2).toBe(1);
    expect(r.byProvince.get('QC')!.removed.L2).toBe(1);
    expect(r.byProvince.get('BC')!.added.L3).toBe(1);
    expect(r.byProvince.get('BC')!.changed.L3).toBe(0);
    expect(r.totals).toEqual({
      added: { L3: 1, L2: 0 },
      removed: { L3: 0, L2: 1 },
      changed: { L3: 0, L2: 1 },
    });
  });
});

describe('stationLevel', () => {
  it('a mixed site counts as Level 3', () => {
    expect(
      stationLevel({
        ports: [
          { level: 2, plug: 'j1772', kw: 7.2, count: 2 },
          { level: 3, plug: 'ccs1', kw: 50, count: 1 },
        ],
      }),
    ).toBe('L3');
  });
});

describe('summaryMarkdown', () => {
  it('writes the check result and a province × level table', () => {
    const r = checkAfdc(file([st(1)]), file([st(1), st(2, { province: 'AB' })]));
    const md = summaryMarkdown(r, '2026-11-16T00:00:00Z');
    expect(md).toContain('Sanity checks: passed');
    expect(md).toContain('Stations kept: 1 → 2');
    expect(md).toContain('| AB | 0 | 1 | 0 | 0 | 0 | 0 |');
    expect(md).toContain('| **Total** | 0 | 1 | 0 | 0 | 0 | 0 |');
  });

  it('says so when nothing changed', () => {
    const md = summaryMarkdown(checkAfdc(file(range(3)), file(range(3))), 'now');
    expect(md).toContain('No station was added, removed or changed.');
  });

  it('lists the failures when the checks fail', () => {
    const md = summaryMarkdown(checkAfdc(file(range(100)), file(range(50))), 'now');
    expect(md).toContain('Sanity checks: FAILED');
    expect(md).toMatch(/- Station count fell 50\.0 %/);
  });
});

describe('checkAfdc per country (B78, DESIGN-7 D1)', () => {
  const us = (id: number, lat: number, lon: number) => st(id, { lat, lon, province: 'TX' });
  it('a US file passes with US, Alaska, Hawaii, Puerto Rico and Guam stations', () => {
    const stations = [us(1, 30.27, -97.74), us(2, 61.22, -149.9), us(3, 21.31, -157.86), us(4, 18.47, -66.11), us(5, 13.47, 144.75)];
    const r = checkAfdc(null, file(stations), { country: 'us' });
    expect(r.ok).toBe(true);
    expect(r.missing).toBe(0);
  });
  it('the same US stations count as bad coordinates in a Canadian file', () => {
    const stations = Array.from({ length: 10 }, (_, i) => us(i + 1, 30.27, -97.74));
    const r = checkAfdc(null, file(stations));
    expect(r.ok).toBe(false);
    expect(r.missing).toBe(10);
  });
  it('labels the summary table by state for the US and province for Canada', () => {
    const md = (country: 'ca' | 'us') => summaryMarkdown(checkAfdc(null, file([us(1, 45.4, -75.7)]), { country }), 'today');
    expect(md('us')).toContain('| State |');
    expect(md('ca')).toContain('| Province |');
  });
});
