import { describe, expect, it } from 'vitest';
import { RETENTION, TEMPERATURE_SOURCE_IDS, cToF, fToC, lfpPenalty, retention, temperatureEffect } from '../src/lib/temperature-effect.ts';
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
  it('optional heat pump unticked: safe figure plus the heat-pump figure', () => {
    for (const hp of ['optional', 'standard_or_optional']) {
      const e = temperatureEffect(-10, hp, 'nmc');
      expect(e.heatPumpOptional).toBe(true);
      expect(e.retained).toBeCloseTo(0.6);
      expect(e.withHeatPump).toBeCloseTo(0.67);
    }
    expect(temperatureEffect(35, 'optional', 'nmc').withHeatPump).toBeNull(); // same curve in the heat
  });
  it('optional heat pump ticked: the heat-pump curve, no second figure (owner 2026-11-20)', () => {
    const e = temperatureEffect(-10, 'optional', 'nmc', { heatPumpFitted: true });
    expect(e.curve).toBe('heat_pump');
    expect(e.retained).toBeCloseTo(0.67);
    expect(e.withHeatPump).toBeNull();
  });
  it('the tick only matters when the heat pump is optional', () => {
    expect(temperatureEffect(-10, 'none', 'nmc', { heatPumpFitted: true }).curve).toBe('none');
    expect(temperatureEffect(-10, null, 'nmc', { heatPumpFitted: true }).curve).toBe('none');
    expect(temperatureEffect(-10, 'standard', 'nmc').heatPumpOptional).toBe(false);
  });
  it('unknown heat pump assumes none and says so', () => {
    for (const hp of [null, undefined, 'unknown']) {
      const e = temperatureEffect(0, hp, 'nmc');
      expect(e.curve).toBe('none');
      expect(e.heatPumpUnknown).toBe(true);
    }
  });
  it('LFP loses a few points more in the cold, growing as it gets colder (owner 2026-11-20)', () => {
    const gap = (t: number, hp: string) => temperatureEffect(t, hp, 'nmc').retained - temperatureEffect(t, hp, 'lfp').retained;
    for (const hp of ['standard', 'none']) {
      expect(gap(0, hp)).toBeCloseTo(0.03);
      expect(gap(-10, hp)).toBeCloseTo(0.05);
      expect(gap(-20, hp)).toBeCloseTo(0.07);
      expect(gap(-30, hp)).toBeCloseTo(0.08);
      expect(gap(-40, hp)).toBeCloseTo(0.08); // clamped
      for (const t of [10, 20, 35, 45]) expect(gap(t, hp)).toBe(0);
    }
    expect(gap(5, 'none')).toBeCloseTo(0.015);
    expect(temperatureEffect(-10, 'standard', 'lmfp').retained).toBeCloseTo(0.62);
    for (const c of ['nca', 'other', null]) expect(lfpPenalty(-10, c)).toBe(0);
    expect(temperatureEffect(-10, 'optional', 'lfp').withHeatPump).toBeCloseTo(0.62); // penalty on both figures
  });
  it('LFP gets the cold-charging note below 0 °C', () => {
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
    const keys = ['temp.label', 'temp.units', 'temp.unit.C', 'temp.unit.F', 'temp.change', 'temp.mild', 'temp.withHeatPump', 'temp.heatPumpUnknown', 'temp.lfpNote', 'temp.clamped', 'temp.basis', 'temp.sparse', 'temp.heatPump', 'temp.heatPumpHelp', 'temp.lfpBasis'];
    for (const k of keys) expect((en as Record<string, string>)[k], k).toBeTruthy();
  });
});

describe('best and worst case (owner 2026-11-20, design §3)', () => {
  it('keeps best ≥ middle ≥ worst at every temperature, for both curves and chemistries', () => {
    for (const curve of ['none', 'heat_pump'] as const) {
      for (const chem of ['nmc', 'lfp']) {
        for (let t = -30; t <= 45; t += 0.5) {
          const mid = retention(t, curve, chem);
          expect(retention(t, curve, chem, 'best')).toBeGreaterThanOrEqual(mid - 1e-9);
          expect(retention(t, curve, chem, 'worst')).toBeLessThanOrEqual(mid + 1e-9);
        }
      }
    }
  });
  it('collapses to 1 in mild weather', () => {
    for (const o of ['best', 'worst'] as const) expect(retention(22, 'none', 'nmc', o)).toBe(1);
  });
  it('hits the anchors', () => {
    expect(retention(0, 'heat_pump', 'nmc', 'best')).toBeCloseTo(0.9); // best models in Recurrent's data
    expect(retention(0, 'none', 'nmc', 'worst')).toBeCloseTo(0.65); // ID.4: 63 %
    expect(retention(-7, 'none', 'nmc', 'worst')).toBeCloseTo(0.55); // lab tests, about −41 %
    expect(retention(35, 'none', 'nmc', 'worst')).toBeCloseTo(0.86); // DOE −14 % at 35 °C
    expect(retention(35, 'none', 'nmc', 'best')).toBeCloseTo(0.96); // AAA, AC off −4 %
  });
  it('the effect carries the band, and the heat-pump band for an unticked optional heat pump', () => {
    const e = temperatureEffect(-10, 'none', 'nmc');
    expect(e.band.best).toBeCloseTo(0.72);
    expect(e.band.worst).toBeCloseTo(0.52);
    expect(e.withHeatPumpBand).toBeNull();
    const o = temperatureEffect(-10, 'optional', 'nmc');
    expect(o.withHeatPumpBand?.best).toBeCloseTo(0.8);
    expect(o.withHeatPumpBand?.worst).toBeCloseTo(0.58);
    expect(temperatureEffect(-10, 'optional', 'nmc', { heatPumpFitted: true }).withHeatPumpBand).toBeNull();
  });
  it('the LFP penalty applies to the whole band', () => {
    const n = temperatureEffect(-10, 'standard', 'nmc').band;
    const l = temperatureEffect(-10, 'standard', 'lfp').band;
    expect(n.best - l.best).toBeCloseTo(0.05);
    expect(n.worst - l.worst).toBeCloseTo(0.05);
  });
});
