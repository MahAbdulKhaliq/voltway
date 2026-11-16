import { describe, expect, it } from 'vitest';
import { levelOf, normalizeStations, serializeStationsFile, type RawStation } from '../scripts/lib/afdc.ts';
import { teslaNetwork } from '../src/lib/power-bands.ts';

describe('Tesla networks', () => {
  it('recognises the Tesla networks by AFDC\'s names', () => {
    expect(teslaNetwork('Tesla')).toBe('supercharger');
    expect(teslaNetwork('Tesla Destination')).toBe('destination');
    expect(teslaNetwork('FLO')).toBeNull();
    expect(teslaNetwork(null)).toBeNull();
  });
});

/** A raw AFDC station with sensible defaults; override what the test is about. */
function raw(over: Partial<RawStation> & { units?: RawStation['ev_charging_units'] }): RawStation {
  const { units, ...rest } = over;
  return {
    id: 1,
    station_name: 'Test site',
    street_address: '1 Main St',
    city: 'Ottawa',
    state: 'ON',
    zip: 'K1A 0A1',
    latitude: 45.4,
    longitude: -75.7,
    status_code: 'E',
    expected_date: null,
    access_code: 'public',
    access_detail_code: null,
    access_days_time: '24 hours daily',
    restricted_access: false,
    ev_network: 'FLO',
    ev_pricing: null,
    ev_pricing_fr: null,
    updated_at: '2026-04-02T20:03:43Z',
    date_last_confirmed: '2026-02-13',
    ev_charging_units: units ?? [{ charging_level: '2', connectors: { J1772: { power_kw: 7.2, port_count: 2 } } }],
    ...rest,
  };
}

const zeroSlots = { TESLA: { power_kw: null, port_count: 0 }, CHADEMO: { power_kw: null, port_count: 0 } };

describe('levelOf', () => {
  it('maps the source classification, not power', () => {
    expect(levelOf('2')).toBe(2);
    expect(levelOf('dc_fast')).toBe(3);
    expect(levelOf('1')).toBeNull();
    expect(levelOf(null)).toBeNull();
  });
});

describe('normalizeStations', () => {
  it('keeps a public available station with its ports and facts', () => {
    const { stations, dropped } = normalizeStations([raw({ ev_pricing: ' Free ', ev_pricing_fr: 'Gratuit' })]);
    expect(dropped).toEqual({ private: 0, planned: 0, no_location: 0, no_l2_l3_ports: 0 });
    expect(stations).toHaveLength(1);
    const s = stations[0];
    expect(s).toMatchObject({ id: 1, name: 'Test site', province: 'ON', status: 'E', pricing: 'Free', pricing_fr: 'Gratuit' });
    expect(s.updated).toBe('2026-04-02');
    expect(s.ports).toEqual([{ level: 2, plug: 'j1772', kw: 7.2, count: 2 }]);
  });

  it('drops private, planned, location-less and Level 1-only stations, counting each reason', () => {
    const { stations, dropped } = normalizeStations([
      raw({ id: 1, access_code: 'private' }),
      raw({ id: 2, status_code: 'P' }),
      raw({ id: 3, latitude: null }),
      raw({ id: 4, units: [{ charging_level: '1', connectors: { NEMA515: { power_kw: 1.4, port_count: 1 } } }] }),
      raw({ id: 5 }),
    ]);
    expect(stations.map((s) => s.id)).toEqual([5]);
    expect(dropped).toEqual({ private: 1, planned: 1, no_location: 1, no_l2_l3_ports: 1 });
  });

  it('keeps temporarily unavailable stations with their expected date', () => {
    const { stations } = normalizeStations([raw({ status_code: 'T', expected_date: '2026-12-01' })]);
    expect(stations[0]).toMatchObject({ status: 'T', expected_date: '2026-12-01' });
  });

  it('ignores connector slots with 0 ports (AFDC lists every type on every unit)', () => {
    const { stations } = normalizeStations([
      raw({ units: [{ charging_level: 'dc_fast', connectors: { J1772COMBO: { power_kw: 150, port_count: 2 }, ...zeroSlots } }] }),
    ]);
    expect(stations[0].ports).toEqual([{ level: 3, plug: 'ccs1', kw: 150, count: 2 }]);
  });

  it('maps all four plugs and keeps level from the unit, even for a 20 kW DC unit', () => {
    const { stations } = normalizeStations([
      raw({
        units: [
          { charging_level: 'dc_fast', connectors: { J1772COMBO: { power_kw: 20, port_count: 1 }, CHADEMO: { power_kw: 20, port_count: 1 } } },
          { charging_level: 'dc_fast', connectors: { TESLA: { power_kw: 250, port_count: 8 } } },
          { charging_level: '2', connectors: { J1772: { power_kw: null, port_count: 4 } } },
        ],
      }),
    ]);
    expect(stations[0].ports).toEqual([
      { level: 3, plug: 'ccs1', kw: 20, count: 1 },
      { level: 3, plug: 'chademo', kw: 20, count: 1 },
      { level: 3, plug: 'nacs', kw: 250, count: 8 },
      { level: 2, plug: 'j1772', kw: null, count: 4 },
    ]);
  });

  it('merges identical plug/power lines across charging units', () => {
    const unit = { charging_level: 'dc_fast', connectors: { J1772COMBO: { power_kw: 180, port_count: 1 } } };
    const { stations } = normalizeStations([raw({ units: [unit, unit, unit] })]);
    expect(stations[0].ports).toEqual([{ level: 3, plug: 'ccs1', kw: 180, count: 3 }]);
  });

  it('treats 0 or missing kW as unknown (null)', () => {
    const { stations } = normalizeStations([
      raw({ units: [{ charging_level: '2', connectors: { J1772: { power_kw: 0, port_count: 1 } } }] }),
    ]);
    expect(stations[0].ports[0].kw).toBeNull();
  });

  it('counts L2/L3 ports with a connector type outside the four plugs, and ignores them', () => {
    const { stations, ignored_ports } = normalizeStations([
      raw({ units: [{ charging_level: '2', connectors: { NEMA1450: { power_kw: 9.6, port_count: 1 }, J1772: { power_kw: 7.2, port_count: 1 } } }] }),
    ]);
    expect(ignored_ports).toEqual({ NEMA1450: 1 });
    expect(stations[0].ports).toEqual([{ level: 2, plug: 'j1772', kw: 7.2, count: 1 }]);
  });

  it('carries the access flags for the popup warning', () => {
    const { stations } = normalizeStations([
      raw({ restricted_access: true, access_detail_code: 'CALL', access_days_time: 'Mon-Fri 8am-5pm' }),
    ]);
    expect(stations[0]).toMatchObject({ restricted: true, access_detail: 'CALL', hours: 'Mon-Fri 8am-5pm' });
  });

  it('keeps the Tesla network names as given', () => {
    const { stations } = normalizeStations([
      raw({ id: 1, ev_network: 'Tesla', units: [{ charging_level: 'dc_fast', connectors: { TESLA: { power_kw: 250, port_count: 12 } } }] }),
      raw({ id: 2, ev_network: 'Tesla Destination', units: [{ charging_level: '2', connectors: { TESLA: { power_kw: 11.5, port_count: 2 } } }] }),
    ]);
    expect(stations.map((s) => teslaNetwork(s.network))).toEqual(['supercharger', 'destination']);
  });

  it('sorts stations by id and names an unnamed station by its id', () => {
    const { stations } = normalizeStations([raw({ id: 9, station_name: '  ' }), raw({ id: 3 })]);
    expect(stations.map((s) => s.id)).toEqual([3, 9]);
    expect(stations[1].name).toBe('#9');
  });
});

describe('serializeStationsFile', () => {
  it('writes valid JSON with one station per line', () => {
    const { stations, dropped, ignored_ports } = normalizeStations([raw({ id: 1 }), raw({ id: 2 })]);
    const text = serializeStationsFile({
      source: 'afdc-ca',
      source_id: 'src-afdc-ca',
      fetched_at: '2026-11-16T09:36:25.408Z',
      raw_sha256: 'a'.repeat(64),
      raw_count: 2,
      dropped,
      ignored_ports,
      stations,
    });
    const back = JSON.parse(text);
    expect(back.stations).toEqual(stations);
    const lines = text.split('\n').filter((l) => l.trimStart().startsWith('{"id"'));
    expect(lines).toHaveLength(2);
  });
});
