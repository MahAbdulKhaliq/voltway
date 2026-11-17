// Stop planner (route-planner.md §4–§5, R4, R5): the simple threshold rule, written out.
// Pure and separate from the routing call (user-flows.md §4): one route can be planned for any car
// in the browser, so "Change car" and a later multi-car comparison need no second route request.

import { TRIP } from '../config.ts';
import { calculateCharge, type CurvePoint } from './charging.ts';
import type { MapFeature, MapStationProps } from './map-data.ts';
import { carCanUse, needsAdapter, SUPERCHARGER_NETWORK, type CarPlugRule } from './map-filter.ts';
import type { Plug } from './power-bands.ts';
import { nearRoute, type LonLat, type Route } from './route-geo.ts';
import { socDrop, stretchKwh, type TripCar } from './trip-energy.ts';

/** First search distance from the route, then the wider one (§4 steps 1 and 3). */
export const NEAR_KM = 2;
export const WIDE_KM = 10;
/** The stop window: arrive with threshold … threshold + this many % (§4 step 1). */
export const WINDOW_SOC = 20;
/** An "earlier charger" must be at least this far past the last stop, so the plan always moves on. */
const MIN_PROGRESS_KM = 1;

export interface PlanCar {
  energy: TripCar;
  /** The car's default curve and whether it is an estimate (estimated kind, or B24 extrapolation). */
  curve: { points: CurvePoint[]; estimated: boolean };
  rule: CarPlugRule;
  isTesla: boolean;
  /** The car's DC peak (kW); null = use the curve's highest point. */
  dcMaxKw: number | null;
}

export interface PlanInput {
  route: Route;
  /** Driving time for the whole route from the routing service (minutes). */
  durationMin: number;
  car: PlanCar;
  /** Level 3 stations (public/data/map/l3.json features). */
  stations: readonly MapFeature[];
  startSoc?: number;
  thresholdSoc?: number;
}

/** How a stop was found: in the window ≤ 2 km, in the window ≤ 10 km, an earlier charger, or past a gap. */
export type StopPick = 'window' | 'wide' | 'earlier' | 'afterGap';

export interface TripStop {
  station: MapStationProps;
  lonLat: [number, number];
  alongKm: number;
  /** Distance from the route (km); the detour is out and back. */
  offKm: number;
  detourKm: number;
  detourMin: number;
  /** The port used: plug, its rated kW, and whether a non-NACS car needs an adapter there. */
  plug: Plug;
  stationKw: number;
  /** Power the car can actually use there: station kW capped at the car's peak. */
  usableKw: number;
  adapter: boolean;
  /** A non-Tesla car at a Tesla Supercharger (access varies by site). */
  teslaNetwork: boolean;
  arriveSoc: number;
  departSoc: number;
  chargeMin: number;
  overheadMin: number;
  /** Charging time comes from an estimated curve, a gross battery or SoC outside the measured points ("~"). */
  estimated: boolean;
  pick: StopPick;
}

export interface TripLeg {
  fromKm: number;
  toKm: number;
  distanceKm: number;
  driveMin: number;
  departSoc: number;
  arriveSoc: number;
}

export interface ChargingGap { fromKm: number; toKm: number }

export interface TripPlan {
  stops: TripStop[];
  /** One more leg than stops: start → stop 1 → … → destination. Distances along the route (no detours). */
  legs: TripLeg[];
  gaps: ChargingGap[];
  startSoc: number;
  thresholdSoc: number;
  arriveSoc: number;
  /** False when the car would run out on some stretch (a gap with nothing after it, or arrival below 0 %). */
  reachable: boolean;
  totals: {
    distanceKm: number;
    driveMin: number;
    chargeMin: number;
    overheadMin: number;
    totalMin: number;
    stops: number;
  };
  /** Car inputs that make every figure an estimate (B47 weight, B10 gross battery). */
  carEstimated: boolean;
  /** The highway factor is not calibrated yet (R10, B46) and this car has no tested highway figure. */
  uncalibratedFactor: boolean;
}

interface Candidate {
  station: MapFeature;
  alongKm: number;
  offKm: number;
  plug: Plug;
  stationKw: number;
  usableKw: number;
  adapter: boolean;
}

/** The station's best Level 3 port this car can use (highest known kW), or null. */
export function bestPort(p: MapStationProps, rule: CarPlugRule): { plug: Plug; kw: number; adapter: boolean } | null {
  let best: { plug: Plug; kw: number; adapter: boolean } | null = null;
  for (const [level, plug, kw] of p.p) {
    if (level !== 3 || kw == null || !(kw > 0) || !carCanUse(rule, plug, p.nw)) continue;
    if (!best || kw > best.kw) best = { plug, kw, adapter: needsAdapter(rule, plug, p.nw) };
  }
  return best;
}

/** A station a planned stop may use: open (not temporarily unavailable), not restricted, a compatible L3 port. */
export function usableStation(p: MapStationProps, rule: CarPlugRule): boolean {
  return !p.t && !p.rs && bestPort(p, rule) !== null;
}

export function planTrip(input: PlanInput): TripPlan {
  const { route, car } = input;
  const start = input.startSoc ?? TRIP.defaultStartSoc;
  const threshold = input.thresholdSoc ?? TRIP.defaultThresholdSoc;
  const target = TRIP.chargeToSoc;
  const minPerKm = route.totalKm > 0 ? input.durationMin / route.totalKm : 0;
  const peak = car.dcMaxKw ?? Math.max(...car.curve.points.map((p) => p.power_kw));

  // Energy used from the start to each route point (kWh); SoC between two points of the route is a difference.
  const cumKwh = [0];
  for (let i = 1; i < route.coords.length; i++) {
    const a = route.coords[i - 1], b = route.coords[i];
    const climb = (b[2] ?? 0) - (a[2] ?? 0);
    cumKwh.push(cumKwh[i - 1] + stretchKwh(car.energy, route.cumKm[i] - route.cumKm[i - 1], climb));
  }
  const kwhAt = (km: number): number => {
    if (km <= 0) return 0;
    if (km >= route.totalKm) return cumKwh[cumKwh.length - 1];
    let lo = 0, hi = route.cumKm.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (route.cumKm[m] <= km) lo = m; else hi = m; }
    const span = route.cumKm[hi] - route.cumKm[lo];
    const t = span > 0 ? (km - route.cumKm[lo]) / span : 0;
    return cumKwh[lo] + t * (cumKwh[hi] - cumKwh[lo]);
  };
  const flatDrop = (km: number) => socDrop(car.energy, (car.energy.whPerKm * km) / 1000);
  /** SoC on reaching `km`, having left `fromKm` with `soc` (regen can't fill past 100 % in this simple model). */
  const socAt = (fromKm: number, soc: number, km: number) => Math.min(100, soc - socDrop(car.energy, kwhAt(km) - kwhAt(fromKm)));
  /** First distance after `fromKm` where SoC falls to `level` (route end if never). */
  const kmWhere = (fromKm: number, soc: number, level: number): number => {
    let prevKm = fromKm, prevSoc = soc;
    for (let i = 0; i < route.cumKm.length; i++) {
      const km = route.cumKm[i];
      if (km <= fromKm) continue;
      const s = socAt(fromKm, soc, km);
      if (s <= level) return prevSoc === s ? km : prevKm + ((prevSoc - level) / (prevSoc - s)) * (km - prevKm);
      prevKm = km; prevSoc = s;
    }
    return route.totalKm;
  };

  // Compatible stations within the wide distance, along the route.
  const candidates: Candidate[] = [];
  for (const n of nearRoute(route, input.stations.filter((s) => usableStation(s.properties, car.rule)), (s) => s.geometry.coordinates as LonLat, WIDE_KM)) {
    const port = bestPort(n.item.properties, car.rule)!;
    candidates.push({ station: n.item, alongKm: n.alongKm, offKm: n.offKm, plug: port.plug, stationKw: port.kw, usableKw: Math.min(port.kw, peak), adapter: port.adapter });
  }
  const arrival = (c: Candidate, fromKm: number, soc: number) => socAt(fromKm, soc, c.alongKm) - flatDrop(c.offKm);
  const best = (list: Candidate[]) => list.sort((a, b) => b.usableKw - a.usableKw || b.alongKm - a.alongKm)[0];

  const stops: TripStop[] = [];
  const gaps: ChargingGap[] = [];
  let pos = 0, soc = start, reachable = true;

  for (let guard = 0; guard < 200; guard++) {
    if (socAt(pos, soc, route.totalKm) >= threshold) break;
    const hitKm = kmWhere(pos, soc, threshold);
    const ahead = candidates.filter((c) => c.alongKm > pos + MIN_PROGRESS_KM && c.alongKm <= hitKm);
    const inWindow = (c: Candidate) => { const a = arrival(c, pos, soc); return a >= threshold && a <= threshold + WINDOW_SOC; };
    const usable = (c: Candidate) => arrival(c, pos, soc) >= threshold && arrival(c, pos, soc) < target;

    let pick: StopPick = 'window';
    let chosen = best(ahead.filter((c) => c.offKm <= NEAR_KM && inWindow(c)));
    if (!chosen) { pick = 'wide'; chosen = best(ahead.filter((c) => inWindow(c))); }
    if (!chosen) {
      pick = 'earlier';
      chosen = ahead.filter(usable).sort((a, b) => b.alongKm - a.alongKm)[0];
    }
    if (!chosen) {
      // Charging gap: nothing reachable before the threshold. Mark it, then carry on to the next charger past it.
      pick = 'afterGap';
      const next = candidates.filter((c) => c.alongKm > hitKm).sort((a, b) => a.alongKm - b.alongKm)[0];
      gaps.push({ fromKm: pos, toKm: next ? next.alongKm : route.totalKm });
      // No charger past the gap: drive on; the arrival check after the loop decides reachability.
      if (!next) break;
      chosen = next;
    }

    const arriveSoc = arrival(chosen, pos, soc);
    if (arriveSoc <= 0) reachable = false;
    const fromSoc = Math.max(0, arriveSoc);
    const r = calculateCharge({ points: car.curve.points, usableKwh: car.energy.batteryKwh, startSoc: fromSoc, endSoc: target, chargerKw: chosen.usableKw });
    const detourKm = 2 * chosen.offKm;
    const p = chosen.station.properties;
    stops.push({
      station: p,
      lonLat: chosen.station.geometry.coordinates,
      alongKm: chosen.alongKm,
      offKm: chosen.offKm,
      detourKm,
      detourMin: detourKm * minPerKm,
      plug: chosen.plug,
      stationKw: chosen.stationKw,
      usableKw: chosen.usableKw,
      adapter: chosen.adapter,
      teslaNetwork: !car.isTesla && p.nw === SUPERCHARGER_NETWORK,
      arriveSoc,
      departSoc: target,
      chargeMin: r.minutes,
      overheadMin: TRIP.stopOverheadMin,
      estimated: car.curve.estimated || r.extrapolated || car.energy.batteryBasis === 'gross',
      pick,
    });
    // Back to the route with the way back taken off.
    pos = chosen.alongKm;
    soc = target - flatDrop(chosen.offKm);
  }

  const arriveSoc = socAt(pos, soc, route.totalKm);
  if (arriveSoc <= 0) reachable = false;

  // Legs between start, stops and destination.
  const legs: TripLeg[] = [];
  let legFrom = 0, legSoc = start;
  for (const s of stops) {
    legs.push({ fromKm: legFrom, toKm: s.alongKm, distanceKm: s.alongKm - legFrom, driveMin: (s.alongKm - legFrom) * minPerKm, departSoc: legSoc, arriveSoc: s.arriveSoc });
    legFrom = s.alongKm;
    legSoc = s.departSoc;
  }
  legs.push({ fromKm: legFrom, toKm: route.totalKm, distanceKm: route.totalKm - legFrom, driveMin: (route.totalKm - legFrom) * minPerKm, departSoc: legSoc, arriveSoc });

  const detourKm = stops.reduce((a, s) => a + s.detourKm, 0);
  const driveMin = input.durationMin + stops.reduce((a, s) => a + s.detourMin, 0);
  const chargeMin = stops.reduce((a, s) => a + s.chargeMin, 0);
  const overheadMin = stops.reduce((a, s) => a + s.overheadMin, 0);
  return {
    stops,
    legs,
    gaps,
    startSoc: start,
    thresholdSoc: threshold,
    arriveSoc,
    reachable,
    totals: { distanceKm: route.totalKm + detourKm, driveMin, chargeMin, overheadMin, totalMin: driveMin + chargeMin + overheadMin, stops: stops.length },
    carEstimated: car.energy.massEstimated || car.energy.batteryBasis === 'gross',
    uncalibratedFactor: car.energy.whPerKmBasis === 'rated' && !TRIP.highwayCalibrated,
  };
}
