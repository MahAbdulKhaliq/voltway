import { afterEach, describe, expect, it, vi } from 'vitest';
import { TRIP } from '../src/config.ts';
import type { MapFeature, MapPort, MapStationProps } from '../src/lib/map-data.ts';
import { carPlugs } from '../src/lib/map-filter.ts';
import { buildRoute, type LonLat } from '../src/lib/route-geo.ts';
import { gapDetails } from '../src/lib/trip-format.ts';
import { planTrip, type PlanCar, type PlanInput } from '../src/lib/trip-plan.ts';

// A straight route east along 45° N from 80° W. 1° of longitude there ≈ 78.7 km; the route's own
// distances are used to place stations exactly.
const KM_PER_DEG = (Math.PI / 180) * 6371.0088 * Math.cos((45 * Math.PI) / 180);
const lonAt = (km: number) => -80 + km / KM_PER_DEG;
function routeOf(km: number, elevation?: (km: number) => number) {
  const n = 400;
  return buildRoute(Array.from({ length: n + 1 }, (_, i) => {
    const d = (km * i) / n;
    return (elevation ? [lonAt(d), 45, elevation(d)] : [lonAt(d), 45]) as LonLat;
  }));
}

let nextId = 1;
/** A station `km` along the route, `offKm` north of it. */
function station(km: number, ports: MapPort[], extra: Partial<MapStationProps> = {}, offKm = 0.2): MapFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lonAt(km), 45 + offKm / 110.574] },
    properties: { i: nextId++, n: `S${km}`, p: ports, src: 'src-afdc-ca', ...extra },
  };
}
const ccs = (kw: number): MapPort => [3, 'ccs1', kw, 2];

// 200 Wh/km on an 80 kWh battery: 0.25 % per km. From 90 % the car reaches 15 % after 300 km;
// the stop window (arrive 15–35 %) is 220–300 km along.
const car = (over: Partial<PlanCar> = {}): PlanCar => ({
  energy: { whPerKm: 200, whPerKmBasis: 'tested', massKg: 2150, massEstimated: false, batteryKwh: 80, batteryBasis: 'usable' },
  curve: { points: [{ soc_percent: 0, power_kw: 200 }, { soc_percent: 100, power_kw: 200 }], estimated: false },
  rule: carPlugs('ccs1', 'no')!,
  isTesla: false,
  dcMaxKw: 200,
  ...over,
});
const plan = (km: number, stations: MapFeature[], over: Partial<PlanInput> = {}) =>
  planTrip({ route: routeOf(km), durationMin: km * 0.6, car: car(), stations, ...over });

afterEach(() => vi.unstubAllGlobals());

describe('planTrip: the threshold rule', () => {
  it('needs no stop on a short trip', () => {
    const p = plan(200, [station(100, [ccs(150)])]);
    expect(p.stops).toHaveLength(0);
    expect(p.arriveSoc).toBeCloseTo(40, 0);
    expect(p.legs).toHaveLength(1);
    expect(p.reachable).toBe(true);
  });

  it('one stop: arrival %, charge to 80 %, time from the curve + 5 min', () => {
    const p = plan(500, [station(280, [ccs(150)])]);
    expect(p.stops).toHaveLength(1);
    const s = p.stops[0];
    expect(s.pick).toBe('window');
    expect(s.arriveSoc).toBeCloseTo(20, 0);
    expect(s.departSoc).toBe(80);
    // 60 % of 80 kWh at 150 kW (the charger limits the 200 kW curve) ≈ 19.2 min
    expect(s.chargeMin).toBeCloseTo(19.2, 0);
    expect(s.overheadMin).toBe(5);
    expect(p.legs).toHaveLength(2);
    expect(p.arriveSoc).toBeGreaterThanOrEqual(15);
    expect(p.totals.totalMin).toBeCloseTo(p.totals.driveMin + s.chargeMin + 5, 6);
  });

  it('adds a stop when the destination would be reached below the threshold', () => {
    const p = plan(320, [station(250, [ccs(100)])]); // no stop: arrive at 10 %
    expect(p.stops).toHaveLength(1);
    expect(p.arriveSoc).toBeGreaterThanOrEqual(15);
  });

  it('picks the highest usable kW in the window, capped at the car peak; ties go furthest along', () => {
    let p = plan(500, [station(230, [ccs(150)]), station(260, [ccs(50)]), station(290, [ccs(100)])]);
    expect(p.stops[0].station.n).toBe('S230');
    p = planTrip({ route: routeOf(500), durationMin: 300, car: car({ dcMaxKw: 100 }), stations: [station(230, [ccs(350)]), station(290, [ccs(150)])] });
    expect(p.stops[0].station.n).toBe('S290');
    expect(p.stops[0].usableKw).toBe(100);
    expect(p.stops[0].stationKw).toBe(150);
  });

  it('ignores stations outside the window when one is in it', () => {
    const p = plan(500, [station(150, [ccs(350)]), station(270, [ccs(50)])]);
    expect(p.stops[0].station.n).toBe('S270');
  });
});

describe('planTrip: fallbacks', () => {
  it('within 2 km first, then up to 10 km (with the detour added)', () => {
    let p = plan(500, [station(250, [ccs(50)], {}, 1), station(270, [ccs(350)], {}, 5)]);
    expect(p.stops[0].station.n).toBe('S250');
    p = plan(500, [station(270, [ccs(350)], {}, 5)]);
    expect(p.stops[0].pick).toBe('wide');
    expect(p.stops[0].detourKm).toBeCloseTo(10, 0);
    expect(p.stops[0].detourMin).toBeCloseTo(10 * 0.6, 0);
    expect(p.totals.distanceKm).toBeCloseTo(510, 0);
  });

  it('then the last earlier charger, arriving with more battery', () => {
    const p = plan(500, [station(60, [ccs(150)]), station(120, [ccs(150)])]);
    expect(p.stops[0].pick).toBe('earlier');
    expect(p.stops[0].station.n).toBe('S120');
    expect(p.stops[0].arriveSoc).toBeCloseTo(60, 0);
  });

  it('then a charging gap, carrying on to the next charger past it', () => {
    const p = plan(500, [station(340, [ccs(150)])]);
    expect(p.gaps).toHaveLength(1);
    expect(p.stops[0].pick).toBe('afterGap');
    expect(p.stops[0].arriveSoc).toBeCloseTo(5, 0);
    expect(p.reachable).toBe(true);
  });

  it('marks the trip unreachable when nothing gets the car there', () => {
    const p = plan(500, []);
    expect(p.gaps).toHaveLength(1);
    expect(p.reachable).toBe(false);
    expect(p.arriveSoc).toBeLessThan(0);
  });
});

describe('gapDetails: a gap named by the places on either side', () => {
  it('start → the first charger past the gap, with the arrival %', () => {
    const [g, ...rest] = gapDetails(plan(500, [station(340, [ccs(150)])]), 'Home', 'Away');
    expect(rest).toHaveLength(0);
    expect(g).toMatchObject({ leg: 0, fromName: 'Home', toName: 'S340', makesIt: true });
    expect(g.distanceKm).toBeCloseTo(340, 0);
    expect(g.arriveSoc).toBeCloseTo(5, 0);
  });

  it('a gap after a stop starts at that stop', () => {
    const [g] = gapDetails(plan(900, [station(280, [ccs(150)]), station(560, [ccs(150)])]), 'Home', 'Away');
    expect(g).toMatchObject({ leg: 1, fromName: 'S280', toName: 'S560', makesIt: true });
  });

  it('says when the car is not expected to make it', () => {
    let [g] = gapDetails(plan(900, [station(700, [ccs(150)])]), 'Home', 'Away');
    expect(g).toMatchObject({ leg: 0, toName: 'S700', makesIt: false });
    [g] = gapDetails(plan(500, []), 'Home', 'Away');
    expect(g).toMatchObject({ leg: 0, fromName: 'Home', toName: 'Away', makesIt: false });
  });

  it('no gaps, no details', () => {
    expect(gapDetails(plan(500, [station(280, [ccs(150)])]), 'Home', 'Away')).toEqual([]);
  });
});

describe('planTrip: which stations count (R5)', () => {
  it('skips temporarily unavailable and restricted stations, and Level 2 ports', () => {
    const p = plan(500, [station(280, [ccs(350)], { t: 1 }), station(270, [ccs(350)], { rs: 1 }), station(260, [[2, 'j1772', 7, 2]]), station(240, [ccs(50)])]);
    expect(p.stops[0].station.n).toBe('S240');
  });

  it('skips ports with unknown power', () => {
    const p = plan(500, [station(280, [[3, 'ccs1', null, 2]]), station(240, [ccs(50)])]);
    expect(p.stops[0].station.n).toBe('S240');
  });

  const supercharger = (km: number) => station(km, [[3, 'nacs', 250, 8]], { nw: 'Tesla' });

  it('a CCS1 car without Supercharger access is never sent to one', () => {
    const p = plan(500, [supercharger(280), station(240, [ccs(50)])]);
    expect(p.stops[0].station.n).toBe('S240');
  });

  it('a CCS1 car with access via adapter may use one, flagged', () => {
    const p = planTrip({ route: routeOf(500), durationMin: 300, car: car({ rule: carPlugs('ccs1', 'via_adapter')! }), stations: [supercharger(280), station(240, [ccs(50)])] });
    expect(p.stops[0].station.nw).toBe('Tesla');
    expect(p.stops[0].adapter).toBe(true);
    expect(p.stops[0].teslaNetwork).toBe(true);
  });

  it('a non-Tesla NACS car at a Supercharger is flagged; a Tesla is not', () => {
    const nacs = carPlugs('nacs', 'yes')!;
    let p = planTrip({ route: routeOf(500), durationMin: 300, car: car({ rule: nacs }), stations: [supercharger(280)] });
    expect(p.stops[0].teslaNetwork).toBe(true);
    expect(p.stops[0].adapter).toBe(false);
    p = planTrip({ route: routeOf(500), durationMin: 300, car: car({ rule: nacs, isTesla: true }), stations: [supercharger(280)] });
    expect(p.stops[0].teslaNetwork).toBe(false);
  });
});

describe('planTrip: estimates, elevation, settings', () => {
  it('an estimated curve marks the stop estimated ("~")', () => {
    const p = planTrip({ route: routeOf(500), durationMin: 300, car: car({ curve: { points: car().curve.points, estimated: true } }), stations: [station(280, [ccs(150)])] });
    expect(p.stops[0].estimated).toBe(true);
  });

  it('flags the uncalibrated highway factor and estimated car inputs', () => {
    const c = car();
    const p = planTrip({ route: routeOf(100), durationMin: 60, car: { ...c, energy: { ...c.energy, whPerKmBasis: 'rated', massEstimated: true } }, stations: [] });
    expect(p.uncalibratedFactor).toBe(!TRIP.highwayCalibrated);
    expect(p.carEstimated).toBe(true);
  });

  it('climbing uses more battery than the flat', () => {
    const flat = planTrip({ route: routeOf(200), durationMin: 120, car: car(), stations: [] });
    const hill = planTrip({ route: routeOf(200, (km) => km * 5), durationMin: 120, car: car(), stations: [] }); // 1,000 m up
    expect(hill.arriveSoc).toBeLessThan(flat.arriveSoc - 5);
  });

  it('uses the start and threshold given', () => {
    const p = plan(500, [station(150, [ccs(150)]), station(280, [ccs(150)])], { startSoc: 60, thresholdSoc: 20 });
    // From 60 % the car reaches 20 % after 160 km: the 150 km station is in the window.
    expect(p.stops[0].station.n).toBe('S150');
    expect(p.startSoc).toBe(60);
  });

  it('never calls the network', () => {
    const fetchSpy = vi.fn(() => { throw new Error('no network'); });
    vi.stubGlobal('fetch', fetchSpy);
    plan(500, [station(280, [ccs(150)])]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('QA fixes (3.15, 2026-11-16)', () => {
  it('a trip with no charger anywhere is still reachable when the car arrives above 0 % (a gap, not "may not make it")', () => {
    const p = plan(320, []); // arrives at 10 %, below the threshold, with nothing to stop at
    expect(p.stops).toHaveLength(0);
    expect(p.gaps).toHaveLength(1);
    expect(p.arriveSoc).toBeCloseTo(10, 0);
    expect(p.reachable).toBe(true);
  });
  it('a trip with no charger that runs out before the destination is unreachable', () => {
    const p = plan(420, []);
    expect(p.arriveSoc).toBeLessThan(0);
    expect(p.reachable).toBe(false);
  });
  it('charging time uses the station kW capped at the car peak', () => {
    const p = planTrip({ route: routeOf(500), durationMin: 300, car: car({ dcMaxKw: 100 }), stations: [station(280, [ccs(350)])] });
    // 60 % of 80 kWh at 100 kW ≈ 28.8 min, not the 200 kW curve's 14.4 min
    expect(p.stops[0].usableKw).toBe(100);
    expect(p.stops[0].chargeMin).toBeCloseTo(28.8, 0);
  });
});
