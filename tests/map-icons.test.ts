// At-a-glance map marks (B54): speed tiers, the split of a cluster, and mark names.
import { describe, expect, it } from 'vitest';
import { levelShare, markName, parseMarkName, plugBit, plugsInMask, ringArcs, speedTier, PLUG_ORDER, RING_GAP, TAG_ALWAYS_ZOOM, TAG_MAX_GROUP, TAG_MIN_ZOOM, clusterImage, tagsFit, pinImage, type MarkSpec } from '../src/lib/map-icons.ts';

describe('speedTier', () => {
  it('1 bolt up to 75 kW, 2 up to 150 kW, 3 above; none when unknown', () => {
    expect([null, undefined, 0, NaN].map(speedTier)).toEqual([0, 0, 0, 0]);
    expect([24, 50, 75].map(speedTier)).toEqual([1, 1, 1]);
    expect([75.1, 100, 150].map(speedTier)).toEqual([2, 2, 2]);
    expect([150.1, 250, 350].map(speedTier)).toEqual([3, 3, 3]);
  });
});

describe('levelShare', () => {
  it('is the Level 3 share in tenths, never 0 or 10 for a mix', () => {
    expect(levelShare(5, 0)).toBe(0);
    expect(levelShare(0, 5)).toBe(10);
    expect(levelShare(5, 5)).toBe(5);
    expect(levelShare(1, 3)).toBe(8);
    expect(levelShare(99, 1)).toBe(1);
    expect(levelShare(1, 99)).toBe(9);
  });
});

describe('ringArcs (B55)', () => {
  const top = -Math.PI / 2;
  const span = (a: [number, number] | null) => (a ? a[1] - a[0] : 0);
  it('one level fills the whole ring from 12 o\'clock', () => {
    expect(ringArcs(10)).toEqual({ l3: [top, top + 2 * Math.PI], l2: null });
    expect(ringArcs(0)).toEqual({ l3: null, l2: [top, top + 2 * Math.PI] });
  });
  it('half and half: Level 3 runs from the top to 6 o\'clock, Level 2 the rest, with gaps', () => {
    const a = ringArcs(5);
    expect(a.l3![0]).toBeCloseTo(top + RING_GAP / 2);
    expect(a.l3![1]).toBeCloseTo(Math.PI / 2 - RING_GAP / 2);
    expect(span(a.l3)).toBeCloseTo(span(a.l2));
  });
  it('arcs are in proportion (plus their gaps)', () => {
    const a = ringArcs(8);
    expect((span(a.l3) + RING_GAP) / (span(a.l2) + RING_GAP)).toBeCloseTo(4);
  });
  it('tags show from zoom 14, or from zoom 9 when they fit on screen (B82)', () => {
    expect(TAG_MIN_ZOOM).toBe(9);
    expect(TAG_ALWAYS_ZOOM).toBe(14);
    expect(clusterImage(false, 9)[3]).toBe(9);
    expect(pinImage(false, 9)[3]).toBe(9);
    for (const e of [clusterImage(false), pinImage(true)] as unknown[][]) {
      expect(e[0]).toBe('step');
      expect(e[1]).toEqual(['zoom']);
      expect(e[3]).toBe(14);
      // Zoomed out: the speed tier and plug mask are both 0. Zoomed in: they come from the data.
      expect(JSON.stringify(e[2])).not.toContain('"pc"');
      expect(JSON.stringify(e[4])).toContain('"pc"');
    }
  });
  it('tags fit up to 40 marks on a 1280×800 map, scaled by area, with slack once shown (B82)', () => {
    expect(tagsFit(40, 1280, 800, false)).toBe(true);
    expect(tagsFit(41, 1280, 800, false)).toBe(false);
    expect(tagsFit(48, 1280, 800, true)).toBe(true); // already shown: stays until 48
    expect(tagsFit(49, 1280, 800, true)).toBe(false);
    expect(tagsFit(11, 375, 812, false)).toBe(true); // a phone allows about 11.9
    expect(tagsFit(12, 375, 812, false)).toBe(false);
  });
  it('groups of 50 or more never get tags (B82)', () => {
    expect(TAG_MAX_GROUP).toBe(50);
    const close = clusterImage(false)[4] as unknown[];
    expect(close[0]).toBe('case');
    expect(close[1]).toEqual(['>=', ['get', 'point_count'], 50]);
    expect(JSON.stringify(close[2])).not.toContain('"pc"'); // 50+: plain
    expect(JSON.stringify(close[3])).toContain('"pc"'); // smaller: tagged
  });
});

describe('mark names', () => {
  it('round-trip', () => {
    const m: MarkSpec = { kind: 'cluster', size: 2, share: 7, unavailable: false, tier: 3, plugs: 0b1011, trip: true, tesla: false };
    expect(parseMarkName(markName(m))).toEqual(m);
    const p: MarkSpec = { kind: 'pin', size: 0, share: 10, unavailable: false, tier: 3, plugs: 2, trip: false, tesla: true };
    expect(parseMarkName(markName(p))).toEqual(p);
    expect(parseMarkName(markName(m))).toEqual(m);
    expect(parseMarkName('pin-l3')).toBeNull();
  });
  it('plug mask follows the stack order', () => {
    expect(PLUG_ORDER.map(plugBit)).toEqual([1, 2, 4, 8]);
    expect(plugsInMask(0b1001)).toEqual(['ccs1', 'j1772']);
  });
});
