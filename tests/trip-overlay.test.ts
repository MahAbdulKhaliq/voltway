import { describe, expect, it } from 'vitest';
import { boundsOf, diamondImage, pointFC } from '../src/lib/trip-overlay.ts';
import { pct, stopsText } from '../src/lib/trip-format.ts';

describe('route overlay on the charger map (B50, 3.18)', () => {
  it('numbers the stops 1, 2, … after the start and end points', () => {
    const fc = pointFC({ line: [], gaps: [], from: [-79, 43], to: [-73, 45], stops: [[-77, 44], [-75, 44.5]], selected: null });
    expect(fc.features.map((f) => f.properties!.kind)).toEqual(['from', 'to', 'stop', 'stop']);
    expect(fc.features.slice(2).map((f) => f.properties!.label)).toEqual(['1', '2']);
    expect(fc.features.slice(2).map((f) => f.properties!.i)).toEqual([0, 1]);
  });
  it('B89: border crossings follow the stops as diamonds, numbered by their order', () => {
    const fc = pointFC({ line: [], gaps: [], from: [-79, 43], to: [-83, 42.3], stops: [[-81, 43]], borders: [[-82.4, 42.97]], selected: null });
    expect(fc.features.map((f) => f.properties!.kind)).toEqual(['from', 'to', 'stop', 'border']);
    expect(fc.features[3].properties!.i).toBe(0);
    expect(fc.features[3].geometry.coordinates).toEqual([-82.4, 42.97]);
  });
  it('B89: the diamond image is filled in the middle, edged, and clear in the corners', () => {
    const img = diamondImage(36);
    const px = (x: number, y: number) => [...img.data.slice((y * 36 + x) * 4, (y * 36 + x) * 4 + 4)];
    expect(px(18, 18)).toEqual([0xf5, 0xf3, 0xec, 255]);
    expect(px(18, 2).slice(0, 3)).toEqual([0x1a, 0x1b, 0x1e]);
    expect(px(0, 0)[3]).toBe(0);
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
