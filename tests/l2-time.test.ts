import { describe, expect, it } from 'vitest';
import { levelTwoTime } from '../src/lib/l2-time.ts';
import type { Field } from '../src/lib/types.ts';

const f = (value: number): Field => ({ value: { value, unit: 'h', kind: 'rated_nrcan', source_id: 'src-x' }, others: [], conflict: false });

describe('levelTwoTime (B104)', () => {
  it('uses the trim’s own rated time first', () => {
    expect(levelTwoTime(f(11.2), f(7), 11.5, 19.2, 'n')?.value.value).toBe(7);
  });
  it('scales the car’s time when the trim has a different charger, marked estimated', () => {
    const r = levelTwoTime(f(11.2), null, 11.5, 19.2, 'basis');
    expect(r?.value).toMatchObject({ value: 6.7, kind: 'estimated', notes: 'basis', source_id: 'src-x' });
    expect(r?.others[0].value).toBe(11.2);
  });
  it('keeps the car’s time for the same charger or unknown chargers', () => {
    expect(levelTwoTime(f(11.2), null, 11.5, 11.5, 'n')?.value.kind).toBe('rated_nrcan');
    expect(levelTwoTime(f(11.2), null, undefined, 19.2, 'n')?.value.kind).toBe('rated_nrcan');
    expect(levelTwoTime(null, null, 11.5, 19.2, 'n')).toBeNull();
  });
});
