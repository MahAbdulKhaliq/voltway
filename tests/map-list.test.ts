import { describe, expect, it } from 'vitest';
import { defaultFilters } from '../src/lib/map-filter.ts';
import { fastNear, inBounds, LIST_CAP, stationsInView, type Bounds } from '../src/lib/map-list.ts';
import type { MapFeature, MapPort } from '../src/lib/map-data.ts';

const feat = (i: number, at: [number, number], p: MapPort[], c?: string): MapFeature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: at },
  properties: { i, n: `S${i}`, p, src: 'src-afdc-ca', ...(c ? { c } : {}) },
});
const view: Bounds = [-80, 43, -79, 44];
const centre: [number, number] = [-79.5, 43.5];
const f = defaultFilters(); // Level 3 only

describe('inBounds', () => {
  it('includes the edges and excludes outside points', () => {
    expect(inBounds([-80, 43], view)).toBe(true);
    expect(inBounds([-79, 44], view)).toBe(true);
    expect(inBounds([-78.9, 43.5], view)).toBe(false);
    expect(inBounds([-79.5, 44.1], view)).toBe(false);
  });
  it('handles a view across the antimeridian', () => {
    expect(inBounds([179.5, 0], [179, -1, -179, 1])).toBe(true);
    expect(inBounds([0, 0], [179, -1, -179, 1])).toBe(false);
  });
});

describe('stationsInView (charger-map §5, B34)', () => {
  it('keeps only matching stations in view, nearest the centre first', () => {
    const { items, total } = stationsInView(
      [
        feat(1, [-79.9, 43.9], [[3, 'ccs1', 50, 1]]),
        feat(2, [-79.5, 43.51], [[3, 'ccs1', 150, 2]], 'Toronto'),
        feat(3, [-79.6, 43.6], [[2, 'j1772', 7.2, 2]]), // Level 2 is off
        feat(4, [-75, 45], [[3, 'ccs1', 350, 4]]), // outside the view
      ],
      f,
      view,
      centre,
    );
    expect(total).toBe(2);
    expect(items.map((x) => x.i)).toEqual([2, 1]);
    expect(items[0]).toEqual({ i: 2, name: 'S2', city: 'Toronto', level: 3, maxKw: 150, at: [-79.5, 43.51] });
  });

  it('weighs longitude by latitude when sorting', () => {
    // 0.1° of longitude at 43.5° N is ~0.073° of latitude, so the east one is nearer.
    const { items } = stationsInView(
      [feat(1, [-79.5, 43.58], [[3, 'ccs1', 50, 1]]), feat(2, [-79.4, 43.5], [[3, 'ccs1', 50, 1]])],
      f,
      view,
      centre,
    );
    expect(items.map((x) => x.i)).toEqual([2, 1]);
  });

  it('caps the list and reports the full count', () => {
    const many = Array.from({ length: 80 }, (_, k) => feat(k + 1, [-79.5 + k * 0.001, 43.5], [[3, 'ccs1', 50, 1]]));
    const { items, total } = stationsInView(many, f, view, centre);
    expect(items).toHaveLength(LIST_CAP);
    expect(total).toBe(80);
    expect(items[0].i).toBe(1);
  });

  it('shows the level and top power of the matching ports only', () => {
    const mixed = feat(1, centre, [
      [3, 'chademo', 50, 1],
      [3, 'ccs1', 350, 2],
      [2, 'j1772', 7.2, 4],
    ]);
    const noCcs = { ...f, plugs: { ...f.plugs, ccs1: false } };
    expect(stationsInView([mixed], noCcs, view, centre).items[0]).toMatchObject({ level: 3, maxKw: 50 });
    const l2only = { ...f, levels: { 3: false, 2: true } as const };
    expect(stationsInView([mixed], l2only, view, centre).items[0]).toMatchObject({ level: 2, maxKw: 7.2 });
    const unknown = feat(2, centre, [[3, 'nacs', null, 8]]);
    expect(stationsInView([unknown], f, view, centre).items[0].maxKw).toBeNull();
  });
});

describe('fastNear: the "Where to?" place card count (B50, 3.17)', () => {
  // 0.1° of latitude ≈ 11 km; 0.3° ≈ 33 km.
  const at: [number, number] = [-79.5, 43.5];
  const l3: MapPort = [3, 'ccs1', 150, 2];
  const l2: MapPort = [2, 'j1772', 7.2, 2];
  const list = [
    feat(1, [-79.5, 43.6], [l3]),
    feat(2, [-79.5, 43.4], [l3, l2]),
    feat(3, [-79.5, 43.55], [l2]),
    feat(4, [-79.5, 43.8], [l3]),
  ];
  it('counts Level 3 sites within 25 km, ignoring Level 2-only sites and far ones', () => {
    expect(fastNear(list, f, at)).toBe(2);
  });
  it('counts Level 3 even when the Level 3 checkbox is off, and follows the power filter', () => {
    expect(fastNear(list, { ...f, levels: { 3: false, 2: true } }, at)).toBe(2);
    expect(fastNear(list, { ...f, power: { ...f.power, 3: [200, Infinity] } }, at)).toBe(0);
  });
  it('is 0 with nothing near', () => {
    expect(fastNear(list, f, [-100, 60])).toBe(0);
  });
});
