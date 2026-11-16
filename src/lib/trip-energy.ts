// Trip energy model (route-planner.md §3, R1): highway consumption plus elevation, nothing else.
// Pure functions: the trip screen resolves a car once (tripCar) and the stop planner asks for the
// energy of each stretch of route (stretchKwh) and turns it into battery % (socDrop).

import { TRIP } from '../config.ts';
import type { CarDetail, Field, SourcedValue } from './types.ts';

const G = 9.81;
const J_PER_KWH = 3_600_000;

/** Everything the energy model needs about one car, with where each figure came from. */
export interface TripCar {
  /** Wh/km used on the highway. */
  whPerKm: number;
  /** 'tested': a tested highway figure as is; 'rated': NRCan highway × TRIP.highwayFactor. */
  whPerKmBasis: 'tested' | 'rated';
  /** Curb weight + payload (kg). */
  massKg: number;
  /** The curb weight is an estimate (B47 body-type median). */
  massEstimated: boolean;
  /** Battery the maths uses (kWh). */
  batteryKwh: number;
  /** 'gross' when usable kWh is unknown (B10): results are estimates. */
  batteryBasis: 'usable' | 'gross';
}

export type TripCarResult = { ok: true; car: TripCar } | { ok: false; missing: string[] };

const num = (v: SourcedValue | undefined): number | undefined =>
  v && typeof v.value === 'number' && Number.isFinite(v.value) && v.value > 0 ? v.value : undefined;

/** Every value a field holds: the default shown first, then the others. */
const valuesOf = (f: Field | undefined): SourcedValue[] => (f ? [f.value, ...f.others] : []);

/**
 * Resolves the car's trip figures. A trim's own highway rating wins over the variant's. A tested highway
 * figure is used as is, wherever it sits in the field (precedence puts NRCan first for display); otherwise
 * the default (NRCan) highway figure × the highway factor.
 */
export function tripCar(car: CarDetail, trimId?: string | null): TripCarResult {
  const trim = trimId ? car.trims.find((t) => t.id === trimId) : undefined;
  const hwField = trim?.consumption_highway_wh_per_km ?? car.fields.consumption_highway_wh_per_km;
  const all = [...valuesOf(hwField), ...(hwField === car.fields.consumption_highway_wh_per_km ? [] : valuesOf(car.fields.consumption_highway_wh_per_km))];
  const tested = num(all.find((v) => v.kind === 'tested'));
  const rated = num(hwField?.value);

  const weightField = car.fields.curb_weight_kg;
  const weight = num(weightField?.value);
  const usable = num(car.fields.capacity_usable_kwh?.value);
  const gross = num(car.fields.capacity_gross_kwh?.value);

  const missing: string[] = [];
  if (tested === undefined && rated === undefined) missing.push('consumption_highway_wh_per_km');
  if (weight === undefined) missing.push('curb_weight_kg');
  if (usable === undefined && gross === undefined) missing.push('capacity_usable_kwh');
  if (missing.length) return { ok: false, missing };

  return {
    ok: true,
    car: {
      whPerKm: tested ?? rated! * TRIP.highwayFactor,
      whPerKmBasis: tested !== undefined ? 'tested' : 'rated',
      massKg: weight! + TRIP.payloadKg,
      massEstimated: weightField!.value.kind === 'estimated',
      batteryKwh: (usable ?? gross)!,
      batteryBasis: usable !== undefined ? 'usable' : 'gross',
    },
  };
}

/**
 * Energy (kWh) for one stretch of road: distance × consumption, plus the lift energy when climbing
 * (÷ drivetrain efficiency), minus the recovered share when descending. Can be negative on a steep descent.
 */
export function stretchKwh(car: Pick<TripCar, 'whPerKm' | 'massKg'>, distanceKm: number, climbM: number): number {
  const base = (car.whPerKm * distanceKm) / 1000;
  const lift = (car.massKg * G * Math.abs(climbM)) / J_PER_KWH;
  return climbM >= 0 ? base + lift / TRIP.climbEfficiency : base - lift * TRIP.regenShare;
}

/** Battery % used by `kwh` of energy. */
export function socDrop(car: Pick<TripCar, 'batteryKwh'>, kwh: number): number {
  return (kwh / car.batteryKwh) * 100;
}

/** True when the car's own inputs are estimates (shown with "~"). The uncalibrated highway factor has its own warning. */
export function carIsEstimated(car: TripCar): boolean {
  return car.massEstimated || car.batteryBasis === 'gross';
}
