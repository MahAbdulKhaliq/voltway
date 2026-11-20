// Trip planner state for the charger map (B50, 3.18; logic from the old /trip page): the From/To
// ends, start % and threshold, the car file, one /api/route call per new pair of ends, and the
// stops planned in the browser (trip-plan.ts), so a new car or new percentages re-plan with no
// new request. The last trip is saved in the browser; a share link is written only on request.

import { inTripCountries } from '../lib/station-country.ts';
import type { CountryCode } from '../lib/country.ts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../i18n/t.ts';
import type { MyCar } from '../lib/my-car.ts';
import { getItem, getJSON, setJSON, KEYS } from '../lib/storage.ts';
import type { TripEnd } from '../lib/place-search.ts';
import { apiPoint, readSavedSettings, SOC_LIMITS, writeTripLink, type TripQuery } from '../lib/trip-link.ts';
import { addRecent, readRecent } from '../lib/recent-destinations.ts';
import { planCarFrom, type PlanCarResult } from '../lib/trip-car.ts';
import { nacsRescue, planTrip, type TripPlan } from '../lib/trip-plan.ts';
import { buildRoute, type Route } from '../lib/route-geo.ts';
import type { MapFeature } from '../lib/map-data.ts';
import type { RouteBody, Crossing } from '../lib/ors.ts';
import type { CarDetail } from '../lib/types.ts';
import type { DistanceUnit } from '../lib/units.ts';
import { TRIP } from '../config.ts';
import { adjustedWhPerKm, type WeatherWheels } from '../lib/trip-energy.ts';
import { heatPumpKind, trimFor, type HeatPumpKind } from '../lib/car-settings.ts';
import { ratedWheelFor, standardWheel, type WheelEffect } from '../lib/wheel-effect.ts';
import { avoidList, avoidQuery, NO_AVOID, readRouteOptions, routeOptions, ROUTE_OPTIONS_EVENT, sameRouteOptions, type RouteOptions } from '../lib/route-options.ts';

export type TripStatus =
  | 'idle' | 'planning' | 'done' | 'badRequest' | 'noRoute' | 'busy' | 'offline' | 'error'
  // B78: the border rule (DESIGN-7 D4); one message each.
  | 'outsideArea' | 'crossBorderCa' | 'crossBorderUs' | 'crossBorderAny' | 'crossBorderAlaska';
export interface RouteData { route: Route; durationMin: number; key: string; countries?: CountryCode[]; crossings?: Crossing[] }
export type Locating = 'idle' | 'busy' | 'denied';

const BLANK: TripQuery = { from: null, to: null, startSoc: TRIP.defaultStartSoc, thresholdSoc: TRIP.defaultThresholdSoc, arriveSoc: TRIP.defaultArriveSoc, weather: false, tempC: 20 };
/** The battery and weather settings kept in the browser with the last trip (B62, B123). */
const savedPart = (q: TripQuery) => ({ startSoc: q.startSoc, thresholdSoc: q.thresholdSoc, arriveSoc: q.arriveSoc, weather: q.weather, tempC: q.tempC });

/** B123: what Weather and wheels works with for My car, and its effect at the trip's temperature. */
export interface WeatherInfo {
  effect: WeatherWheels;
  /** The wheels the plan uses (My car's, else the trim's standard); null when unknown. */
  wheelIn: number | null;
  /** My car's wheels differ from the standard size. */
  wheelsChanged: boolean;
  heatPump: HeatPumpKind;
  heatPumpFitted: boolean;
}

/** The route's key: the API form of both points, plus the route options (B73, B79), which change the route. */
export const endsKey = (q: Pick<TripQuery, 'from' | 'to'>, o: RouteOptions = NO_AVOID) =>
  (q.from && q.to ? `${apiPoint(q.from)}|${apiPoint(q.to)}|${avoidList(o).join(',')}${o.crossBorder ? '|cross' : ''}` : '');
/** The status for a 422 border answer from /api/route (src/lib/ors.ts borderProblem), or null. */
export function borderStatus(body: unknown): TripStatus | null {
  const b = body as { error?: string; country?: string | null; reason?: string } | null;
  if (b?.error === 'outsideArea') return 'outsideArea';
  if (b?.error !== 'crossBorder') return null;
  if (b.reason === 'alaska') return 'crossBorderAlaska';
  return b.country === 'ca' ? 'crossBorderCa' : b.country === 'us' ? 'crossBorderUs' : 'crossBorderAny';
}

/**
 * @param myCar the map's My car
 * @param corridor loads the full Level 3 stations along a route (the planner's candidates, B78: from
 *   the detail tiles the route passes); null until the tile index is in
 * @param dataFailed the station data failed to load (planning can't finish)
 * @param wheelEffect the build's wheel-size effect (B13), for Weather and wheels (B123)
 */
export function useTrip(myCar: MyCar | null, corridor: ((route: Route) => Promise<MapFeature[]>) | null, dataFailed = false, wheelEffect: WheelEffect | null = null) {
  const [trip, setTrip] = useState<TripQuery>(BLANK);
  const [detail, setDetail] = useState<CarDetail | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  /** B76: the trip fails as planned but works with NACS on. */
  const [nacsHelps, setNacsHelps] = useState(false);
  const [status, setStatus] = useState<TripStatus>('idle');
  const [locating, setLocating] = useState<Locating>('idle');
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [shareUrl, setShareUrl] = useState('');
  const [opts, setOpts] = useState<RouteOptions>(NO_AVOID);
  const autoPlan = useRef(false);
  /** Set when the route options change while a trip is shown: it re-plans once (B73). */
  const replan = useRef(false);
  /** The trip (not the form) is on screen; set by the trip panel. */
  const shown = useRef(false);
  const setShown = useCallback((on: boolean) => { shown.current = on; }, []);
  const inflight = useRef('');
  /** Bumped by Close route, so a route reply that lands after it is ignored. */
  const generation = useRef(0);

  useEffect(() => {
    setUnit(getItem(KEYS.units) === 'mi' ? 'mi' : 'km');
    const onUnits = (e: Event) => setUnit((e as CustomEvent).detail === 'mi' ? 'mi' : 'km');
    window.addEventListener('voltway:units', onUnits);
    return () => window.removeEventListener('voltway:units', onUnits);
  }, []);

  // Route options from Settings (B73).
  // Decided when the change arrives, before the panel re-renders: a trip on screen (not the form)
  // plans again once with the new options; on the form the button turns into Plan trip.
  const optsRef = useRef<RouteOptions>(NO_AVOID);
  useEffect(() => {
    optsRef.current = routeOptions();
    setOpts(optsRef.current);
    const on = (e: Event) => {
      const next = readRouteOptions((e as CustomEvent).detail);
      const changed = !sameRouteOptions(next, optsRef.current);
      optsRef.current = next;
      if (!changed) return;
      if (shown.current) replan.current = true;
      setOpts(next);
    };
    window.addEventListener(ROUTE_OPTIONS_EVENT, on);
    return () => window.removeEventListener(ROUTE_OPTIONS_EVENT, on);
  }, []);

  // The car file for My car.
  useEffect(() => {
    if (!myCar) { setDetail(null); return; }
    let alive = true;
    fetch(`/data/cars/${myCar.carId}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((c: CarDetail) => alive && setDetail(c))
      .catch(() => alive && setDetail(null));
    return () => { alive = false; };
  }, [myCar]);
  const planCar: PlanCarResult | null = useMemo(() => (detail ? planCarFrom(detail, myCar?.trimId, myCar?.plugs) : null), [detail, myCar]);
  // B123: Weather and wheels. Worked out whether the switch is on (the card shows the estimate);
  // the plan uses it only while it is on.
  const weatherInfo: WeatherInfo | null = useMemo(() => {
    if (!detail || !planCar?.ok) return null;
    const trim = trimFor(detail.trims, myCar?.trimId);
    const hpRaw = trim?.heat_pump ? String(trim.heat_pump.value.value) : null;
    const chem = detail.fields.chemistry ? String(detail.fields.chemistry.value.value) : null;
    const standardIn = standardWheel(trim);
    const fitted = Boolean(myCar?.heatPump);
    const effect = adjustedWhPerKm(planCar.car.energy.whPerKm, {
      tempC: trip.tempC, heatPump: hpRaw, heatPumpFitted: fitted, chemistry: chem,
      wheelIn: myCar?.wheelIn ?? standardIn, ratedWheelIn: ratedWheelFor(detail.trims, trim), wheelEffect,
    });
    const kind = heatPumpKind(hpRaw);
    return { effect, wheelIn: myCar?.wheelIn ?? standardIn, wheelsChanged: myCar?.wheelIn !== undefined, heatPump: kind, heatPumpFitted: kind === 'optional' && fitted };
  }, [detail, planCar, myCar, trip.tempC, wheelEffect]);
  const tripCar = useMemo(() => {
    if (!planCar?.ok) return null;
    if (!trip.weather || !weatherInfo) return planCar.car;
    return { ...planCar.car, energy: { ...planCar.car.energy, whPerKm: weatherInfo.effect.whPerKm, weatherAdjusted: weatherInfo.effect.factor !== 1 } };
  }, [planCar, trip.weather, weatherInfo]);
  const carUpdated = useMemo(() => (detail ? detail.sources.map((s) => s.accessed_on).filter(Boolean).sort().at(-1) ?? null : null), [detail]);

  const pctValid =
    trip.startSoc >= SOC_LIMITS.startMin && trip.startSoc <= SOC_LIMITS.startMax &&
    trip.thresholdSoc >= SOC_LIMITS.thresholdMin && trip.thresholdSoc <= SOC_LIMITS.thresholdMax &&
    trip.arriveSoc >= SOC_LIMITS.arriveMin && trip.arriveSoc <= SOC_LIMITS.arriveMax &&
    trip.startSoc > trip.thresholdSoc;

  // Plan the stops whenever the route, the car, the percentages or the station data change (no request).
  // Percentages out of range keep the last good plan on screen; the form says what to fix.
  // B78: the stations come from the detail tiles along the route; the card shows "planning" while they load.
  useEffect(() => {
    if (!routeData || !tripCar) { setPlan(null); setNacsHelps(false); return; }
    if (!pctValid) return;
    if (!corridor) { if (dataFailed) setStatus('error'); return; } // still loading: planning follows
    let alive = true;
    setStatus('planning');
    corridor(routeData.route).then(
      (stations) => {
        if (!alive) return;
        // B78: stops stay in the trip's country (a border route passes chargers on the other side).
        const input = { route: routeData.route, durationMin: routeData.durationMin, car: tripCar, stations: inTripCountries(stations, routeData.countries), startSoc: trip.startSoc, thresholdSoc: trip.thresholdSoc, arriveSoc: trip.arriveSoc };
        const next = planTrip(input);
        setPlan(next);
        setNacsHelps(nacsRescue(input, next));
        setStatus('done');
      },
      () => alive && setStatus('error'),
    );
    return () => { alive = false; };
  }, [routeData, tripCar, corridor, dataFailed, pctValid, trip.startSoc, trip.thresholdSoc, trip.arriveSoc]);

  // B123: the battery and weather settings are remembered as they change (once route mode has
  // started, so the blank form never overwrites them).
  const started = useRef(false);
  useEffect(() => {
    if (!started.current) return;
    setJSON(KEYS.lastTrip, { ...getJSON<Record<string, unknown>>(KEYS.lastTrip, {}), ...savedPart(trip) });
  }, [trip.startSoc, trip.thresholdSoc, trip.arriveSoc, trip.weather, trip.tempC]); // eslint-disable-line react-hooks/exhaustive-deps

  // A message about the last request (busy, no route, …) goes once the ends change.
  const key = endsKey(trip, opts);
  useEffect(() => {
    setStatus((s) => (s === 'planning' || s === 'done' || s === 'error' ? s : 'idle'));
  }, [key]);

  const submit = useCallback(async () => {
    const { from, to } = trip;
    if (!from || !to) return;
    setShareUrl('');
    // B62: the browser keeps the battery settings and the destination (Previous destinations),
    // never where the trip started.
    setJSON(KEYS.lastTrip, savedPart(trip));
    setJSON(KEYS.recentDestinations, addRecent(readRecent(getJSON<unknown>(KEYS.recentDestinations, null)), to));
    const key = endsKey(trip, opts);
    if (routeData?.key === key) return; // Same ends: the stops re-plan from the route already here.
    if (inflight.current === key) return; // Already asking for this route.
    inflight.current = key;
    const gen = generation.current;
    setStatus('planning');
    setPlan(null);
    try {
      const r = await fetch(`/api/route?from=${apiPoint(from)}&to=${apiPoint(to)}${avoidQuery(opts)}`);
      if (gen !== generation.current) return; // Close route came first
      if (!r.ok) {
        setRouteData(null);
        // B78: a trip outside the area or across the border says so.
        const border = r.status === 422 ? borderStatus(await r.json().catch(() => null)) : null;
        if (gen !== generation.current) return;
        if (border) { setStatus(border); return; }
        setStatus(r.status === 400 ? 'badRequest' : r.status === 422 ? 'noRoute' : 'busy'); // 429 (firewall), 503 (ORS) → busy
        return;
      }
      const body = (await r.json()) as RouteBody;
      if (gen !== generation.current) return;
      setRouteData({ route: buildRoute(body.coords), durationMin: body.durationMin, key, countries: body.countries, crossings: body.crossings });
    } catch {
      if (gen !== generation.current) return;
      setRouteData(null);
      setStatus(navigator.onLine === false ? 'offline' : 'busy');
    } finally {
      inflight.current = '';
    }
  }, [trip, routeData, opts]);

  // The re-plan asked for above runs once submit carries the new options.
  useEffect(() => {
    if (replan.current) { replan.current = false; submit(); }
  }, [submit]);

  // A link with both ends plans as soon as the car is known.
  useEffect(() => {
    if (autoPlan.current && planCar?.ok) { autoPlan.current = false; submit(); }
  }, [planCar, submit]);

  const locate = useCallback((quiet = false) => {
    if (!navigator.geolocation) { if (!quiet) setLocating('denied'); return; }
    setLocating('busy');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTrip((x) => (quiet && x.from ? x : { ...x, from: { label: t('trip.myLocation'), lat: pos.coords.latitude, lon: pos.coords.longitude } }));
        setLocating('idle');
      },
      () => setLocating(quiet ? 'idle' : 'denied'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  }, []);

  /**
   * Opens route mode. A link's ends win (both ends → plan at once); otherwise the form starts with
   * the saved battery settings and `to` (a searched place or a previous destination). From falls
   * back to the browser location only when the browser already allows it (B33): nothing is asked
   * without a press. No start is remembered (B62).
   */
  const start = useCallback((opts: { to?: TripEnd; link?: TripQuery } = {}) => {
    const settings = readSavedSettings(getJSON<unknown>(KEYS.lastTrip, null));
    const base: TripQuery = opts.link ? opts.link : { ...BLANK, ...settings, to: opts.to ?? null };
    setTrip(base);
    started.current = true;
    setShareUrl('');
    autoPlan.current = Boolean(opts.link?.from && opts.link?.to);
    if (!base.from && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((p) => { if (p.state === 'granted') locate(true); }, () => {});
    }
  }, [locate]);

  /** Leaves route mode: the route and plan go; the last trip stays saved. */
  const stop = useCallback(() => {
    generation.current += 1;
    inflight.current = '';
    setRouteData(null);
    setPlan(null);
    setStatus('idle');
    setShareUrl('');
    autoPlan.current = false;
  }, []);

  const share = async () => {
    const url = `${window.location.origin}/?${writeTripLink(trip)}`;
    setShareUrl(url);
    try { await navigator.clipboard?.writeText(url); } catch { /* the link is shown to copy by hand */ }
  };

  const setPct = (k: 'startSoc' | 'thresholdSoc' | 'arriveSoc', raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n)) setTrip((x) => ({ ...x, [k]: n }));
  };
  const setWeather = (on: boolean) => setTrip((x) => ({ ...x, weather: on }));
  const setTempC = (c: number) => setTrip((x) => ({ ...x, tempC: Math.round(c * 10) / 10 }));
  const swap = () => setTrip((x) => ({ ...x, from: x.to, to: x.from }));
  const canPlan = Boolean(trip.from && trip.to && planCar?.ok && pctValid && status !== 'planning');
  /** The plan on screen belongs to the ends in the form. */
  const current = Boolean(plan && routeData && routeData.key === key);

  return {
    trip, setTrip, swap, setPct, setWeather, setTempC, weatherInfo, pctValid, canPlan, current, opts, setShown,
    planCar, carUpdated, routeData, plan, nacsHelps, status, unit,
    submit, start, stop, share, shareUrl, locate, locating,
  };
}

export type TripState = ReturnType<typeof useTrip>;
