// "Outside Canada" check (B74, DESIGN-5 §2.3, 5.1): the committed outline and the point test.
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeInCanada, type Outline } from '../src/lib/canada.ts';
import { simplifyLine, simplifyRing } from '../scripts/lib/outline.ts';

const file = join(process.cwd(), 'data', 'imported', 'naturalearth', 'canada.json');
const data = JSON.parse(readFileSync(file, 'utf8')) as { source_id: string; url: string; sha256: string; polygons: Outline; border: string[][] };
const inCanada = makeInCanada(data.polygons, data.border);

describe('inCanada (committed outline)', () => {
  const yes: [string, number, number][] = [
    ['Toronto', -79.3832, 43.6532],
    ['Windsor, riverside', -83.0405, 42.3195],
    ['Windsor, south end', -82.995, 42.255],
    ['Sarnia', -82.4066, 42.9745],
    ['Niagara Falls ON', -79.0849, 43.0896],
    ['Montréal', -73.5673, 45.5017],
    ['Stanstead QC (on the line)', -72.0996, 45.0072],
    ['Vancouver', -123.1207, 49.2827],
    ['White Rock BC', -122.8027, 49.0253],
    ['Victoria', -123.3656, 48.4284],
    ['Tofino', -125.9066, 49.1530],
    ['Prince Rupert', -130.3208, 54.3150],
    ['Halifax', -63.5752, 44.6488],
    ['Charlottetown', -63.1311, 46.2382],
    ["St. John's", -52.7126, 47.5615],
    ['Grand Manan', -66.82, 44.7],
    ['Pelee Island', -82.65, 41.77],
    ['Whitehorse', -135.0568, 60.7212],
    ['Yellowknife', -114.3718, 62.4540],
    ['Iqaluit', -68.5170, 63.7467],
    ['Inuvik', -133.7231, 68.3607],
    ['Campobello Island', -66.95, 44.88],
  ];
  const no: [string, number, number][] = [
    ['Detroit, midtown', -83.0646, 42.3486],
    ['Buffalo', -78.8784, 42.8864],
    ['Seattle', -122.3321, 47.6062],
    ['Blaine WA, 3 km south', -122.75, 48.97],
    ['Point Roberts', -123.06, 48.98],
    ['Bellingham', -122.4787, 48.7519],
    ['Plattsburgh', -73.4529, 44.6995],
    ['Calais ME, 1.5 km from the river', -67.265, 45.17],
    ['Juneau', -134.4197, 58.3019],
    ['Skagway', -135.3141, 59.4583],
    ['Anchorage', -149.9003, 61.2181],
    ['Fairbanks', -147.7164, 64.8378],
    ['Saint-Pierre', -56.1773, 46.7811],
    ['New York', -74.006, 40.7128],
  ];
  it.each(yes)('%s is in Canada', (_, lon, lat) => expect(inCanada(lon, lat)).toBe(true));
  it.each(no)('%s is outside Canada', (_, lon, lat) => expect(inCanada(lon, lat)).toBe(false));
  it('counts a point 300 m south of the 49th parallel as in (border slack)', () => {
    expect(inCanada(-97.5, 48.9973)).toBe(true);
    expect(inCanada(-97.5, 48.98)).toBe(false); // ~2 km south
  });
  it('rejects bad numbers', () => {
    expect(inCanada(NaN, 45)).toBe(false);
    expect(inCanada(-75, Infinity)).toBe(false);
  });
});

describe('outline file', () => {
  it('records its source and stays small', () => {
    expect(data.source_id).toBe('src-naturalearth');
    expect(data.url).toMatch(/natural-earth-vector/);
    expect(data.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(statSync(file).size).toBeLessThan(500_000);
  });
});

describe('simplifier', () => {
  it('drops points within the tolerance and keeps ends', () => {
    expect(simplifyLine([[0, 0], [1, 0.0001], [2, 0]], 0.001)).toEqual([[0, 0], [2, 0]]);
    expect(simplifyLine([[0, 0], [1, 0.5], [2, 0]], 0.001)).toEqual([[0, 0], [1, 0.5], [2, 0]]);
  });
  it('keeps border points finer than the coast', () => {
    // A square whose bottom edge (y = 0) is "border" with a 50 m wiggle, the rest coast with a 50 m wiggle.
    const ring: [number, number][] = [[0, 0], [0.5, 0.0005], [1, 0], [1, 0.5], [1.0005, 0.75], [1, 1], [0, 1], [0, 0]];
    const out = simplifyRing(ring, ([, y]) => y < 0.01);
    expect(out).toContainEqual([0.5, 0.0005]);
    expect(out).not.toContainEqual([1.0005, 0.75]);
    expect(out[0]).toEqual(out[out.length - 1]);
  });
});
