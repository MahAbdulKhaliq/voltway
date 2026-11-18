// Trip planner state for the charger map (B50, 3.18; logic from the old /trip page): the From/To
// ends, start % and threshold, the car file, one /api/route call per new pair of ends, and the
// stops planned in the browser (trip-plan.ts), so a new car or new percentages re-plan with no
// new request. The last trip is saved in the browser; a share link is written only on request.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../i18n/t.ts';
import type { MyCar } from '../lib/my-car.ts';
import { getItem, getJSON, setJSON, KEYS } from '../lib/storage.ts';
import type { TripEnd } from '../lib/place-search.ts';
import { apiPoint, readSavedSettings, SOC_LIMITS, writeTripLink, type TripQuery } from '../lib/trip-link.ts';
import { addRecent, readRecent } from '../lib/recent-destinations.ts';
import { planCarFrom, type PlanCarResult } from '../lib/trip-car.ts';
import { planTrip, type TripPlan } from '../lib/trip-plan.ts';
import { buildRoute, type Route } from '../lib/route-geo.ts';
import type { MapFeature } from '../lib/map-data.ts';
import type { RouteBody } from '../lib/ors.ts';
import type { CarDetail } from '../lib/types.ts';
import type { DistanceUnit } from '../lib/units.ts';
import { TRIP } from '../config.ts';
import { avoidList, avoidQuery, NO_AVOID, readRouteOptions, routeOptions, ROUTE_OPTIONS_EVENT, type RouteOptions } from '../lib/route-options.ts';

export type TripStatus = 'idle' | 'planning' | 'done' | 'badRequest' | 'noRoute' | 'busy' | 'offline' | 'error' | 'outsideFrom' | 'outsideTo' | 'outsideBoth';
export interface RouteData { route: Route; durationMin: number; key: string }
export type Locating = 'idle' | 'busy' | 'denied';

const BLANK: TripQuery = { from: null, to: null, startSoc: TRIP.defaultStartSoc, thresholdSoc: TRIP.defaultThresholdSoc };

/** The route's key: the API form of both points, plus the route options (B73), which change the route. */
export const endsKey = (q: Pick<TripQuery, 'from' | 'to'>, o: RouteOptions = NO_AVOID) =>
  (q.from && q.to ? `${apiPoint(q.from)}|${apiPoint(q.to)}|${avoidList(o).join(',')}` : '');
const OUTSIDE = { from: 'outsideFrom', to: 'outsideTo', both: 'outsideBoth' } as const;

/**
 * @param myCar the map's My car
 * @param l3 the Level 3 stations once loaded (the planner's candidates), else null
 * @param l3Failed the station data failed to load (planning can't finish)
 */
export function useTrip(myCar: MyCar | null, l3: MapFeature[] | null, l3Failed = false) {
  const [trip, setTrip] = useState<TripQuery>(BLANK);
  const [detail, setDetail] = useState<CarDetail | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
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
      const changed = next.avoidTolls !== optsRef.current.avoidTolls || next.avoidHighways !== optsRef.current.avoidHighways;
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
  const carUpdated = useMemo(() => (detail ? detail.sources.map((s) => s.accessed_on).filter(Boolean).sort().at(-1) ?? null : null), [detail]);

  const pctValid =
    trip.startSoc >= SOC_LIMITS.startMin && trip.startSoc <= SOC_LIMITS.startMax &&
    trip.thresholdSoc >= SOC_LIMITS.thresholdMin && trip.thresholdSoc <= SOC_LIMITS.thresholdMax &&
    trip.startSoc > trip.thresholdSoc;

  // Plan the stops whenever the route, the car, the percentages or the station data change (no request).
  // Percentages out of range keep the last good plan on screen; the form says what to fix.
  useEffect(() => {
    if (!routeData || !planCar?.ok) { setPlan(null); return; }
    if (!pctValid) return;
    if (!l3) { if (l3Failed) setStatus('error'); return; } // still loading: planning follows
    setPlan(planTrip({ route: routeData.route, durationMin: routeData.durationMin, car: planCar.car, stations: l3, startSoc: trip.startSoc, thresholdSoc: trip.thresholdSoc }));
    setStatus('done');
  }, [routeData, planCar, l3, l3Failed, pctValid, trip.startSoc, trip.thresholdSoc]);

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
    setJSON(KEYS.lastTrip, { startSoc: trip.startSoc, thresholdSoc: trip.thresholdSoc });
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
        // B74: an end outside Canada says which one.
        const err = r.status === 422 ? ((await r.json().catch(() => null)) as { error?: string; end?: keyof typeof OUTSIDE } | null) : null;
        if (gen !== generation.current) return;
        if (err?.error === 'outsideCanada' && err.end && err.end in OUTSIDE) { setStatus(OUTSIDE[err.end]); return; }
        setStatus(r.status === 400 ? 'badRequest' : r.status === 422 ? 'noRoute' : 'busy'); // 429 (firewall), 503 (ORS) → busy
        return;
      }
      const body = (await r.json()) as RouteBody;
      if (gen !== generation.current) return;
      setRouteData({ route: buildRoute(body.coords), durationMin: body.durationMin, key });
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

  const setPct = (k: 'startSoc' | 'thresholdSoc', raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n)) setTrip((x) => ({ ...x, [k]: n }));
  };
  const swap = () => setTrip((x) => ({ ...x, from: x.to, to: x.from }));
  const canPlan = Boolean(trip.from && trip.to && planCar?.ok && pctValid && status !== 'planning');
  /** The plan on screen belongs to the ends in the form. */
  const current = Boolean(plan && routeData && routeData.key === key);

  return {
    trip, setTrip, swap, setPct, pctValid, canPlan, current, opts, setShown,
    planCar, carUpdated, routeData, plan, status, unit,
    submit, start, stop, share, shareUrl, locate, locating,
  };
}

export type TripState = ReturnType<typeof useTrip>;
