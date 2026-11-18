import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { Station, StationsFile } from '../scripts/lib/afdc.ts';
import { buildMap, toFeature } from '../scripts/lib/map-build.ts';
import { OCM_ID_OFFSET, type OcmStation, type OcmStationsFile } from '../scripts/lib/ocm.ts';
import { mapOutputProblems } from '../scripts/lib/output-check.ts';

const REPO = join(import.meta.dirname, '..');

function st(id: number, over: Partial<Station> = {}): Station {
  return {
    id,
    name: `Site ${id}`,
    street: null,
    city: null,
    province: null,
    postal: null,
    lat: 45.123456789,
    lon: -75.987654321,
    network: null,
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

const file = (stations: Station[]): StationsFile => ({
  source: 'afdc-ca',
  source_id: 'src-afdc-ca',
  fetched_at: '2026-11-16T09:36:25.408Z',
  raw_sha256: 'x',
  raw_count: stations.length,
  dropped: { private: 0, planned: 0, no_location: 0, no_l2_l3_ports: 0 },
  ignored_ports: {},
  stations,
});

describe('toFeature', () => {
  it('writes a GeoJSON point with short keys, rounded coordinates and the source id', () => {
    const f = toFeature(st(7), 'src-afdc-ca');
    expect(f.geometry).toEqual({ type: 'Point', coordinates: [-75.98765, 45.12346] });
    expect(f.properties).toEqual({ i: 7, n: 'Site 7', p: [[2, 'j1772', 7.2, 2]], src: 'src-afdc-ca' });
  });

  it('keeps every popup fact, and leaves empty ones out', () => {
    const f = toFeature(
      st(8, {
        street: '1 Main St',
        city: 'Ottawa',
        province: 'ON',
        postal: 'K1A 0A1',
        network: 'Tesla',
        status: 'T',
        expected_date: '2027-01-01',
        restricted: true,
        access_detail: 'CALL',
        hours: '24 hours daily',
        pricing: 'Free',
        pricing_fr: 'Gratuit',
        updated: '2026-11-01',
        ports: [{ level: 3, plug: 'nacs', kw: null, count: 8 }],
      }),
      'src-afdc-ca',
    ).properties;
    expect(f).toMatchObject({
      a: '1 Main St', c: 'Ottawa', r: 'ON', z: 'K1A 0A1', nw: 'Tesla', t: 1, ed: '2027-01-01',
      rs: 1, ad: 'CALL', h: '24 hours daily', pr: 'Free', pf: 'Gratuit', u: '2026-11-01',
      p: [[3, 'nacs', null, 8]],
    });
  });
});

describe('buildMap', () => {
  const l3 = { level: 3 as const, plug: 'ccs1' as const, kw: 150, count: 2 };
  const l2 = { level: 2 as const, plug: 'j1772' as const, kw: 7.2, count: 4 };
  const m = buildMap([file([st(1, { ports: [l3] }), st(2, { ports: [l3, l2] }), st(3, { ports: [l2] })])]);

  it('puts any station with a Level 3 port in l3 (mixed sites keep their Level 2 ports) and the rest in l2', () => {
    expect(m.l3.features.map((f) => f.properties.i)).toEqual([1, 2]);
    expect(m.l3.features[1].properties.p).toHaveLength(2);
    expect(m.l2.features.map((f) => f.properties.i)).toEqual([3]);
  });

  it('writes meta with the date and counts', () => {
    expect(m.meta).toEqual({
      source_id: 'src-afdc-ca',
      fetched_at: '2026-11-16T09:36:25.408Z',
      updated: '2026-11-16',
      counts: { l3: 2, l2: 1, total: 3 },
    });
  });
});

describe('mapOutputProblems', () => {
  const ids = new Set(['src-afdc-ca']);
  it('passes a sourced station and flags missing or unlisted sources, ports and coordinates', () => {
    const ok = buildMap([file([st(1)])]).l2;
    expect(mapOutputProblems('l2', ok, ids)).toEqual([]);
    const bad = structuredClone(ok);
    bad.features.push(structuredClone(bad.features[0]), structuredClone(bad.features[0]));
    delete (bad.features[0].properties as { src?: string }).src;
    bad.features[1].properties.src = 'src-nowhere';
    bad.features[2].properties.p = [];
    bad.features[2].geometry.coordinates = [Number.NaN, 45];
    const p = mapOutputProblems('l2', bad, ids);
    expect(p.some((x) => x.includes('no source_id'))).toBe(true);
    expect(p.some((x) => x.includes('unlisted source src-nowhere'))).toBe(true);
    expect(p.some((x) => x.includes('no ports'))).toBe(true);
    expect(p.some((x) => x.includes('no coordinates'))).toBe(true);
  });
});

describe('map build on the real data', () => {
  const path = join(REPO, 'data', 'imported', 'afdc', 'ca.json');
  it.skipIf(!existsSync(path))('every station is sourced and the files are under ~2 MB gzipped', () => {
    const src = JSON.parse(readFileSync(path, 'utf8')) as StationsFile;
    const m = buildMap([src]);
    const ids = new Set(readdirSync(join(REPO, 'data', 'sources')).map((f) => f.replace(/\.json$/, '')));
    expect([...mapOutputProblems('l3', m.l3, ids), ...mapOutputProblems('l2', m.l2, ids)]).toEqual([]);
    expect(m.meta.counts.total).toBe(src.stations.length);
    const gz = (x: unknown) => gzipSync(JSON.stringify(x)).length;
    expect(gz(m.l3) + gz(m.l2)).toBeLessThan(2e6);
    expect(gz(m.l3)).toBeLessThan(0.5e6);
  });
});

describe('map build with Open Charge Map (B77)', () => {
  const ocm = (ocmId: number, lat: number, over: Partial<OcmStation> = {}): OcmStation => ({ ...st(OCM_ID_OFFSET + ocmId, { lat, ports: [{ level: 3, plug: 'ccs1', kw: 50, count: 1 }] }), provider: 1, verified: '2024-11-23', ...over });
  const ocmFile = (stations: OcmStation[]): OcmStationsFile => ({
    source: 'ocm-ca', source_id: 'src-ocm', fetched_at: '2026-11-18T10:00:00.000Z', raw_sha256: 'y', raw_count: stations.length,
    dropped: { provider: 0, unpublished: 0, not_operational: 0, private: 0, no_location: 0, no_port_data: 0, no_l2_l3_ports: 0 }, ignored_ports: {}, stations,
  });

  it('adds OCM stations that are not duplicates, with provider and verified date, and counts them in meta', () => {
    const afdc = file([st(1, { lat: 45, ports: [{ level: 3, plug: 'ccs1', kw: 50, count: 2 }] })]);
    const m = buildMap([afdc], [ocmFile([ocm(5, 45.0005), ocm(6, 48)])]);
    const ids = m.l3.features.map((f) => f.properties.i);
    expect(ids).toEqual([1, OCM_ID_OFFSET + 6]);
    expect(m.l3.features[1].properties).toMatchObject({ src: 'src-ocm', op: 1, v: '2024-11-23' });
    expect(m.meta.ocm).toEqual({ source_id: 'src-ocm', fetched_at: '2026-11-18T10:00:00.000Z', updated: '2026-11-18', count: 1 });
    expect(m.ocm?.dropped.place).toBe(1);
  });

  it('honours the skip list and stays AFDC-only without OCM data', () => {
    const afdc = file([st(1)]);
    expect(buildMap([afdc], [ocmFile([ocm(6, 48)])], [{ ocm_id: 6, reason: 'test' }]).meta.counts.total).toBe(1);
    const plain = buildMap([afdc]);
    expect(plain.meta.ocm).toBeUndefined();
    expect(plain.ocm).toBeNull();
  });

  it('refuses a station id used twice', () => {
    expect(() => buildMap([file([st(1), st(1)])])).toThrow(/used twice/);
  });
});
