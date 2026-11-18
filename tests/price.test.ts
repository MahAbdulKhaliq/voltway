import { describe, expect, it } from 'vitest';
import { chargeCost, chargePrice } from '../src/lib/price';
import { setItem, KEYS } from '../src/lib/storage';
import { COST } from '../src/config';

describe('charging price (B66)', () => {
  it('starts at the typical rate and ignores a bad saved value', () => {
    expect(chargePrice()).toBe(COST.defaultPricePerKwh);
    setItem(KEYS.price, 'abc');
    expect(chargePrice()).toBe(COST.defaultPricePerKwh);
    setItem(KEYS.price, '-1');
    expect(chargePrice()).toBe(COST.defaultPricePerKwh);
    setItem(KEYS.price, '0.6');
    expect(chargePrice()).toBe(0.6);
  });
  it('bills the energy drawn, a little more than the energy added', () => {
    expect(chargeCost(46, 0.5)).toBeCloseTo((46 / COST.dcEfficiency) * 0.5);
    expect(chargeCost(0, 0.5)).toBe(0);
  });
});
