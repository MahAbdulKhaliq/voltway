import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildCars } from '../scripts/lib/build.ts';
import { toPlaceRows } from '../scripts/lib/geonames.ts';
import { TRIP } from '../src/config.ts';
import { fold, makePlaceSearch, type PlaceRow } from '../src/lib/place-search.ts';
import { planCarFrom } from '../src/lib/trip-car.ts';
import { apiPoint, readEnd, readSavedTrip, readTripLink, writeTripLink } from '../src/lib/trip-link.ts';
import type { CarDetail } from '../src/lib/types.ts';

// From the committed sources in data/ (public/data/ is build output and absent in CI before the build).
const places = toPlaceRows(JSON.parse(readFileSync('data/imported/geonames/places.json', 'utf8')).places) as PlaceRow[];
const search = makePlaceSearch(places);
const first = (q: string) => search(q)[0]?.label;

describe('place search', () => {
  it('ignores accents and case', () => {
    expect(fold('Montréal')).toBe('montreal');
    expect(first('montreal')).toBe('Montréal, QC');
    expect(first('TROIS RIVIERES')).toBe('Trois-Rivières, QC');
  });
  it('shows the province and puts bigger places first', () => {
    expect(first('Richmond')).toBe('Richmond, BC');
    expect(search('Richmond').map((p) => p.label)).toContain('Richmond, QC');
  });
  it('matches while typing (prefix) and narrows by province', () => {
    expect(first('toro')).toBe('Toronto, ON');
    expect(first('richmond qc')).toBe('Richmond, QC');
    expect(first('whiteh')).toBe('Whitehorse, YT');
  });
  it('returns positions and nothing for an empty query', () => {
    const t = search('Toronto')[0];
    expect(t.lat).toBeCloseTo(43.65, 1);
    expect(t.lon).toBeCloseTo(-79.38, 1);
    expect(search('  ')).toEqual([]);
    expect(search('Toronto', 3).length).toBeLessThanOrEqual(3);
  });
});

describe('trip link', () => {
  const trip = {
    from: { label: 'Toronto, ON', lat: 43.6533, lon: -79.3839 },
    to: { label: 'Montréal, QC', lat: 45.5088, lon: -73.5878 },
    startSoc: 85,
    thresholdSoc: 20,
  };
  it('round-trips through the query string', () => {
    expect(readTripLink('?' + writeTripLink(trip))).toEqual(trip);
  });
  it('accepts a to-only link (Route here) with labels holding commas', () => {
    const t = readTripLink('?to=45.5,-73.6,Station%2C%20Rue%20X')!;
    expect(t.from).toBeNull();
    expect(t.to).toEqual({ label: 'Station, Rue X', lat: 45.5, lon: -73.6 });
    expect(t.startSoc).toBe(TRIP.defaultStartSoc);
    expect(t.thresholdSoc).toBe(TRIP.defaultThresholdSoc);
  });
  it('rejects bad ends and out-of-range or inverted percentages', () => {
    expect(readTripLink('?q=1')).toBeNull();
    expect(readEnd('abc')).toBeNull();
    expect(readEnd('48.85,2.35,Paris')).toBeNull();
    expect(readEnd('45.5,-73.6')!.label).toBe('45.5, -73.6');
    const bad = readTripLink('?to=45.5,-73.6&start=10&min=90')!;
    expect([bad.startSoc, bad.thresholdSoc]).toEqual([TRIP.defaultStartSoc, TRIP.defaultThresholdSoc]);
    const inverted = readTripLink('?to=45.5,-73.6&start=30&min=35')!;
    expect([inverted.startSoc, inverted.thresholdSoc]).toEqual([TRIP.defaultStartSoc, TRIP.defaultThresholdSoc]);
  });
  it('reads a saved trip and ignores junk', () => {
    expect(readSavedTrip(trip)).toEqual(trip);
    expect(readSavedTrip(null)).toBeNull();
    expect(readSavedTrip({ from: 'x' })).toBeNull();
  });
  it('gives the API lon,lat', () => {
    expect(apiPoint(trip.from)).toBe('-79.384,43.653');
  });
});

describe('planCarFrom (every built car)', () => {
  const cars: CarDetail[] = buildCars('.').cars;

  it('plans for most cars; the rest say what is missing', () => {
    const results = cars.map((c) => ({ id: c.id, r: planCarFrom(c) }));
    const failed = results.filter((x) => !x.r.ok);
    expect(results.length).toBeGreaterThan(50);
    expect(failed.length).toBeLessThanOrEqual(20); // 17 on 2026-11-16: missing port, DC peak or usable kWh (data gaps)
    for (const f of failed) expect((f.r as { missing: string[] }).missing.length).toBeGreaterThan(0);
  });
  it('a Tesla is a NACS Tesla with a DC peak', () => {
    const tesla = cars.find((c) => c.make.id === 'tesla')!;
    const r = planCarFrom(tesla);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.car.isTesla).toBe(true);
      expect(r.car.rule.plugs).toContain('nacs');
      expect(r.car.curve.points.length).toBeGreaterThan(1);
    }
  });
});

describe('charging window link (3.12)', () => {
  it('reads from/to, rejects odd values', async () => {
    const { linkWindowFrom } = await import('../src/lib/trip-link.ts');
    const w = (q: string) => linkWindowFrom(new URLSearchParams(q));
    expect(w('from=17.4&to=80')).toEqual({ start: 17, end: 80 });
    expect(w('from=0&to=100')).toEqual({ start: 0, end: 100 });
    expect(w('to=80')).toBeNull();
    expect(w('from=80&to=20')).toBeNull();
    expect(w('from=-5&to=80')).toBeNull();
    expect(w('from=a&to=80')).toBeNull();
  });
  it('the stop link carries car, trim, kW and the window', async () => {
    const { stopCurveHref } = await import('../src/lib/trip-format.ts');
    const href = stopCurveHref({ carId: 'kia/ev6/2026/land-awd', trimId: 't1' }, { usableKw: 239.6, arriveSoc: 17.6, departSoc: 80 });
    const q = new URLSearchParams(href.split('?')[1]);
    expect(href.startsWith('/charging?')).toBe(true);
    expect(Object.fromEntries(q)).toEqual({ car: 'kia/ev6/2026/land-awd', trim: 't1', kw: '240', from: '18', to: '80' });
  });
});

describe('Route here from a station (3.13, B50)', () => {
  it('makes the station a trip end named with its city (once), which a link carries', async () => {
    const { stationEnd, readTripLink, writeTripLink } = await import('../src/lib/trip-link.ts');
    const to = stationEnd({ geometry: { coordinates: [-76.96316, 44.26215] }, properties: { n: 'Napanee, ON - Tesla Supercharger', c: 'Napanee' } });
    expect(to).toEqual({ label: 'Napanee, ON - Tesla Supercharger', lat: 44.26215, lon: -76.96316 });
    const t = readTripLink(`?${writeTripLink({ from: null, to, startSoc: 90, thresholdSoc: 15 })}`)!;
    expect(t.from).toBeNull();
    expect(t.to).toEqual(to);
    expect(stationEnd({ geometry: { coordinates: [-75.3, 44.8] }, properties: { n: 'Iroquois Plaza', c: 'Cornwall' } }).label).toBe('Iroquois Plaza, Cornwall');
  });
});
