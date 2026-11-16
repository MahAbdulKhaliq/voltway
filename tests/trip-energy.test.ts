import { describe, expect, it } from 'vitest';
import { TRIP } from '../src/config.ts';
import { carIsEstimated, socDrop, stretchKwh, tripCar } from '../src/lib/trip-energy.ts';
import type { CarDetail, Field, Kind } from '../src/lib/types.ts';

const f = (value: number, kind: Kind = 'manufacturer', others: { value: number; kind: Kind }[] = []): Field<number> => ({
  value: { value, kind, source_id: 'src-x' },
  others: others.map((o) => ({ ...o, source_id: 'src-y' })),
  conflict: false,
});

function car(fields: Record<string, Field>, trims: CarDetail['trims'] = []): CarDetail {
  return {
    id: 'make/model/2026/v', make: { id: 'make', name: 'Make' }, model: { id: 'make/model', name: 'Model', body_type: 'suv' },
    year: 2026, name: 'V', drivetrain: 'awd', sold_in_canada: true, fields, trims, curves: [],
    derived: { minutes_10_80: null, km_per_10_min: null, estimated: true, extrapolated: false, battery_basis: null }, sources: [],
  };
}

const base = {
  consumption_highway_wh_per_km: f(200, 'rated_nrcan'),
  curb_weight_kg: f(2000),
  capacity_usable_kwh: f(80),
};

describe('tripCar', () => {
  it('uses NRCan highway × the factor when nothing is tested', () => {
    const r = tripCar(car(base));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.car.whPerKm).toBeCloseTo(200 * TRIP.highwayFactor);
    expect(r.car.whPerKmBasis).toBe('rated');
    expect(r.car.massKg).toBe(2000 + TRIP.payloadKg);
    expect(r.car.batteryBasis).toBe('usable');
    expect(carIsEstimated(r.car)).toBe(false);
  });

  it('uses a tested highway figure as is, even when NRCan is the displayed value', () => {
    const r = tripCar(car({ ...base, consumption_highway_wh_per_km: f(200, 'rated_nrcan', [{ value: 245, kind: 'tested' }]) }));
    expect(r.ok && r.car.whPerKm).toBe(245);
    expect(r.ok && r.car.whPerKmBasis).toBe('tested');
  });

  it("prefers the trim's own highway rating", () => {
    const trim = { id: 't1', name: 'Big wheels', heat_pump: null, range_km: null, consumption_combined_wh_per_km: null, consumption_city_wh_per_km: null, consumption_highway_wh_per_km: f(220, 'rated_nrcan'), ac_max_kw: null } as unknown as CarDetail['trims'][number];
    const r = tripCar(car(base, [trim]), 't1');
    expect(r.ok && r.car.whPerKm).toBeCloseTo(220 * TRIP.highwayFactor);
  });

  it('flags an estimated weight and a gross-capacity battery', () => {
    const r = tripCar(car({ ...base, curb_weight_kg: f(2100, 'estimated'), capacity_usable_kwh: null, capacity_gross_kwh: f(84) }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.car.massEstimated).toBe(true);
    expect(r.car.batteryBasis).toBe('gross');
    expect(r.car.batteryKwh).toBe(84);
    expect(carIsEstimated(r.car)).toBe(true);
  });

  it('lists what is missing', () => {
    const r = tripCar(car({ consumption_highway_wh_per_km: null, curb_weight_kg: null, capacity_usable_kwh: null }));
    expect(r).toEqual({ ok: false, missing: ['consumption_highway_wh_per_km', 'curb_weight_kg', 'capacity_usable_kwh'] });
  });
});

describe('stretchKwh and socDrop', () => {
  const c = { whPerKm: 200, massKg: 2150, batteryKwh: 80 };
  const lift = (m: number) => (2150 * 9.81 * m) / 3_600_000;

  it('flat: distance × consumption', () => {
    expect(stretchKwh(c, 100, 0)).toBeCloseTo(20);
    expect(socDrop(c, 20)).toBeCloseTo(25);
  });

  it('climb adds lift energy ÷ drivetrain efficiency', () => {
    expect(stretchKwh(c, 10, 500)).toBeCloseTo(2 + lift(500) / 0.9);
  });

  it('descent gives back 60 % and can go below zero', () => {
    expect(stretchKwh(c, 10, -500)).toBeCloseTo(2 - lift(500) * 0.6);
    expect(stretchKwh(c, 1, -1000)).toBeLessThan(0);
  });

  it('there and back costs more than flat: climb ÷ 0.9 − 60 % back', () => {
    const roundTrip = stretchKwh(c, 50, 800) + stretchKwh(c, 50, -800);
    expect(roundTrip).toBeCloseTo(20 + lift(800) * (1 / 0.9 - 0.6));
    expect(roundTrip).toBeGreaterThan(20);
  });
});
