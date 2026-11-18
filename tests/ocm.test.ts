import { describe, expect, it } from 'vitest';
import { checkAfdc } from '../scripts/lib/afdc-checks.ts';
import type { Station } from '../scripts/lib/afdc.ts';
import { headers, MAX_PAGES, PAGE_SIZE, PAUSE_MS, poiQuery, pullPois, USER_AGENT, type Fetch } from '../scripts/fetch-ocm.ts';
import { levelOf, normalizeOcm, OCM_ID_OFFSET, provinceOf, type OcmStation, type RawPoi } from '../scripts/lib/ocm.ts';
import { mergeOcm, sameAddress, similarNames } from '../scripts/lib/ocm-merge.ts';

// ---- 6.2 Fetch: fair use (DESIGN-6 P1)

describe('fetch:ocm query and paging', () => {
  it('asks only for Canada, our three providers, compact, no comments, paged by id', () => {
    const q = new URL(poiQuery(1234));
    expect(q.origin + q.pathname).toBe('https://api.openchargemap.io/v3/poi');
    expect(Object.fromEntries(q.searchParams)).toEqual({
      output: 'json', countrycode: 'CA', dataproviderid: '1,24,45', compact: 'true', verbose: 'false',
      includecomments: 'false', sortby: 'id_asc', greaterthanid: '1234', maxresults: String(PAGE_SIZE),
    });
    expect(q.search).not.toMatch(/key=/i);
  });

  it('sends the key only as a header, with the Voltway user agent', () => {
    expect(headers('k')).toEqual({ 'X-API-Key': 'k', 'User-Agent': USER_AGENT, Accept: 'application/json' });
    expect(USER_AGENT).toMatch(/^Voltway/);
  });

  const page = (from: number, n: number) => Array.from({ length: n }, (_, i) => ({ ID: from + i }));
  const fake = (pages: unknown[][], status = 200) => {
    const urls: string[] = [];
    const fn: Fetch = async (url) => {
      urls.push(url);
      const body = pages[urls.length - 1] ?? [];
      return { ok: status === 200, status, text: async () => JSON.stringify(body) };
    };
    return { fn, urls };
  };

  it('pages by the last id, pausing 3 s between requests, and stops on a short page', async () => {
    const { fn, urls } = fake([page(1, PAGE_SIZE), page(PAGE_SIZE + 10, PAGE_SIZE), page(3 * PAGE_SIZE, 12)]);
    const pauses: number[] = [];
    const r = await pullPois('k', fn, async (ms) => { pauses.push(ms); }, 'us');
    expect(r.requests).toBe(3);
    expect(r.pois).toHaveLength(2 * PAGE_SIZE + 12);
    expect(urls.map((u) => new URL(u).searchParams.get('greaterthanid'))).toEqual(['0', String(PAGE_SIZE), String(2 * PAGE_SIZE + 9)]);
    expect(pauses).toEqual([PAUSE_MS, PAUSE_MS]);
  });

  it('never retries: one failed request throws', async () => {
    const { fn, urls } = fake([[]], 503);
    await expect(pullPois('k', fn, async () => {})).rejects.toThrow(/HTTP 503/);
    expect(urls).toHaveLength(1);
  });

  it('stops after the page cap instead of calling on and on (Canada 2 pages, US 5)', async () => {
    for (const c of ['ca', 'us'] as const) {
      const pages = Array.from({ length: MAX_PAGES[c] + 2 }, (_, i) => page(1 + i * PAGE_SIZE, PAGE_SIZE));
      const { fn, urls } = fake(pages);
      await expect(pullPois('k', fn, async () => {}, c)).rejects.toThrow(/stopping/);
      expect(urls).toHaveLength(MAX_PAGES[c]);
      expect(urls.every((u) => new URL(u).searchParams.get('countrycode') === c.toUpperCase())).toBe(true);
    }
  });

  it('stays inside the monthly cap of 10 requests for both countries (B78)', () => {
    // Each country: its pages plus one reference-data request.
    expect(MAX_PAGES.ca + 1 + MAX_PAGES.us + 1).toBeLessThanOrEqual(10);
    expect(PAGE_SIZE).toBe(5000);
  });

  it('rejects a response that is not an id-ordered list', async () => {
    await expect(pullPois('k', fake([{ a: 1 } as unknown as unknown[]]).fn, async () => {})).rejects.toThrow(/not a list/);
    await expect(pullPois('k', fake([[{ ID: 5 }, { ID: 3 }]]).fn, async () => {})).rejects.toThrow(/id order/);
  });
});

// ---- 6.3 Normalize (DESIGN-6 P2)

const poi = (over: Partial<RawPoi> = {}, conns: RawPoi['Connections'] = [{ ConnectionTypeID: 32, LevelID: 3, PowerKW: 50, Quantity: 2 }]): RawPoi => ({
  ID: 1000,
  DataProviderID: 1,
  OperatorID: 7,
  UsageTypeID: 1,
  StatusTypeID: 50,
  SubmissionStatusTypeID: 200,
  DateLastVerified: '2024-11-23T10:00:00Z',
  AddressInfo: { Title: 'Ivy - White River', AddressLine1: '217 Highway 17', Town: 'White River', StateOrProvince: 'Ontario', Postcode: 'P0M 3G0', Latitude: 48.59, Longitude: -85.28 },
  Connections: conns,
  ...over,
});
const ops = new Map([[7, 'IVY'], [8, 'Tesla (Tesla-only charging)'], [9, 'Some New Network'], [10, '(Unknown Operator)']]);

describe('normalizeOcm', () => {
  it('keeps a published, public, operational record in our station shape, with provider and verified date', () => {
    const { stations } = normalizeOcm([poi()], ops);
    expect(stations).toEqual([expect.objectContaining({
      id: OCM_ID_OFFSET + 1000, name: 'Ivy - White River', street: '217 Highway 17', city: 'White River', province: 'ON',
      network: 'IVY', status: 'E', restricted: false, provider: 1, verified: '2024-11-23',
      ports: [{ level: 3, plug: 'ccs1', kw: 50, count: 2 }],
    })]);
  });

  it('drops other providers, unpublished, gone and private records, and records without a place or plugs', () => {
    const raw = [
      poi({ ID: 1, DataProviderID: 2 }), poi({ ID: 2, DataProviderID: 15 }),
      poi({ ID: 3, SubmissionStatusTypeID: 1 }), poi({ ID: 4, SubmissionStatusTypeID: 1001 }),
      poi({ ID: 5, StatusTypeID: 150 }), poi({ ID: 6, StatusTypeID: 100 }), poi({ ID: 7, StatusTypeID: 200 }), poi({ ID: 8, StatusTypeID: 210 }),
      poi({ ID: 9, UsageTypeID: 2 }), poi({ ID: 10, UsageTypeID: 6 }), poi({ ID: 11, UsageTypeID: 3 }),
      poi({ ID: 12, AddressInfo: { Title: 'x', Latitude: null, Longitude: null } }),
      // Audit 2026-11-18 (OCM 160778): a longitude with the wrong sign plots in Asia.
      poi({ ID: 15, AddressInfo: { Title: 'x', Latitude: 52.1, Longitude: 122.46 } }),
      poi({ ID: 13 }, [{ ConnectionTypeID: 25, LevelID: 1, Quantity: 1 }]),
      // B78 (7.4): no connections, or only the unknown type, is missing data; Level 1 or other plugs is not.
      poi({ ID: 16 }, []), poi({ ID: 17 }, [{ ConnectionTypeID: 0, LevelID: 2, Quantity: 1 }]),
      poi({ ID: 18 }, [{ ConnectionTypeID: 22, LevelID: 1, Quantity: 2 }]),
      poi({ ID: 14 }),
    ];
    const r = normalizeOcm(raw, ops);
    expect(r.stations.map((s) => s.id - OCM_ID_OFFSET)).toEqual([14]);
    expect(r.dropped).toEqual({ provider: 2, unpublished: 2, not_operational: 4, private: 3, no_location: 2, no_port_data: 2, no_l2_l3_ports: 2 });
  });

  it('keeps US records inside the US boxes and maps their states (B78)', () => {
    const at = (ID: number, Latitude: number, Longitude: number, StateOrProvince: string) => poi({ ID, AddressInfo: { Title: 'x', Latitude, Longitude, StateOrProvince } });
    const raw = [at(1, 30.27, -97.74, 'Texas'), at(2, 61.22, -149.9, 'AK'), at(3, 43.65, 79.38, 'NY')];
    const us = normalizeOcm(raw, ops, 'us');
    expect(us.stations.map((s) => [s.id - OCM_ID_OFFSET, s.province])).toEqual([[1, 'TX'], [2, 'AK']]);
    expect(us.dropped.no_location).toBe(1); // the wrong-sign longitude
    // A Canadian pull keeps Canada's tight box: none of these US points.
    expect(normalizeOcm(raw, ops).stations).toEqual([]);
  });

  it('keeps temporarily unavailable as T and flags only notice required as restricted (not membership, not pay at location)', () => {
    const r = normalizeOcm([poi({ ID: 1, StatusTypeID: 30 }), poi({ ID: 2, UsageTypeID: 4 }), poi({ ID: 3, UsageTypeID: 7 }), poi({ ID: 4, UsageTypeID: 5 })], ops);
    expect(r.stations.map((s) => [s.status, s.restricted])).toEqual([['T', false], ['E', false], ['E', true], ['E', false]]);
  });

  it('maps the four plugs, ignores others, skips gone ports, and merges equal ports', () => {
    const r = normalizeOcm([poi({}, [
      { ConnectionTypeID: 1, LevelID: 2, PowerKW: 7.2, Quantity: 2 },
      { ConnectionTypeID: 1, LevelID: 2, PowerKW: 7.2 },
      { ConnectionTypeID: 2, LevelID: 3, PowerKW: 50, Quantity: 1 },
      { ConnectionTypeID: 27, LevelID: 3, PowerKW: 250, Quantity: 4 },
      { ConnectionTypeID: 30, LevelID: 2, PowerKW: 11, Quantity: 1 },
      { ConnectionTypeID: 33, LevelID: 3, PowerKW: 150, Quantity: 1 },
      { ConnectionTypeID: 32, LevelID: 3, PowerKW: 150, Quantity: 1, StatusTypeID: 100 },
    ])], ops);
    expect(r.stations[0].ports).toEqual([
      { level: 3, plug: 'chademo', kw: 50, count: 1 },
      { level: 3, plug: 'nacs', kw: 250, count: 4 },
      { level: 2, plug: 'j1772', kw: 7.2, count: 3 },
      { level: 2, plug: 'nacs', kw: 11, count: 1 },
    ]);
    expect(r.ignored_ports).toEqual({ 'ocm-33': 1 });
  });

  it('level: OCM level 3 or 40 kW and up is Level 3; level 1 is dropped; no level falls back on the plug', () => {
    expect(levelOf(3, 'ccs1', 25)).toBe(3);
    expect(levelOf(2, 'nacs', 72)).toBe(3);
    expect(levelOf(2, 'j1772', 7)).toBe(2);
    expect(levelOf(1, 'j1772', 1.4)).toBeNull();
    expect(levelOf(null, 'ccs1', null)).toBe(3);
    expect(levelOf(null, 'j1772', null)).toBe(2);
    expect(levelOf(undefined, 'nacs', null)).toBe(2);
    // The plug wins over OCM's level and kW (audit 2026-11-18: CCS marked Level 2, J1772 at "50 kW").
    expect(levelOf(2, 'ccs1', 50)).toBe(3);
    expect(levelOf(2, 'chademo', null)).toBe(3);
    expect(levelOf(3, 'j1772', 50)).toBe(2);
    expect(levelOf(null, 'j1772', 50)).toBe(2);
  });

  it('names networks like AFDC does (Tesla Supercharger vs Destination; unknown operator = none)', () => {
    const r = normalizeOcm([
      poi({ ID: 1, OperatorID: 8 }, [{ ConnectionTypeID: 27, LevelID: 3, PowerKW: 250, Quantity: 8 }]),
      poi({ ID: 2, OperatorID: 8 }, [{ ConnectionTypeID: 30, LevelID: 2, PowerKW: 11, Quantity: 2 }]),
      poi({ ID: 3, OperatorID: 9 }), poi({ ID: 4, OperatorID: 10 }), poi({ ID: 5, OperatorID: null }),
    ], ops);
    expect(r.stations.map((s) => s.network)).toEqual(['Tesla', 'Tesla Destination', 'Some New Network', null, null]);
  });

  it('reads the province from free text, else from the postal code', () => {
    expect(provinceOf('Ontario ', null)).toBe('ON');
    expect(provinceOf('Qc', null)).toBe('QC');
    expect(provinceOf('B.C.', null)).toBe('BC');
    expect(provinceOf('Québec', null)).toBe('QC');
    expect(provinceOf('Greater Vancouver Regional District', 'V6B 1A1')).toBe('BC');
    expect(provinceOf(null, null)).toBeNull();
    // US (B78): code or name, any case; ZIP codes aren't mapped; Canadian text doesn't leak in.
    expect(provinceOf('Texas', '78701', 'us')).toBe('TX');
    expect(provinceOf(' tx ', null, 'us')).toBe('TX');
    expect(provinceOf('New  York', null, 'us')).toBe('NY');
    expect(provinceOf('D.C.', null, 'us')).toBe('DC');
    expect(provinceOf(null, '78701', 'us')).toBeNull();
    expect(provinceOf('Ontario', null, 'us')).toBeNull();
  });
});

// ---- 6.4 Duplicates (DESIGN-6 P3)

const M = 1 / 111.32; // degrees of latitude per km
const afdcStation = (id: number, lat: number, over: Partial<Station> = {}): Station => ({
  id, name: `A${id}`, street: null, city: null, province: 'ON', postal: null, lat, lon: -80, network: null, status: 'E',
  expected_date: null, restricted: false, access_detail: null, hours: null, pricing: null, pricing_fr: null, updated: null, confirmed: null,
  ports: [{ level: 3, plug: 'ccs1', kw: 50, count: 1 }], ...over,
});
const ocmStation = (ocmId: number, lat: number, over: Partial<OcmStation> = {}): OcmStation => ({
  ...afdcStation(OCM_ID_OFFSET + ocmId, lat), name: `O${ocmId}`, provider: 1, verified: null, ...over,
});

describe('mergeOcm', () => {
  it('same place: within 150 m sharing a plug at the same level is a duplicate; AFDC wins', () => {
    const r = mergeOcm([ocmStation(1, 45 + 0.1 * M)], [afdcStation(10, 45)]);
    expect(r.kept).toEqual([]);
    expect(r.dropped.place).toBe(1);
    expect(r.matches).toEqual([{ ocm: OCM_ID_OFFSET + 1, afdc: 10, layer: 'place' }]);
  });

  it('a different plug at the same plaza is kept (and listed as a near miss)', () => {
    const r = mergeOcm([ocmStation(1, 45 + 0.16 * M)], [afdcStation(10, 45, { ports: [{ level: 3, plug: 'nacs', kw: 250, count: 8 }] })]);
    expect(r.kept).toHaveLength(1);
    expect(r.nearMisses).toEqual([expect.objectContaining({ ocm: expect.objectContaining({ id: 1 }), afdc: expect.objectContaining({ id: 10 }) })]);
  });

  it('same level matters: a CCS Level 3 is not the same as a J1772 Level 2 next door', () => {
    const r = mergeOcm([ocmStation(1, 45)], [afdcStation(10, 45, { ports: [{ level: 2, plug: 'j1772', kw: 7, count: 2 }] })]);
    expect(r.kept).toHaveLength(1);
  });

  it('same address within 1 km (street number + street name) sharing a plug at the same level', () => {
    const r = mergeOcm([ocmStation(1, 45 + 0.8 * M, { street: '6435 Metral Drive' })], [afdcStation(10, 45, { street: '6435 Metral Dr' })]);
    expect(r.dropped.address).toBe(1);
  });

  // Audit 2026-11-18: the address layer removed DC fast and Tesla sites against an AFDC Level 2 listing.
  it('same address but no shared plug is kept', () => {
    const r = mergeOcm(
      [ocmStation(1, 45 + 0.8 * M, { street: '6435 Metral Drive' })],
      [afdcStation(10, 45, { street: '6435 Metral Dr', ports: [{ level: 2, plug: 'j1772', kw: 7, count: 2 }] })],
    );
    expect(r.kept).toHaveLength(1);
  });

  it('never removes an OCM station with Level 3 or NACS that its AFDC match lacks', () => {
    const j1772 = { level: 2 as const, plug: 'j1772' as const, kw: 7, count: 2 };
    const dc = mergeOcm([ocmStation(1, 45, { ports: [j1772, { level: 3, plug: 'ccs1', kw: 50, count: 1 }] })], [afdcStation(10, 45, { ports: [j1772] })]);
    expect(dc.kept).toHaveLength(1);
    const nacs = mergeOcm([ocmStation(1, 45, { ports: [j1772, { level: 2, plug: 'nacs', kw: 11, count: 2 }] })], [afdcStation(10, 45, { ports: [j1772] })]);
    expect(nacs.kept).toHaveLength(1);
    // Audit W1: a CCS fast charger next to a Supercharger with only NACS is its own station.
    const sc = { level: 3 as const, plug: 'nacs' as const, kw: 250, count: 8 };
    const jule = mergeOcm([ocmStation(1, 45, { ports: [{ level: 3, plug: 'ccs1', kw: 200, count: 2 }, sc] })], [afdcStation(10, 45, { ports: [sc] })]);
    expect(jule.kept).toHaveLength(1);
    // A second AFDC listing at the same place that has the NACS plugs covers it.
    const covered = mergeOcm(
      [ocmStation(1, 45, { ports: [j1772, { level: 2, plug: 'nacs', kw: 11, count: 2 }] })],
      [afdcStation(10, 45, { ports: [j1772] }), afdcStation(11, 45 + 0.05 * M, { ports: [{ level: 2, plug: 'nacs', kw: 11, count: 2 }] })],
    );
    expect(covered.kept).toEqual([]);
  });

  it('a street number alone is not the same address', () => {
    expect(sameAddress('3000 Lougheed Hwy', '3000 Guildford Way')).toBe(false);
    expect(sameAddress('46 Pine St', '46 Pine Street')).toBe(true);
    expect(sameAddress('180, Rang du Moulin Rouge', '180 Rang du Moulin Rouge')).toBe(true);
    // Audit 2026-11-18: numbered streets and highways, ordinals, but not shared filler or direction words.
    expect(sameAddress('1800 2nd Ave E', '1800 2 Avenue East')).toBe(true);
    expect(sameAddress('114 7th Avenue', '114 7 Ave')).toBe(true);
    expect(sameAddress('525 Highway 11 W', '525 Hwy 11')).toBe(true);
    expect(sameAddress('10 3e Rue', '10 3 rue')).toBe(true);
    expect(sameAddress('525 Hwy 11', '525 Hwy 17')).toBe(false);
    expect(sameAddress('180 Rue du Lac', '180 Chemin du Roi')).toBe(false);
    expect(sameAddress('100 Main St S', '100 King St S')).toBe(false);
  });

  it('same name within 300 m with a shared plug; a shared word or a far name is not enough', () => {
    expect(similarNames('Riverfront Chalets & Rafting', 'Riverfront Chalets & Rafting')).toBe(true);
    expect(similarNames('Riverfront Chalets', 'Riverside Chalets')).toBe(false);
    // Two words in common but different plugs: a Petro-Canada CCS next to a Supercharger stays.
    const golden = mergeOcm([ocmStation(3, 45 + 0.16 * M, { name: 'Petro Canada - Golden BC' })], [afdcStation(11, 45, { name: 'Golden, BC - Trans-Canada Hwy - Tesla Supercharger', ports: [{ level: 3, plug: 'nacs', kw: 250, count: 8 }] })]);
    expect(golden.kept).toHaveLength(1);
    const r = mergeOcm(
      [ocmStation(1, 45 + 0.2 * M, { name: 'Auberge La Seigneurie des Monts' }), ocmStation(2, 45 + 0.45 * M, { name: 'Auberge La Seigneurie des Monts' })],
      [afdcStation(10, 45, { name: 'Auberge la Seigneurie des Monts Inc' })],
    );
    expect(r.dropped.name).toBe(1);
    expect(r.kept.map((s) => s.id)).toEqual([OCM_ID_OFFSET + 2]);
  });

  it('the skip list drops a duplicate the rules miss', () => {
    const r = mergeOcm([ocmStation(1, 46)], [afdcStation(10, 45)], [{ ocm_id: 1, reason: 'same Petro-Canada, different pin' }]);
    expect(r.kept).toEqual([]);
    expect(r.dropped.skip).toBe(1);
  });

  it('a site with nothing nearby is kept and is no near miss', () => {
    const r = mergeOcm([ocmStation(1, 48)], [afdcStation(10, 45)]);
    expect(r.kept).toHaveLength(1);
    expect(r.nearMisses).toEqual([]);
  });
});

// ---- 6.5 Checks (shared with AFDC)

describe('OCM import checks', () => {
  const file = (n: number) => ({ stations: Array.from({ length: n }, (_, i) => ocmStation(i + 1, 45 + i * 0.01)), dropped: { no_location: 0, no_l2_l3_ports: 0 } });
  it('passes a normal pull and stops on a drop over 10 %', () => {
    expect(checkAfdc(file(100), file(95)).ok).toBe(true);
    const r = checkAfdc(file(100), file(85));
    expect(r.ok).toBe(false);
    expect(r.failures[0]).toMatch(/fell 15/);
  });
  it('stops when many records lack a place or plugs', () => {
    const next = { ...file(100), dropped: { no_location: 5, no_l2_l3_ports: 0 } };
    expect(checkAfdc(null, next).ok).toBe(false);
  });
});
