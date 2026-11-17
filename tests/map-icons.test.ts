// At-a-glance map marks (B54): speed tiers, the split of a cluster, and mark names.
import { describe, expect, it } from 'vitest';
import { levelShare, markName, parseMarkName, plugBit, plugsInMask, ringArcs, speedTier, PLUG_ORDER, RING_GAP, TAG_MAX, type MarkSpec } from '../src/lib/map-icons.ts';

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
  it('tags stop at 20 chargers', () => {
    expect(TAG_MAX).toBe(20);
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
