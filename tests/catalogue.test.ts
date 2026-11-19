import { describe, expect, it } from 'vitest';
import { assignModel, epaMotorKw, groupRegulatorRows, trimNameKey, trimPart, type ModelMap, type RegRow } from '../scripts/lib/catalogue.ts';

const map: ModelMap = {
  models: [
    { id: 'tesla/model-3', nrcan: ['Model 3'], epa: ['Model 3'] },
    { id: 'tesla/model-y', nrcan: ['Model Y'], epa: ['Model Y'] },
    { id: 'hyundai/ioniq-5', nrcan: ['IONIQ 5'], epa: ['Ioniq 5'] },
    { id: 'hyundai/ioniq-5-n', nrcan: ['IONIQ 5 N'], epa: [] },
  ],
};
const row = (o: Partial<RegRow>): RegRow => ({ source: 'nrcan', market: 'CA', source_key: o.label ?? 'k', year: 2026, make: 'Tesla', label: '', motor_kw: null, ...o });

describe('assignModel', () => {
  it('picks the longest NRCan prefix', () => {
    expect(assignModel(row({ make: 'Hyundai', label: 'IONIQ 5 N' }), map)).toBe('hyundai/ioniq-5-n');
    expect(assignModel(row({ make: 'Hyundai', label: 'IONIQ 5 Preferred AWD' }), map)).toBe('hyundai/ioniq-5');
  });
  it('needs a word boundary and the same make', () => {
    expect(assignModel(row({ label: 'Model 3X' }), map)).toBeNull();
    expect(assignModel(row({ make: 'Hyundai', label: 'Model 3' }), map)).toBeNull();
  });
  it('matches EPA rows by base model', () => {
    expect(assignModel(row({ source: 'epa', market: 'US', make: 'Hyundai', label: 'Ioniq 5 Long Range AWD', base_model: 'Ioniq 5' }), map)).toBe('hyundai/ioniq-5');
  });
});

describe('trimPart', () => {
  it('drops the model name, NRCan code and wheel hint', () => {
    const t = trimPart(row({ label: 'Model 3 Premium AWD-I (19" Wheels)', model_id: 'tesla/model-3' }), map);
    expect(t.name).toBe('Premium AWD');
    expect(t.code).toBe('I');
    expect(t.wheel_in).toBe(19);
    expect(t.drivetrain).toBe('awd');
  });
  it('reads EPA "(19in)" wheels and keeps "(Import)" as a note, not a trim word', () => {
    const t = trimPart(row({ source: 'epa', market: 'US', label: 'Model 3 Long Range RWD-I (19in wheels)', base_model: 'Model 3', model_id: 'tesla/model-3' }), map);
    expect(t.wheel_in).toBe(19);
    expect(t.name).toBe('Long Range RWD');
    const n = trimPart(row({ label: 'Model 3 RWD (Import)', model_id: 'tesla/model-3' }), map);
    expect(n.name).toBe('RWD');
    expect(n.notes).toEqual(['Import']);
  });
  it('keeps a bracketed range or battery in the name, and reads tire and multi-size wheel hints', () => {
    const lr = trimPart(row({ source: 'epa', market: 'US', label: 'EV6 RWD (Long Range)', base_model: 'EV6', model_id: 'tesla/model-3' }), map);
    const sr = trimPart(row({ source: 'epa', market: 'US', label: 'EV6 RWD (Standard Range)', base_model: 'EV6', model_id: 'tesla/model-3' }), map);
    expect(lr.tokens).not.toEqual(sr.tokens);
    expect(trimPart(row({ label: 'Model 3 Long Range AWD (19 inch tires)', model_id: 'tesla/model-3' }), map).wheels).toEqual([19]);
    expect(trimPart(row({ label: 'Model 3 AWD (19/20 inch wheels)', model_id: 'tesla/model-3' }), map).wheels).toEqual([19, 20]);
    expect(trimPart(row({ label: 'Model 3 AWD (20in AT)', model_id: 'tesla/model-3' }), map).wheels).toEqual([20]);
  });
  it('reads EPA motor text as total kW', () => {
    expect(epaMotorKw('74 and 165 kW PMSM')).toBe(239);
    expect(epaMotorKw('168 kW PMSM')).toBe(168);
    expect(epaMotorKw('TBD')).toBeNull();
  });
  it('takes the EPA drive column when the name has none', () => {
    const t = trimPart(row({ source: 'epa', market: 'US', label: 'Model 3 Long Range', base_model: 'Model 3', drive: 'All-Wheel Drive', model_id: 'tesla/model-3' }), map);
    expect(t.drivetrain).toBe('awd');
    expect(t.name).toBe('Long Range');
  });
});

describe('groupRegulatorRows', () => {
  const rows: RegRow[] = [
    row({ label: 'Model 3 Premium AWD-I (18" Wheels)', model_id: 'tesla/model-3' }),
    row({ label: 'Model 3 Premium AWD-I (19" Wheels)', model_id: 'tesla/model-3' }),
    row({ source: 'epa', market: 'US', label: 'Model 3 Premium AWD', base_model: 'Model 3', drive: 'All-Wheel Drive', model_id: 'tesla/model-3', source_key: 'e1' }),
    row({ source: 'epa', market: 'US', label: 'Model 3 Standard', base_model: 'Model 3', drive: 'Rear-Wheel Drive', model_id: 'tesla/model-3', source_key: 'e2' }),
  ];
  const props = groupRegulatorRows(rows, new Map(), [], map);

  it('merges wheel rows and pairs Canada with the US when trim words and drivetrain agree', () => {
    const awd = props.find((p) => p.drivetrain === 'awd')!;
    expect(awd.markets).toEqual(['CA', 'US']);
    expect(awd.wheels).toEqual([18, 19]);
    expect(awd.rows).toHaveLength(3);
    expect(awd.variant_id).toBe('tesla/model-3/2026/premium-awd');
    expect(awd.flags.some((f) => f.startsWith('code'))).toBe(true);
  });
  it('keeps a US-only trim as its own US variant', () => {
    const std = props.find((p) => p.drivetrain === 'rwd')!;
    expect(std.markets).toEqual(['US']);
    expect(std.names).toEqual({ US: 'Standard' });
    expect(std.powertrain).toBe('new');
  });
  it('reuses a same-named powertrain only within one generation', () => {
    const existing = new Map([['tesla/model-3/2026/premium-awd', { id: 'tesla/model-3/2026/premium-awd', model_id: 'tesla/model-3', year: 2026, drivetrain: 'awd', powertrain_id: 'pt-2026', trims: [] }]]);
    const r = rows.slice(2, 3).map((x) => ({ ...x, year: 2025 }));
    const gen = (_m: string, y: number) => (y >= 2024 ? 'highland' : 'gen1');
    expect(groupRegulatorRows(r, existing, [], map, gen)[0].powertrain).toBe('pt-2026');
    const old = r.map((x) => ({ ...x, year: 2022 }));
    expect(groupRegulatorRows(old, existing, [], map, gen)[0].powertrain).toBe('new');
  });
  it('uses researched trim names, which can pair Canada and the US when the regulators word them differently', () => {
    const r = [
      row({ label: 'Model 3 Premium AWD-I', model_id: 'tesla/model-3', source_key: 'c' }),
      row({ source: 'epa', market: 'US', label: 'Model 3 Long Range AWD', base_model: 'Model 3', drive: 'All-Wheel Drive', model_id: 'tesla/model-3', source_key: 'u' }),
    ];
    expect(groupRegulatorRows(r, new Map(), [], map)[0].flags.some((f) => f.startsWith('pair: only one'))).toBe(true);
    const names = new Map([[trimNameKey('nrcan', 2026, 'Model 3 Premium AWD-I'), 'Premium AWD'], [trimNameKey('epa', 2026, 'Model 3  Long Range AWD'), 'Premium AWD']]);
    const p = groupRegulatorRows(r, new Map(), [], map, undefined, names);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ markets: ['CA', 'US'], names: { CA: 'Premium AWD', US: 'Premium AWD' }, named: true, variant_id: 'tesla/model-3/2026/premium-awd' });
  });
  it('never pairs two researched names with no shared trim word, even at the same motor power', () => {
    const r = [
      row({ label: 'Model 3 Long Range AWD (Import)', model_id: 'tesla/model-3', source_key: 'c', motor_kw: 280 }),
      row({ source: 'epa', market: 'US', label: 'Model 3 Performance AWD', base_model: 'Model 3', drive: 'All-Wheel Drive', model_id: 'tesla/model-3', source_key: 'u', motor_kw: 280 }),
    ];
    const names = new Map([[trimNameKey('nrcan', 2026, 'Model 3 Long Range AWD (Import)'), 'Long Range AWD'], [trimNameKey('epa', 2026, 'Model 3 Performance AWD'), 'Performance']]);
    expect(groupRegulatorRows(r, new Map(), [], map, undefined, names)).toHaveLength(2);
  });
  it('adds a market to an existing variant with the same name and drivetrain', () => {
    const existing = new Map([['tesla/model-3/2026/premium-awd', { id: 'tesla/model-3/2026/premium-awd', model_id: 'tesla/model-3', year: 2026, drivetrain: 'awd', powertrain_id: 'tesla/model-3/2026-premium-awd', trims: [{ names: { CA: 'Premium AWD' } }] }]]);
    const p = groupRegulatorRows(rows.slice(2, 3), existing, [], map)[0];
    expect(p.existing).toBe(true);
    expect(p.powertrain).toBe('tesla/model-3/2026-premium-awd');
  });
});
