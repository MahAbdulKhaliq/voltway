import { describe, expect, it } from 'vitest';
import { addRecent, readRecent, RECENT_MAX } from '../src/lib/recent-destinations.ts';

const ottawa = { label: 'Ottawa, ON', lat: 45.4215, lon: -75.6972 };
const montreal = { label: 'Montréal, QC', lat: 45.5019, lon: -73.5674 };

describe('previous destinations (B62)', () => {
  it('puts the newest first without repeats', () => {
    const l = addRecent(addRecent(addRecent([], ottawa), montreal), ottawa);
    expect(l.map((e) => e.label)).toEqual(['Ottawa, ON', 'Montréal, QC']);
  });

  it(`keeps at most ${RECENT_MAX}`, () => {
    let l: typeof ottawa[] = [];
    for (let i = 0; i < 8; i++) l = addRecent(l, { label: `Place ${i}`, lat: 45 + i / 10, lon: -75 });
    expect(l).toHaveLength(RECENT_MAX);
    expect(l[0].label).toBe('Place 7');
  });

  it('drops anything odd from storage', () => {
    expect(readRecent(null)).toEqual([]);
    expect(readRecent([ottawa, { label: 3 }, 'x', { label: 'Far', lat: 10, lon: 10 }, ottawa])).toEqual([ottawa]);
  });
});
