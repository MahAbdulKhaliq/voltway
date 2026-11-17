import { describe, expect, it } from 'vitest';
import { splitVariantName } from '../src/lib/variant-name.ts';

describe('splitVariantName (DESIGN-4 4.16)', () => {
  it('splits a regulator letter code off the end', () => {
    expect(splitVariantName('Long Range AWD-B')).toEqual({ plain: 'Long Range AWD', suffix: '-B' });
    expect(splitVariantName('Premium-I')).toEqual({ plain: 'Premium', suffix: '-I' });
    expect(splitVariantName('RWD-B')).toEqual({ plain: 'RWD', suffix: '-B' });
  });
  it('keeps a note after the code with the code', () => {
    expect(splitVariantName('Long Range AWD-B (pre-6/11/25)')).toEqual({ plain: 'Long Range AWD', suffix: '-B (pre-6/11/25)' });
  });
  it('leaves ordinary names whole', () => {
    for (const n of ['Platinum+ e-4ORCE', 'Land AWD GT-Line', 'Extended Range (131 kWh)', 'LT/RS AWD', 'Woodland AWD (All-Terrain Tire)', 'N', 'LYRIQ-V', 'xDrive40']) {
      expect(splitVariantName(n)).toEqual({ plain: n, suffix: '' });
    }
  });
});
