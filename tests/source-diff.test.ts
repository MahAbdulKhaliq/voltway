import { describe, expect, it } from 'vitest';
import { describeDiff, diffNrcan, diffOpenEv } from '../scripts/lib/source-diff.ts';

const HEADER = 'Model year,Make,Model,Vehicle class,Motor (kW),City (kWh/100 km),Highway (kWh/100 km),Combined (kWh/100 km),Range (km),Recharge time (h)';
const row = (model: string, range: number) => `2026,Kia,${model},SUV: Standard,160,17.0,20.0,18.4,${range},7`;

describe('diffNrcan', () => {
  const before = [HEADER, row('EV9 Light', 370), row('EV9 Wind', 491)].join('\n');
  it('reports nothing for identical editions', () => {
    expect(diffNrcan(before, before)).toEqual({ added: [], removed: [], changed: [] });
  });
  it('lists new, removed and changed rows by year · make · model', () => {
    const after = [HEADER, row('EV9 Wind', 480), row('EV3 Wind', 450)].join('\n');
    expect(diffNrcan(before, after)).toEqual({
      added: ['2026 · Kia · EV3 Wind'],
      removed: ['2026 · Kia · EV9 Light'],
      changed: ['2026 · Kia · EV9 Wind'],
    });
  });
  it('treats a first copy as all new', () => {
    expect(diffNrcan(null, before).added).toHaveLength(2);
  });
});

describe('diffOpenEv', () => {
  const v = (model: string, markets: string[], kwh = 77) => ({ year: 2026, make: { name: 'Kia' }, model: { name: model }, trim: { name: 'Base' }, markets, battery: { kwh } });
  const json = (...vs: unknown[]) => JSON.stringify({ vehicles: vs });
  it('only looks at North American vehicles by default', () => {
    const d = diffOpenEv(json(v('EV9', ['US'])), json(v('EV9', ['US']), v('EV5', ['CN'])));
    expect(d).toEqual({ added: [], removed: [], changed: [] });
    expect(diffOpenEv(json(), json(v('EV5', ['CN'])), false).added).toEqual(['2026 Kia EV5 Base']);
  });
  it('lists changed vehicles', () => {
    expect(diffOpenEv(json(v('EV9', ['CA'])), json(v('EV9', ['CA'], 99.8))).changed).toEqual(['2026 Kia EV9 Base']);
  });
});

describe('describeDiff', () => {
  it('cuts long lists and says when only metadata changed', () => {
    const many = Array.from({ length: 5 }, (_, i) => `car ${i}`);
    const md = describeDiff('NRCan', { added: many, removed: [], changed: [] }, 2);
    expect(md).toContain('**New (5)**');
    expect(md).toContain('…and 3 more');
    expect(describeDiff('NRCan', { added: [], removed: [], changed: [] })).toContain('no rows did');
  });
});
