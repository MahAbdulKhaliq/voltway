// B79 (DESIGN-8 B2): border crossings as itinerary rows, and the town named on the far side.
import { describe, expect, it } from 'vitest';
import { borderRows, rowsOnLeg } from '../src/lib/border-rows.ts';
import { buildRoute } from '../src/lib/route-geo.ts';
import { makePlaceSearch, NEAR_PLACE_KM, type PlaceRow } from '../src/lib/place-search.ts';

const row = (n: string, p: string, lat: number, lon: number, pop = 10000): PlaceRow => ({ n, p, lat, lon, pop });
const places = makePlaceSearch(
  [row('Sarnia', 'ON', 42.97, -82.4), row('Windsor', 'ON', 42.3, -83.03)],
  [{ cc: 'us', rows: [row('Port Huron', 'MI', 42.97, -82.42), row('Detroit', 'MI', 42.33, -83.05)] }],
);

describe('placeNear (B79)', () => {
  it('names the nearest town in the country asked for', () => {
    expect(places.placeNear(42.96, -82.41, 'us')).toBe('Port Huron, MI');
    expect(places.placeNear(42.96, -82.41, 'ca')).toBe('Sarnia, ON');
  });
  it(`is null when the nearest town is more than ${NEAR_PLACE_KM} km away`, () => {
    expect(places.placeNear(45.5, -80, 'us')).toBeNull();
  });
});

describe('borderRows and rowsOnLeg (B79)', () => {
  // A straight 0.1° steps line west from Sarnia; crossing into the US at point 1.
  const route = buildRoute([[-82.3, 42.97], [-82.42, 42.97], [-82.6, 42.97], [-83.0, 42.97], [-83.4, 42.97]]);
  it('places each crossing by its distance along the route, with the town on the far side', () => {
    const rows = borderRows([{ i: 3, to: 'ca' }, { i: 1, to: 'us' }], route, places);
    expect(rows.map((r) => r.to)).toEqual(['us', 'ca']);
    expect(rows[0].alongKm).toBeCloseTo(route.cumKm[1]);
    expect(rows[0].place).toBe('Port Huron, MI');
  });
  it('says just the country while the places load, and skips a bad index', () => {
    expect(borderRows([{ i: 1, to: 'us' }, { i: 99, to: 'ca' }], route, null)).toEqual([{ alongKm: route.cumKm[1], to: 'us', place: null }]);
    expect(borderRows(undefined, route, places)).toEqual([]);
  });
  it('puts each row on the leg it falls on', () => {
    const rows = [{ alongKm: 10, to: 'us' as const, place: null }, { alongKm: 300, to: 'ca' as const, place: null }];
    const stopKms = [120, 250];
    expect(rowsOnLeg(rows, stopKms, 0).map((r) => r.alongKm)).toEqual([10]);
    expect(rowsOnLeg(rows, stopKms, 1)).toEqual([]);
    expect(rowsOnLeg(rows, stopKms, 2).map((r) => r.alongKm)).toEqual([300]);
    expect(rowsOnLeg(rows, [], 0).length).toBe(2);
  });
});
