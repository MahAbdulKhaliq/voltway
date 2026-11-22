import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import { display, valueLabel } from '../src/lib/format.ts';
import { getItem, getJSON, setItem, setJSON } from '../src/lib/storage.ts';
import { formatNumber, kmTo, whPerKmToDisplay } from '../src/lib/units.ts';

describe('units', () => {
  it('converts km to miles and Wh/km to kWh/100 km or kWh/100 mi', () => {
    expect(kmTo(160.9344, 'mi')).toBeCloseTo(100, 6);
    expect(kmTo(100, 'km')).toBe(100);
    expect(whPerKmToDisplay(186, 'km')).toBeCloseTo(18.6, 10);
    expect(whPerKmToDisplay(186, 'mi')).toBeCloseTo(29.93, 2);
  });
  it('formats numbers for Canada', () => {
    expect(formatNumber(1234.5, 1)).toBe('1,234.5');
  });
});

describe('storage without a browser', () => {
  it('falls back to memory instead of throwing', () => {
    setItem('k', 'v');
    expect(getItem('k')).toBe('v');
    setJSON('j', { a: 1 });
    expect(getJSON('j', null)).toEqual({ a: 1 });
    expect(getJSON('missing', 42)).toBe(42);
  });
});

describe('format', () => {
  it('renders km with a data attribute for the units switch', () => {
    expect(display({ value: 463, unit: 'km', kind: 'rated_nrcan', source_id: 's' })).toEqual({ text: '463 km', attrs: { 'data-km': '463' } });
  });
  it('shows efficiency as kWh/100 km', () => {
    expect(display({ value: 186, unit: 'Wh/km', kind: 'rated_nrcan', source_id: 's' }).text).toBe('18.6 kWh/100 km');
  });
  it('labels enum values through the dictionary', () => {
    expect(valueLabel('nacs')).toBe('NACS (Tesla)');
    expect(valueLabel('standard_or_optional')).toBe('Standard or optional');
  });
});

describe('dictionary', () => {
  it('has a label for every kind and every enum value the data uses', () => {
    const keys = new Set(Object.keys(en));
    for (const k of ['rated_nrcan', 'rated_epa', 'rated_wltp', 'manufacturer', 'tested', 'community', 'estimated']) expect(keys.has(`kind.${k}`)).toBe(true);
    for (const v of ['nacs', 'ccs1', 'chademo', 'j1772', 'nmc', 'nca', 'lfp', 'lmfp', 'other', '400v', '800v', 'standard', 'optional', 'none', 'standard_or_optional', 'yes', 'no', 'via_adapter', 'automatic_with_navigation', 'manual_only', 'automatic_and_manual', 'fwd', 'rwd', 'awd', 'unknown']) {
      expect(keys.has(`value.${v}`), `value.${v}`).toBe(true);
    }
  });
});

describe('runtime-built dictionary keys (QA 9.1)', () => {
  it('has every key the viewer builds at runtime', () => {
    const keys = new Set(Object.keys(en));
    for (const k of ['preconditioned', 'battery_temp_c', 'ambient_temp_c', 'charger_kw', 'charger_max_voltage_v', 'measured_at']) expect(keys.has(`condition.${k}`), k).toBe(true);
    for (const v of ['yes', 'no', 'unknown', 'charger', 'battery']) expect(keys.has(`condition.value.${v}`), v).toBe(true);
    for (const k of ['tested', 'community', 'manufacturer', 'estimated', 'borrowed']) expect(keys.has(`viewer.option.${k}`), k).toBe(true);
    for (const k of ['highway', 'combined', 'city']) expect(keys.has(`viewer.basis.${k}`), k).toBe(true);
    for (const k of ['soc', 'time']) expect(keys.has(`viewer.axis.${k}`), k).toBe(true);
    for (const k of ['400v-nmc', '800v-nmc', 'lfp', 'tesla']) expect(keys.has(`curve.template.${k}`), k).toBe(true);
  });
});

describe('trim labels in the Charging dropdown', async () => {
  const { trimLabel } = await import('../src/components/CarExplorer.tsx');
  it('drops the repeated variant name', () => {
    expect(trimLabel('eDrive40 Gran Coupe (18" Wheels)', 'eDrive40 Gran Coupe')).toBe('18" Wheels');
    expect(trimLabel('Long Range AWD (20" Wheels)', 'Long Range AWD')).toBe('20" Wheels');
  });
  it('keeps names that do not start with the variant name', () => {
    expect(trimLabel('Platinum', 'Standard')).toBe('Platinum');
    expect(trimLabel('Long Range', 'Long Range')).toBe('Long Range');
  });
});
