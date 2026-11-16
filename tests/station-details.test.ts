import { describe, expect, it } from 'vitest';
import {
  accessDetail,
  accessWarning,
  addressLine,
  directionsUrls,
  formatKw,
  localDate,
  sortedPorts,
  stationLevel,
  stationStatus,
  teslaNote,
} from '../src/lib/station-details.ts';

describe('station level and ports (charger-map §5)', () => {
  it('a site with any Level 3 port is Level 3', () => {
    expect(stationLevel([[2, 'j1772', 7.2, 2], [3, 'ccs1', 50, 1]])).toBe(3);
    expect(stationLevel([[2, 'j1772', 7.2, 2]])).toBe(2);
  });
  it('sorts fastest first, unknown power last within a level', () => {
    expect(
      sortedPorts([
        [2, 'j1772', 7.2, 2],
        [3, 'chademo', 50, 1],
        [3, 'nacs', null, 4],
        [3, 'ccs1', 180, 2],
      ]),
    ).toEqual([
      [3, 'ccs1', 180, 2],
      [3, 'chademo', 50, 1],
      [3, 'nacs', null, 4],
      [2, 'j1772', 7.2, 2],
    ]);
  });
  it('formats kW with at most one decimal; null stays unknown', () => {
    expect(formatKw(180)).toBe('180');
    expect(formatKw(7.2)).toBe('7.2');
    expect(formatKw(6.656)).toBe('6.7');
    expect(formatKw(null)).toBeNull();
  });
});

describe('access and Tesla notes (§5, §7)', () => {
  it('known access codes are explained, others ignored', () => {
    expect(accessDetail('CALL')).toBe('CALL');
    expect(accessDetail('LIMITED_HOURS')).toBe('LIMITED_HOURS');
    expect(accessDetail('SOMETHING_NEW')).toBeNull();
    expect(accessDetail(undefined)).toBeNull();
  });
  it('warns for restricted sites and for open sites with limited hours or call ahead', () => {
    expect(accessWarning({ rs: 1 })).toBe(true);
    expect(accessWarning({ ad: 'LIMITED_HOURS' })).toBe(true);
    expect(accessWarning({ ad: 'CALL' })).toBe(true);
    expect(accessWarning({ ad: 'CREDIT_CARD_ALWAYS' })).toBe(false);
    expect(accessWarning({})).toBe(false);
  });
  it('Supercharger vs Destination', () => {
    expect(teslaNote('Tesla')).toBe('supercharger');
    expect(teslaNote('Tesla Destination')).toBe('destination');
    expect(teslaNote('FLO')).toBeNull();
    expect(teslaNote(undefined)).toBeNull();
  });
});

describe('status (§6): expected date only if still ahead', () => {
  const today = '2026-11-16';
  it('available', () => {
    expect(stationStatus({}, today)).toEqual({ unavailable: false });
  });
  it('future date is shown', () => {
    expect(stationStatus({ t: 1, ed: '2026-12-01' }, today)).toEqual({ unavailable: true, until: '2026-12-01' });
  });
  it('past or today’s date is dropped', () => {
    expect(stationStatus({ t: 1, ed: '2026-07-01' }, today)).toEqual({ unavailable: true, until: null });
    expect(stationStatus({ t: 1, ed: today }, today)).toEqual({ unavailable: true, until: null });
  });
  it('no date given', () => {
    expect(stationStatus({ t: 1 }, today)).toEqual({ unavailable: true, until: null });
  });
  it('localDate pads month and day', () => {
    expect(localDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('address and directions', () => {
  it('joins the parts that exist', () => {
    expect(addressLine({ a: '1 Main St', c: 'Ottawa', r: 'ON', z: 'K1A 0A1' })).toBe('1 Main St, Ottawa, ON K1A 0A1');
    expect(addressLine({ c: 'Ottawa', r: 'ON' })).toBe('Ottawa, ON');
    expect(addressLine({})).toBe('');
  });
  it('Google and Apple links use lat,lon', () => {
    expect(directionsUrls([-75.7, 45.42])).toEqual({
      google: 'https://www.google.com/maps/dir/?api=1&destination=45.42,-75.7',
      apple: 'https://maps.apple.com/?daddr=45.42,-75.7',
    });
  });
});
