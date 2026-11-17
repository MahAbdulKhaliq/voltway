import { describe, expect, it } from 'vitest';
import { boundsOf, pointFC } from '../src/lib/trip-overlay.ts';
import { pct, stopsText } from '../src/lib/trip-format.ts';

describe('route overlay on the charger map (B50, 3.18)', () => {
  it('numbers the stops 1, 2, … after the start and end points', () => {
    const fc = pointFC({ line: [], gaps: [], from: [-79, 43], to: [-73, 45], stops: [[-77, 44], [-75, 44.5]], selected: null });
    expect(fc.features.map((f) => f.properties!.kind)).toEqual(['from', 'to', 'stop', 'stop']);
    expect(fc.features.slice(2).map((f) => f.properties!.label)).toEqual(['1', '2']);
    expect(fc.features.slice(2).map((f) => f.properties!.i)).toEqual([0, 1]);
  });
  it('has no points with no route', () => {
    expect(pointFC(null).features).toHaveLength(0);
  });
  it('bounds a line west, south, east, north', () => {
    expect(boundsOf([[-79, 43], [-73, 45.5], [-75, 44]])).toEqual([-79, 43, -73, 45.5]);
  });
});

describe('itinerary formatting', () => {
  it('"1 stop" / "2 stops"', () => {
    expect(stopsText(1)).toBe('1 stop');
    expect(stopsText(2)).toBe('2 stops');
  });
  it('a percent never reads below 0', () => {
    expect(pct(-6.8)).toBe('0');
    expect(pct(22.6)).toBe('23');
  });
});
