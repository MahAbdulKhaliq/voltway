// The trip planner (route-planner.md, DESIGN-3 §3c): From/To with instant place suggestions,
// the car (My car), start % and threshold, then one /api/route call; the stops are planned here
// in the browser (trip-plan.ts), so changing the car re-plans the same route with no new request.

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import CarPicker from './CarPicker.tsx';
import TripResults from './TripResults.tsx';
import { carMapInfo } from '../lib/map-filter.ts';
import { getMyCar, setMyCar, type MyCar } from '../lib/my-car.ts';
import { getItem, getJSON, setJSON, KEYS } from '../lib/storage.ts';
import { makePlaceSearch, type PlaceRow, type PlaceSearch, type TripEnd } from '../lib/place-search.ts';
import { apiPoint, readSavedTrip, readTripLink, SOC_LIMITS, writeTripLink, type TripQuery } from '../lib/trip-link.ts';
import { planCarFrom, type PlanCarResult } from '../lib/trip-car.ts';
import { planTrip, type TripPlan } from '../lib/trip-plan.ts';
import { buildRoute, type Route } from '../lib/route-geo.ts';
import type { MapFeatureCollection, MapMeta } from '../lib/map-data.ts';
import type { RouteBody } from '../lib/ors.ts';
import type { CarDetail, IndexEntry } from '../lib/types.ts';
import type { DistanceUnit } from '../lib/units.ts';
import { MAP, TRIP } from '../config.ts';

interface Props { cars: IndexEntry[] }

type Status = 'idle' | 'planning' | 'done' | 'badRequest' | 'noRoute' | 'busy' | 'offline' | 'error';
interface RouteData { route: Route; durationMin: number; body: RouteBody; key: string }

// ---- Shared, lazily loaded data (one fetch per visit).
let placesPromise: Promise<PlaceSearch> | null = null;
const loadPlaces = () =>
  (placesPromise ??= fetch('/data/places.json').then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((rows: PlaceRow[]) => makePlaceSearch(rows)));
let stationsPromise: Promise<MapFeatureCollection> | null = null;
const loadStations = () =>
  (stationsPromise ??= fetch(`${MAP.dataUrl}/l3.json`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))));


// ---- One From/To field: instant suggestions from the place list, and the address service on press.

interface FieldProps {
  label: string;
  value: TripEnd | null;
  onChange: (end: TripEnd | null) => void;
  search: PlaceSearch | null;
  extra?: React.ReactNode;
}

function PlaceField({ label, value, onChange, search, extra }: FieldProps) {
  const id = useId();
  const [text, setText] = useState(value?.label ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [remote, setRemote] = useState<TripEnd[] | null>(null);
  const [remoteState, setRemoteState] = useState<'idle' | 'loading' | 'none' | 'busy'>('idle');

  // Show a picked end's label; clearing the pick (while typing) leaves the typed text alone.
  useEffect(() => { if (value) setText(value.label); }, [value]);
  const local = useMemo(() => (search && open ? search(text) : []), [search, text, open]);
  const options = remote ?? local;
  useEffect(() => setActive(-1), [text, remote]);

  const pick = (end: TripEnd) => {
    onChange(end);
    setText(end.label);
    setOpen(false);
    setRemote(null);
    setRemoteState('idle');
  };
  const searchAddress = async () => {
    const q = text.trim();
    if (q.length < 3) return;
    setOpen(true);
    setRemoteState('loading');
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error(String(r.status));
      const { places } = (await r.json()) as { places: { label: string; lat: number; lon: number }[] };
      setRemote(places);
      setRemoteState(places.length ? 'idle' : 'none');
    } catch {
      setRemote([]);
      setRemoteState('busy');
    }
  };
  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;
  const showList = open && text.trim() !== '' && (value?.label !== text || remote !== null);
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); setRemote(null); return; }
    if (!showList || !options.length) {
      if (e.key === 'Enter') { e.preventDefault(); searchAddress(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? options.length - 1 : a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(options[Math.max(0, active)]); }
  };

  return (
    <div className="tp-field">
      <label htmlFor={`${id}-in`} className="tp-label">{label}</label>
      <div className="tp-input-row">
        <input
          id={`${id}-in`}
          type="search"
          className="field-input"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? optId(active) : undefined}
          placeholder={t('trip.placePlaceholder')}
          autoComplete="off"
          value={text}
          onChange={(e) => { setText(e.target.value); setOpen(true); setRemote(null); setRemoteState('idle'); if (value) onChange(null); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKey}
        />
        {extra}
      </div>
      {showList && (
        <ul id={listId} role="listbox" className="cp-suggest" aria-label={t('trip.suggestions', { field: label })}>
          {options.map((o, i) => (
            <li key={`${o.label}-${i}`} id={optId(i)} role="option" aria-selected={i === active} className={i === active ? 'on' : undefined}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}>
              {o.label}
            </li>
          ))}
          {remoteState === 'loading' && <li role="presentation" className="muted cp-none">{t('trip.addressSearching')}</li>}
          {remoteState === 'none' && <li role="presentation" className="muted cp-none">{t('trip.addressNone')}</li>}
          {remoteState === 'busy' && <li role="presentation" className="muted cp-none">{t('trip.busy')}</li>}
          {remote === null && (
            <li role="presentation" className="tp-address">
              <button type="button" className="btn small" onMouseDown={(e) => e.preventDefault()} onClick={searchAddress} disabled={text.trim().length < 3}>
                {t('trip.searchAddress')}
              </button>
              {!options.length && <span className="muted small"> {t('trip.noPlace')}</span>}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ---- The page.

export default function TripPlanner({ cars }: Props) {
  const [search, setSearch] = useState<PlaceSearch | null>(null);
  const [trip, setTrip] = useState<TripQuery>({ from: null, to: null, startSoc: TRIP.defaultStartSoc, thresholdSoc: TRIP.defaultThresholdSoc });
  const [myCar, setMyCarState] = useState<MyCar | null>(null);
  const [changingCar, setChangingCar] = useState(false);
  const [detail, setDetail] = useState<CarDetail | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [locating, setLocating] = useState<'idle' | 'busy' | 'denied'>('idle');
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [shareUrl, setShareUrl] = useState('');
  const [ready, setReady] = useState(false);
  const autoPlan = useRef(false);
  const inflight = useRef('');

  // Start-up: places, units, My car, and the trip from a link or the last saved one.
  useEffect(() => {
    loadPlaces().then((s) => setSearch(() => s)).catch(() => setSearch(null)); // a function: wrap it, or React calls it as an updater
    setUnit(getItem(KEYS.units) === 'mi' ? 'mi' : 'km');
    const onUnits = (e: Event) => setUnit((e as CustomEvent).detail === 'mi' ? 'mi' : 'km');
    const onCar = (e: Event) => setMyCarState((e as CustomEvent).detail ?? null);
    window.addEventListener('voltway:units', onUnits);
    window.addEventListener('voltway:mycar', onCar);
    setMyCarState(getMyCar());
    const linked = readTripLink(window.location.search);
    const saved = readSavedTrip(getJSON<unknown>(KEYS.lastTrip, null));
    if (linked) {
      // A link's ends win; a missing end falls back to the saved trip's (e.g. "Plan a trip to here").
      setTrip({ ...linked, from: linked.from ?? saved?.from ?? null });
      autoPlan.current = Boolean(linked.from && linked.to);
    } else if (saved) setTrip(saved);
    setReady(true);
    return () => {
      window.removeEventListener('voltway:units', onUnits);
      window.removeEventListener('voltway:mycar', onCar);
    };
  }, []);

  // The car file for My car.
  useEffect(() => {
    setDetail(null);
    if (!myCar) return;
    let alive = true;
    fetch(`/data/cars/${myCar.carId}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((c: CarDetail) => alive && setDetail(c))
      .catch(() => alive && setDetail(null));
    return () => { alive = false; };
  }, [myCar]);

  const carInfo = useMemo(() => (detail ? carMapInfo(detail) : null), [detail]);
  const [updated, setUpdated] = useState<string | null>(null);
  useEffect(() => {
    fetch(`${MAP.dataUrl}/meta.json`).then((r) => (r.ok ? r.json() : null)).then((m: MapMeta | null) => setUpdated(m?.updated ?? null)).catch(() => {});
  }, []);

  const planCar: PlanCarResult | null = useMemo(() => (detail ? planCarFrom(detail, myCar?.trimId) : null), [detail, myCar]);

  // Plan the stops whenever the route, the car or the percentages change (no network request).
  useEffect(() => {
    if (!routeData || !planCar?.ok) { setPlan(null); return; }
    let alive = true;
    loadStations()
      .then((fc) => {
        if (!alive) return;
        setPlan(planTrip({ route: routeData.route, durationMin: routeData.durationMin, car: planCar.car, stations: fc.features, startSoc: trip.startSoc, thresholdSoc: trip.thresholdSoc }));
        setStatus('done');
      })
      .catch(() => alive && setStatus(navigator.onLine === false ? 'offline' : 'error'));
    return () => { alive = false; };
  }, [routeData, planCar, trip.startSoc, trip.thresholdSoc]);

  const submit = useCallback(async () => {
    const { from, to } = trip;
    if (!from || !to) return;
    setShareUrl('');
    setJSON(KEYS.lastTrip, trip);
    const key = `${apiPoint(from)}|${apiPoint(to)}`;
    if (routeData?.key === key) return; // Same ends: the stops re-plan from the route already here.
    if (inflight.current === key) return; // Already asking for this route.
    inflight.current = key;
    setStatus('planning');
    setPlan(null);
    try {
      const r = await fetch(`/api/route?from=${apiPoint(from)}&to=${apiPoint(to)}`);
      if (!r.ok) {
        setRouteData(null);
        setStatus(r.status === 400 ? 'badRequest' : r.status === 422 ? 'noRoute' : 'busy'); // 429 (firewall), 503 (ORS) → busy
        return;
      }
      const body = (await r.json()) as RouteBody;
      setRouteData({ route: buildRoute(body.coords), durationMin: body.durationMin, body, key });
    } catch {
      setRouteData(null);
      setStatus(navigator.onLine === false ? 'offline' : 'busy');
    } finally {
      inflight.current = '';
    }
  }, [trip, routeData]);

  // A shared link with both ends plans as soon as the car is known.
  useEffect(() => {
    if (autoPlan.current && planCar?.ok) { autoPlan.current = false; submit(); }
  }, [planCar, submit]);

  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocating('denied'); return; }
    setLocating('busy');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTrip((x) => ({ ...x, from: { label: t('trip.myLocation'), lat: pos.coords.latitude, lon: pos.coords.longitude } }));
        setLocating('idle');
      },
      () => setLocating('denied'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  };

  const share = async () => {
    const url = `${window.location.origin}/trip?${writeTripLink(trip)}`;
    setShareUrl(url);
    try { await navigator.clipboard?.writeText(url); } catch { /* the link is shown to copy by hand */ }
  };

  const setPct = (k: 'startSoc' | 'thresholdSoc', raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n)) setTrip((x) => ({ ...x, [k]: n }));
  };
  const pctValid =
    trip.startSoc >= SOC_LIMITS.startMin && trip.startSoc <= SOC_LIMITS.startMax &&
    trip.thresholdSoc >= SOC_LIMITS.thresholdMin && trip.thresholdSoc <= SOC_LIMITS.thresholdMax &&
    trip.startSoc > trip.thresholdSoc;
  const carLabel = myCar ? (myCar.label ?? cars.find((c) => c.id === myCar.carId)?.name ?? myCar.carId) : '';
  const canPlan = Boolean(trip.from && trip.to && planCar?.ok && pctValid && status !== 'planning');
  const endsKey = trip.from && trip.to ? `${apiPoint(trip.from)}|${apiPoint(trip.to)}` : "";
  const current = routeData?.key === endsKey;

  if (!ready) return <p className="muted">{t('trip.loading')}</p>;

  if (!myCar || changingCar) {
    return (
      <CarPicker
        cars={cars}
        level={2}
        onPick={(carId, trimId) => {
          const e = cars.find((c) => c.id === carId);
          setMyCar({ carId, trimId, label: e ? `${e.model} ${e.name}` : undefined });
          setChangingCar(false);
        }}
        onCancel={myCar ? () => setChangingCar(false) : undefined}
      />
    );
  }

  return (
    <div className="tp">
      <form className="tp-form card" onSubmit={(e) => { e.preventDefault(); submit(); }} aria-label={t('trip.formLabel')}>
        <PlaceField
          label={t('trip.from')}
          value={trip.from}
          search={search}
          onChange={(from) => setTrip((x) => ({ ...x, from }))}
          extra={
            <button type="button" className="btn small" onClick={useMyLocation} disabled={locating === 'busy'}>
              {locating === 'busy' ? t('trip.locating') : t('trip.useLocation')}
            </button>
          }
        />
        {locating === 'denied' && <p className="small muted" role="status">{t('trip.locationDenied')}</p>}
        <PlaceField label={t('trip.to')} value={trip.to} search={search} onChange={(to) => setTrip((x) => ({ ...x, to }))} />

        <div className="tp-car">
          <span className="tp-label">{t('trip.car')}</span>
          <span className="tp-car-name">{carLabel}</span>
          <button type="button" className="btn small" onClick={() => setChangingCar(true)}>{t('trip.changeCar')}</button>
        </div>
        {planCar && !planCar.ok && (
          <p className="banner" role="status">
            {t('trip.carMissing', { fields: planCar.missing.map((m) => t(`trip.missing.${m}` as MessageKey)).join(', ') })}
          </p>
        )}

        <div className="tp-pcts">
          <label>
            <span className="tp-label">{t('trip.startSoc')}</span>
            <input type="number" className="field-input" min={SOC_LIMITS.startMin} max={SOC_LIMITS.startMax} step={5}
              value={trip.startSoc} onChange={(e) => setPct('startSoc', e.target.value)} />
          </label>
          <label>
            <span className="tp-label">{t('trip.thresholdSoc')}</span>
            <input type="number" className="field-input" min={SOC_LIMITS.thresholdMin} max={SOC_LIMITS.thresholdMax} step={5}
              value={trip.thresholdSoc} onChange={(e) => setPct('thresholdSoc', e.target.value)} />
          </label>
        </div>
        {!pctValid && <p className="small tp-error" role="alert">{t('trip.pctInvalid', { ...SOC_LIMITS })}</p>}

        <div className="tp-actions">
          <button type="submit" className="btn primary" disabled={!canPlan}>
            {status === 'planning' ? t('trip.planning') : t('trip.plan')}
          </button>
          {plan && current && <button type="button" className="btn" onClick={share}>{t('trip.share')}</button>}
        </div>
        {shareUrl && (
          <p className="small tp-share" role="status">
            {t('trip.shareNote')} <input className="field-input" readOnly value={shareUrl} onFocus={(e) => e.target.select()} aria-label={t('trip.shareLink')} />
          </p>
        )}
      </form>

      <div aria-live="polite">
        {status !== 'idle' && status !== 'done' && status !== 'planning' && (
          <p className="banner" role="alert">{t(`trip.status.${status}` as MessageKey)}</p>
        )}
        {plan && current && <p className="sr-only" role="status">{t('trip.planned', { stops: plan.totals.stops })}</p>}
      </div>
      {plan && current && routeData && myCar && trip.from && trip.to && (
        <TripResults plan={plan} route={routeData.route} routeKey={routeData.key} from={trip.from} to={trip.to} unit={unit} myCar={myCar} carInfo={carInfo} updated={updated} />
      )}
    </div>
  );
}
