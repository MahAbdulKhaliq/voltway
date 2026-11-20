import { describe, expect, it } from 'vitest';
import { missingRequired, REQUIRED_FIELDS } from '../scripts/lib/required-fields.ts';

const full = Object.fromEntries(REQUIRED_FIELDS.map((k) => [k, { value: { value: k === 'dc_max_kw' ? 150 : 'x' } }]));
describe('missingRequired (B96)', () => {
  it('passes a car with every required figure', () => {
    expect(missingRequired({ id: 'a', fields: full })).toEqual([]);
  });
  it('lists absent, null and "unknown" figures', () => {
    const fields = { ...full, dc_max_kw: { value: null }, charge_port: { value: { value: 'unknown' } } } as any;
    delete fields.chemistry;
    expect(missingRequired({ id: 'a', fields })).toEqual(['chemistry', 'dc_max_kw', 'charge_port']);
  });
});
