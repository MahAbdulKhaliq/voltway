import { describe, expect, it } from 'vitest';
import { drivetrainFrom, parseName, scoreCandidate, similarity, slugify, suggest, tokenize, variantGroupKey, type Candidate, type NrcanTarget } from '../scripts/lib/match.ts';

const target = (model: string, motor_kw: number, year = 2026, make = 'Hyundai'): NrcanTarget => ({
  source_key: `${year} · ${make} · ${model}`, year, make, model, motor_kw,
});
const cand = (label: string, extra: Partial<Candidate> = {}): Candidate => ({
  source: 'openev', source_key: label.toLowerCase().replace(/\W+/g, '_'), year: 2025, make: 'Hyundai', label, ...extra,
});

describe('parseName', () => {
  it('pulls wheel size, onboard charger and pack hints out of NRCan names', () => {
    expect(parseName('IONIQ 5 Long Range AWD (20" Wheels)')).toMatchObject({ base: 'IONIQ 5 Long Range AWD', wheel_in: 20, drivetrain: 'awd' });
    expect(parseName('Equinox EV AWD (19.2 kW Charger)')).toMatchObject({ base: 'Equinox EV AWD', charger_kw: 19.2 });
    expect(parseName('F-150 Lightning Extended Range (131 kWh)')).toMatchObject({ base: 'F-150 Lightning Extended Range', pack_kwh: 131 });
  });
});

describe('drivetrainFrom', () => {
  it('reads the ways sources write drivetrains', () => {
    expect(drivetrainFrom('ARIYA SL+ e-4ORCE')).toBe('awd');
    expect(drivetrainFrom('i4 xDrive40 Gran Coupe')).toBe('awd');
    expect(drivetrainFrom('i4 eDrive40 Gran Coupe')).toBe('rwd');
    expect(drivetrainFrom('Polestar 2 Long Range Dual Motor')).toBe('awd');
    expect(drivetrainFrom('Model 3 Rear-Wheel Drive')).toBe('rwd');
    expect(drivetrainFrom('IONIQ 5 Long Range')).toBeUndefined();
  });
});

describe('similarity', () => {
  it('is 1 for the same words and 0 for none', () => {
    expect(similarity(tokenize('IONIQ 5 AWD'), tokenize('ioniq 5 awd'))).toBe(1);
    expect(similarity(tokenize('EV6'), tokenize('Model Y'))).toBe(0);
  });
});

describe('scoreCandidate', () => {
  it('never suggests a later model year', () => {
    expect(scoreCandidate(target('IONIQ 5 AWD', 239, 2024), cand('IONIQ 5 AWD', { year: 2025 }))).toBeUndefined();
  });

  it('never suggests another make', () => {
    expect(scoreCandidate(target('IONIQ 5', 168), cand('IONIQ 5', { make: 'Kia' }))).toBeUndefined();
  });

  it('requires every word of the model name (Model Y ≠ Model 3)', () => {
    const t = target('Model Y Long Range AWD', 296, 2026, 'Tesla');
    expect(scoreCandidate(t, cand('Model 3 Long Range AWD', { make: 'Tesla' }), ['model', 'y'])).toBeUndefined();
    expect(scoreCandidate(t, cand('Model Y Long Range AWD', { make: 'Tesla' }), ['model', 'y'])).toBeDefined();
  });

  it('ranks the matching drivetrain and power first', () => {
    const t = target('IONIQ 5 Long Range AWD (19" Wheels)', 239);
    const [best] = suggest(t, [cand('IONIQ 5', { drivetrain: 'rwd', motor_kw: 168 }), cand('IONIQ 5 AWD', { drivetrain: 'awd', motor_kw: 239 })], 3, ['ioniq', '5']);
    expect(best.candidate.label).toBe('IONIQ 5 AWD');
    expect(best.reasons).toContain('drivetrain awd matches');
  });

  it('prefers the candidate that has every NRCan word (IONIQ 5 N)', () => {
    const t = target('IONIQ 5 N', 478);
    const [best] = suggest(t, [cand('IONIQ 5', { drivetrain: 'rwd', motor_kw: 168 }), cand('IONIQ 5 N N', { drivetrain: 'awd' })], 3, ['ioniq', '5']);
    expect(best.candidate.label).toBe('IONIQ 5 N N');
  });

  it('always states the year gap', () => {
    const s = scoreCandidate(target('IONIQ 5 AWD', 239), cand('IONIQ 5 AWD', { year: 2023 }));
    expect(s?.reasons).toContain('3 model years older');
  });
});

describe('variantGroupKey', () => {
  it('groups rows that differ only by wheels or onboard charger', () => {
    expect(variantGroupKey(target('IONIQ 5 Long Range AWD (19" Wheels)', 239))).toBe(variantGroupKey(target('IONIQ 5 Long Range AWD (20" Wheels)', 239)));
    expect(variantGroupKey(target('Equinox EV AWD (11.5 kW Charger)', 247, 2026, 'Chevrolet'))).toBe(
      variantGroupKey(target('Equinox EV AWD (19.2 kW Charger)', 247, 2026, 'Chevrolet')),
    );
  });

  it('splits rows with a different pack, power or drivetrain', () => {
    expect(variantGroupKey(target('F-150 Lightning Extended Range (123 kWh)', 420, 2025, 'Ford'))).not.toBe(
      variantGroupKey(target('F-150 Lightning Extended Range (131 kWh)', 420, 2025, 'Ford')),
    );
    expect(variantGroupKey(target('IONIQ 5 Long Range', 168))).not.toBe(variantGroupKey(target('IONIQ 5 Long Range AWD', 239)));
  });
});

describe('slugify', () => {
  it('makes readable ids', () => {
    expect(slugify('Long Range AWD')).toBe('long-range-awd');
    expect(slugify('SL+ e-4ORCE')).toBe('sl-plus-e-4orce');
  });
});
