// B123 (DESIGN-10): Weather and wheels, Arrive at %, and the link/storage fields.
import { describe, expect, it } from 'vitest';
import { TRIP } from '../src/config.ts';
import { adjustedWhPerKm } from '../src/lib/trip-energy.ts';
import { readSavedSettings, readTripLink, tripExtras, writeTripLink } from '../src/lib/trip-link.ts';
import { carPlugs } from '../src/lib/map-filter.ts';
import { buildRoute, type LonLat } from '../src/lib/route-geo.ts';
import { planTrip, type PlanCar } from '../src/lib/trip-plan.ts';
import type { MapFeature } from '../src/lib/map-data.ts';
import { regionOf } from '../src/lib/temp-unit.ts';

const effect = { pct_per_inch: 0.03, low: 0.02, high: 0.04, pairs: 10, source_ids: ['src-x'] };
const base = { tempC: 20, heatPump: 'none', heatPumpFitted: false, chemistry: 'nmc', wheelIn: null, ratedWheelIn: 19, wheelEffect: effect };

describe('adjustedWhPerKm', () => {
  it('changes nothing at a mild temperature on the rated wheels', () => {
    const r = adjustedWhPerKm(200, base);
    expect(r.factor).toBeCloseTo(1, 9);
    expect(r.whPerKm).toBeCloseTo(200, 9);
  });
  it('uses more energy in the cold, less of it with a heat pump', () => {
    const cold = adjustedWhPerKm(200, { ...base, tempC: -10 });
    const hp = adjustedWhPerKm(200, { ...base, tempC: -10, heatPump: 'optional', heatPumpFitted: true });
    expect(cold.tempFactor).toBeGreaterThan(1.3);
    expect(hp.tempFactor).toBeGreaterThan(1);
    expect(hp.tempFactor).toBeLessThan(cold.tempFactor);
  });
  it('bigger wheels than the rating use more; unknown rated wheels or effect change nothing', () => {
    expect(adjustedWhPerKm(200, { ...base, wheelIn: 21 }).wheelFactor).toBeCloseTo(1.06, 9);
    expect(adjustedWhPerKm(200, { ...base, wheelIn: 21, ratedWheelIn: null }).wheelFactor).toBe(1);
    expect(adjustedWhPerKm(200, { ...base, wheelIn: 21, wheelEffect: null }).wheelFactor).toBe(1);
  });
  it('multiplies temperature and wheels', () => {
    const r = adjustedWhPerKm(200, { ...base, tempC: -10, wheelIn: 21 });
    expect(r.factor).toBeCloseTo(r.tempFactor * r.wheelFactor, 9);
    expect(r.whPerKm).toBeCloseTo(200 * r.factor, 9);
  });
});

// The trip-plan.test.ts route: east along 45° N; 200 Wh/km on 80 kWh = 0.25 % per km.
const KM_PER_DEG = (Math.PI / 180) * 6371.0088 * Math.cos((45 * Math.PI) / 180);
const lonAt = (km: number) => -80 + km / KM_PER_DEG;
const routeOf = (km: number) => buildRoute(Array.from({ length: 401 }, (_, i) => [lonAt((km * i) / 400), 45] as LonLat));
const station = (km: number, i: number): MapFeature => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lonAt(km), 45.001] }, properties: { i, n: `S${km}`, p: [[3, 'ccs1', 150, 2]], src: 'src-afdc-ca' } });
const car: PlanCar = {
  energy: { whPerKm: 200, whPerKmBasis: 'tested', massKg: 2150, massEstimated: false, batteryKwh: 80, batteryBasis: 'usable' },
  curve: { points: [{ soc_percent: 0, power_kw: 200 }, { soc_percent: 100, power_kw: 200 }], estimated: false },
  rule: carPlugs('ccs1', 'no')!, isTesla: false, dcMaxKw: 200,
};

describe('planTrip: Arrive at %', () => {
  // 90 % − 0.25 %/km × 290 km ≈ 17.5 % at the destination: over the 15 % threshold, under 20 %.
  const input = { route: routeOf(290), durationMin: 174, car, stations: [station(200, 1)] };
  it('defaults to 20 %, adding a stop to arrive with it', () => {
    expect(TRIP.defaultArriveSoc).toBe(20);
    const p = planTrip(input);
    expect(p.arriveTarget).toBe(20);
    expect(p.stops).toHaveLength(1);
    expect(p.arriveSoc).toBeGreaterThanOrEqual(20);
  });
  it('the last stop charges only enough to arrive with the target (owner 2026-11-20)', () => {
    // 500 km, one charger at 280 km: 80 % would arrive with ~25 %; Arrive at 20 % needs less.
    const route = routeOf(500);
    const p = planTrip({ route, durationMin: 300, car, stations: [station(280, 4)] });
    expect(p.stops).toHaveLength(1);
    expect(p.stops[0].departSoc).toBeLessThan(TRIP.chargeToSoc);
    expect(p.arriveSoc).toBeGreaterThanOrEqual(20);
    expect(p.arriveSoc).toBeLessThan(21.5);
    // A higher target charges more: past 80 % when the last stretch needs it (B75, up to 100 %).
    const high = planTrip({ route, durationMin: 300, car, stations: [station(280, 4)], arriveSoc: 40 });
    expect(high.stops[0].departSoc).toBeGreaterThan(TRIP.chargeToSoc);
    expect(high.arriveSoc).toBeGreaterThanOrEqual(40);
  });
  it('needs no stop when the target is the threshold', () => {
    const p = planTrip({ ...input, arriveSoc: 15 });
    expect(p.stops).toHaveLength(0);
    expect(p.arriveSoc).toBeCloseTo(17.5, 0);
  });
  it('charges enough at the last stop for a high target', () => {
    const p = planTrip({ ...input, arriveSoc: 60 });
    expect(p.stops).toHaveLength(1);
    expect(p.arriveSoc).toBeGreaterThanOrEqual(60);
  });
  it('arrives under the target (still reachable) when no charger is ahead', () => {
    const p = planTrip({ ...input, stations: [] });
    expect(p.reachable).toBe(true);
    expect(p.gaps).toHaveLength(0);
    expect(p.arriveSoc).toBeLessThan(20);
  });
  it('more energy per km (weather and wheels) needs more charging', () => {
    const warm = planTrip({ ...input, arriveSoc: 15, stations: [station(150, 2), station(250, 3)] });
    const cold = planTrip({ ...input, arriveSoc: 15, stations: [station(150, 2), station(250, 3)], car: { ...car, energy: { ...car.energy, whPerKm: 280 } } });
    expect(warm.stops).toHaveLength(0);
    expect(cold.stops.length).toBeGreaterThan(0);
  });
});

describe('trip link and storage: arrive, weather, temperature', () => {
  it('carries arrive= always and temp= only with Weather and wheels on', () => {
    const t = { from: null, to: { label: 'X', lat: 45, lon: -75 }, startSoc: 90, thresholdSoc: 15, arriveSoc: 30, weather: true, tempC: -12.5 };
    const q = writeTripLink(t);
    expect(q).toContain('arrive=30');
    expect(q).toContain('temp=-12.5');
    expect(readTripLink('?' + q)).toEqual(t);
    expect(writeTripLink({ ...t, weather: false })).not.toContain('temp=');
    expect(readTripLink('?' + writeTripLink({ ...t, weather: false }))?.weather).toBe(false);
  });
  it('ignores odd values', () => {
    expect(tripExtras('3', true, 'cold')).toEqual({ arriveSoc: TRIP.defaultArriveSoc, weather: false, tempC: 20 });
    expect(tripExtras(95, true, -80)).toEqual({ arriveSoc: TRIP.defaultArriveSoc, weather: false, tempC: 20 });
    expect(readSavedSettings({ startSoc: 90, thresholdSoc: 15, arriveSoc: 25, weather: true, tempC: -5 })).toEqual({ startSoc: 90, thresholdSoc: 15, arriveSoc: 25, weather: true, tempC: -5 });
    expect(readSavedSettings(null)).toMatchObject({ arriveSoc: 20, weather: false });
  });
});

describe('Region preset (B123)', () => {
  it('names the region only while both units match it', () => {
    expect(regionOf('km', 'C')).toBe('ca');
    expect(regionOf('mi', 'F')).toBe('us');
    expect(regionOf('km', 'F')).toBeNull();
    expect(regionOf('mi', 'C')).toBeNull();
  });
});
