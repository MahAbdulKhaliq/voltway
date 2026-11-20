import { describe, expect, it } from 'vitest';
import { chargeCost, chargePrice, costPer10Min, costPer100, money } from '../src/lib/price';
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

describe('Compare costs (B119)', () => {
  it('costs 10 minutes at the window average rate', () => {
    // 46 kWh in 23 min = 20 kWh per 10 min
    expect(costPer10Min(46, 23, 0.5)).toBeCloseTo((20 / COST.dcEfficiency) * 0.5);
    expect(costPer10Min(46, 0, 0.5)).toBeNull();
  });
  it('costs 100 km or 100 mi of driving, losses included', () => {
    // 180 Wh/km → 18 kWh per 100 km
    expect(costPer100(180, 0.5, 'km')).toBeCloseTo((18 / COST.dcEfficiency) * 0.5);
    expect(costPer100(180, 0.5, 'mi')).toBeCloseTo((18 * 1.609344 / COST.dcEfficiency) * 0.5);
  });
});

describe('money (B99)', () => {
  it('reads as plain $, with no currency code or country', () => {
    expect(money.format(34.236)).toBe('$34.24');
    expect(money.format(1234.5)).toBe('$1,234.50');
  });
});
