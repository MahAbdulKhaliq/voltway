// Land check (owner decision 2026-11-18, US data audit F2).
import { describe, expect, it } from 'vitest';
import { dropOffLand, makeOnLand } from '../scripts/lib/land-check.ts';

describe('land check', () => {
  const onLand = makeOnLand(process.cwd());
  it('keeps stations in their own country, including coastal ones', () => {
    expect(onLand('ca', -79.38, 43.65)).toBe(true); // Toronto
    expect(onLand('ca', -123.12, 49.29)).toBe(true); // Vancouver waterfront
    expect(onLand('us', -118.24, 34.05)).toBe(true); // Los Angeles
    expect(onLand('us', -122.42, 37.81)).toBe(true); // San Francisco waterfront
    expect(onLand('us', -157.86, 21.31)).toBe(true); // Honolulu
  });
  it('drops a US station plotted in Alberta, a Canadian one in Montreal filed as US, and points at sea', () => {
    expect(onLand('us', -117.95874, 55.243333)).toBe(false);
    expect(onLand('us', -73.555, 45.5043)).toBe(false);
    expect(onLand('us', -122.8586, 37.7729)).toBe(false);
    expect(onLand('ca', -60, 40)).toBe(false);
  });
  it('counts the dropped ones as no_location', () => {
    const dropped = { no_location: 1 };
    const kept = dropOffLand([{ lat: 43.65, lon: -79.38 }, { lat: 40, lon: -60 }], 'ca', onLand, dropped);
    expect(kept).toHaveLength(1);
    expect(dropped.no_location).toBe(2);
  });
});
