import { describe, expect, it } from 'vitest';
import { RETENTION, TEMPERATURE_SOURCE_IDS, cToF, fToC, retention, temperatureEffect } from '../src/lib/temperature-effect.ts';
import en from '../src/i18n/en.json';

describe('retention table (B116, design §3)', () => {
  it('hits the published anchors', () => {
    expect(retention(0, 'none')).toBeCloseTo(0.75); // Recurrent: 75 % without a heat pump at 0 °C
    expect(retention(0, 'heat_pump')).toBeCloseTo(0.83); // 83 % with one
    expect(retention(-10, 'none')).toBeCloseTo(0.6);
    expect(retention(-10, 'heat_pump')).toBeCloseTo(0.67);
    expect(retention(32, 'none')).toBeCloseTo(0.95); // Recurrent summer: −5 % at 32 °C
    expect(retention(38, 'heat_pump')).toBeCloseTo(0.85); // −15 % at 38 °C
  });
  it('is 1 in mild weather', () => {
    for (const t of [20, 22.5, 25]) {
      expect(retention(t, 'none')).toBe(1);
      expect(retention(t, 'heat_pump')).toBe(1);
    }
  });
  it('interpolates linearly between points', () => {
    expect(retention(-3.5, 'none')).toBeCloseTo((0.64 + 0.75) / 2);
    expect(retention(2.5, 'heat_pump')).toBeCloseTo((0.83 + 0.89) / 2);
  });
  it('clamps outside −30…45 °C and treats NaN as mild', () => {
    expect(retention(-45, 'none')).toBeCloseTo(0.4);
    expect(retention(60, 'none')).toBeCloseTo(0.75);
    expect(retention(Number.NaN, 'none')).toBe(1);
  });
  it('a heat pump never does worse, and the curves meet in the heat and the deep cold', () => {
    for (let t = -30; t <= 45; t += 0.5) expect(retention(t, 'heat_pump')).toBeGreaterThanOrEqual(retention(t, 'none'));
    for (const t of [-30, 30, 35, 40, 45]) expect(retention(t, 'heat_pump')).toBe(retention(t, 'none'));
  });
  it('falls steadily away from mild weather on both sides', () => {
    for (const curve of ['none', 'heat_pump'] as const) {
      const table = RETENTION[curve];
      for (let i = 1; i < table.length; i++) {
        if (table[i][0] <= 20) expect(table[i][1]).toBeGreaterThanOrEqual(table[i - 1][1]);
        if (table[i - 1][0] >= 25) expect(table[i][1]).toBeLessThanOrEqual(table[i - 1][1]);
      }
    }
  });
});

describe('temperatureEffect by heat pump and chemistry', () => {
  it('standard heat pump uses the heat-pump curve', () => {
    const e = temperatureEffect(-10, 'standard', 'nmc');
    expect(e.curve).toBe('heat_pump');
    expect(e.retained).toBeCloseTo(0.67);
    expect(e.factor).toBeCloseTo(1 / 0.67);
    expect(e.withHeatPump).toBeNull();
    expect(e.heatPumpUnknown).toBe(false);
  });
  it('no heat pump uses the resistive curve', () => {
    const e = temperatureEffect(-10, 'none', 'nca');
    expect(e.curve).toBe('none');
    expect(e.retained).toBeCloseTo(0.6);
  });
  it('optional heat pump: safe figure plus the heat-pump figure', () => {
    for (const hp of ['optional', 'standard_or_optional']) {
      const e = temperatureEffect(-10, hp, 'nmc');
      expect(e.retained).toBeCloseTo(0.6);
      expect(e.withHeatPump).toBeCloseTo(0.67);
    }
    expect(temperatureEffect(35, 'optional', 'nmc').withHeatPump).toBeNull(); // same curve in the heat
  });
  it('unknown heat pump assumes none and says so', () => {
    for (const hp of [null, undefined, 'unknown']) {
      const e = temperatureEffect(0, hp, 'nmc');
      expect(e.curve).toBe('none');
      expect(e.heatPumpUnknown).toBe(true);
    }
  });
  it('chemistry does not change range; LFP gets the cold-charging note below 0 °C', () => {
    expect(temperatureEffect(-5, 'standard', 'lfp').retained).toBe(temperatureEffect(-5, 'standard', 'nmc').retained);
    expect(temperatureEffect(-5, 'standard', 'lfp').lfpNote).toBe(true);
    expect(temperatureEffect(-5, 'standard', 'lmfp').lfpNote).toBe(true);
    expect(temperatureEffect(5, 'standard', 'lfp').lfpNote).toBe(false);
    expect(temperatureEffect(-5, 'standard', 'nmc').lfpNote).toBe(false);
    expect(temperatureEffect(-5, 'standard', null).lfpNote).toBe(false);
  });
  it('flags clamped and sparse temperatures', () => {
    expect(temperatureEffect(-35, 'none', 'nmc')).toMatchObject({ clamped: true, sparse: true });
    expect(temperatureEffect(-25, 'none', 'nmc')).toMatchObject({ clamped: false, sparse: true });
    expect(temperatureEffect(50, 'none', 'nmc')).toMatchObject({ clamped: true, sparse: false });
    expect(temperatureEffect(20, 'none', 'nmc')).toMatchObject({ factor: 1, clamped: false, sparse: false });
  });
});

describe('°C ↔ °F (metric inside, °F on screen only)', () => {
  it('converts both ways', () => {
    expect(cToF(-10)).toBe(14);
    expect(cToF(20)).toBe(68);
    expect(fToC(32)).toBe(0);
    expect(fToC(-40)).toBe(-40);
    for (const c of [-30, -7, 0, 21.5, 45]) expect(fToC(cToF(c))).toBeCloseTo(c);
  });
});

describe('sources and strings', () => {
  it('lists the cited studies', () => {
    expect(TEMPERATURE_SOURCE_IDS.length).toBeGreaterThanOrEqual(5);
    expect(new Set(TEMPERATURE_SOURCE_IDS).size).toBe(TEMPERATURE_SOURCE_IDS.length);
  });
  it('has every temp.* string', () => {
    const keys = ['temp.label', 'temp.units', 'temp.unit.C', 'temp.unit.F', 'temp.change', 'temp.mild', 'temp.withHeatPump', 'temp.heatPumpUnknown', 'temp.lfpNote', 'temp.clamped', 'temp.basis', 'temp.sparse'];
    for (const k of keys) expect((en as Record<string, string>)[k], k).toBeTruthy();
  });
});
