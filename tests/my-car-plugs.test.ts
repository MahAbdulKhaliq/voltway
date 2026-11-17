// My car's saved plug switches (B55).
import { describe, expect, it } from 'vitest';
import { readMyCar } from '../src/lib/my-car.ts';

describe('readMyCar plugs (B55)', () => {
  const id = 'hyundai/ioniq-5/2026/long-range-awd-xrt';
  it('keeps valid DC plugs once each and drops the rest', () => {
    expect(readMyCar({ carId: id, trimId: null, plugs: ['ccs1', 'nacs', 'ccs1', 'j1772', 'x', 3] })?.plugs).toEqual(['ccs1', 'nacs']);
  });
  it('no plugs saved means the default (absent), and an empty list is kept', () => {
    expect(readMyCar({ carId: id, trimId: null })?.plugs).toBeUndefined();
    expect(readMyCar({ carId: id, trimId: null, plugs: [] })?.plugs).toEqual([]);
  });
});
