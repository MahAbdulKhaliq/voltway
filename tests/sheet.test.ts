import { describe, expect, it } from 'vitest';
import { nextSnap, sheetHeights, snapAfterDrag, stepSnap, SHEET_PEEK } from '../src/lib/sheet.ts';

describe('map bottom sheet (B59)', () => {
  const h = sheetHeights(812);

  it('has three rising heights under the pill', () => {
    expect(h.peek).toBe(SHEET_PEEK);
    expect(h.half).toBe(406);
    expect(h.full).toBe(812 - 72);
    for (const short of [300, 420, 500]) {
      const s = sheetHeights(short);
      expect(s.peek).toBeLessThan(s.half);
      expect(s.half).toBeLessThan(s.full);
    }
  });

  it('lands on the nearest height after a drag', () => {
    expect(snapAfterDrag(h, 'peek', 700)).toBe('full');
    expect(snapAfterDrag(h, 'full', 150)).toBe('peek');
    expect(snapAfterDrag(h, 'half', 420)).toBe('half');
  });

  it('a flick moves one step even when it ends nearer the start', () => {
    expect(snapAfterDrag(h, 'half', 406 + 60)).toBe('full');
    expect(snapAfterDrag(h, 'half', 406 - 60)).toBe('peek');
    expect(snapAfterDrag(h, 'peek', SHEET_PEEK - 80)).toBe('peek');
    expect(snapAfterDrag(h, 'full', h.full + 80)).toBe('full');
  });

  it('a tap steps up and wraps; arrows stop at the ends', () => {
    expect(nextSnap('peek')).toBe('half');
    expect(nextSnap('half')).toBe('full');
    expect(nextSnap('full')).toBe('peek');
    expect(stepSnap('full', 1)).toBe('full');
    expect(stepSnap('peek', -1)).toBe('peek');
    expect(stepSnap('half', -1)).toBe('peek');
  });
});
