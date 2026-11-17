// Trip results (route-planner.md §7): the map, the itinerary (start → legs and stops → arrival)
// with totals, inline warnings, and per-stop links. The itinerary is an ordered list, so it is
// also the accessible version of the map. On phones (≤ 640 px) it is a bottom sheet under the map:
// the title and totals show, and a button opens the rest over the map (3.14).

import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import StationPanel from './StationPanel.tsx';
import type { MapFeature } from '../lib/map-data.ts';
import type { CarMapInfo } from '../lib/map-filter.ts';
import type { MyCar } from '../lib/my-car.ts';
import type { TripEnd } from '../lib/place-search.ts';
import { sliceRoute, type Route } from '../lib/route-geo.ts';
import { directionsUrls } from '../lib/station-details.ts';
import { NEAR_KM, type TripPlan, type TripStop } from '../lib/trip-plan.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import { TRIP } from '../config.ts';

const TripMap = lazy(() => import('./TripMap.tsx'));

interface Props {
  plan: TripPlan;
  route: Route;
  routeKey: string;
  from: TripEnd;
  to: TripEnd;
  unit: DistanceUnit;
  myCar: MyCar;
  carInfo: CarMapInfo | null;
  /** Charger data date (map meta.json), YYYY-MM-DD. */
  updated: string | null;
}

/** Minutes → "1 h 55 min" / "45 min" / "2 h". */
export function hoursMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  if (!h) return t('fmt.min', { value: m });
  return m % 60 ? t('trip.hm', { h, m: m % 60 }) : t('trip.h', { h });
}

function showDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

const pct = (x: number) => formatNumber(Math.round(x));

/** "See the charging curve for this stop": the car, this charger's usable kW and this stop's window. */
export function stopCurveHref(car: MyCar, stop: Pick<TripStop, 'usableKw' | 'arriveSoc' | 'departSoc'>): string {
  const q = new URLSearchParams({ car: car.carId });
  if (car.trimId) q.set('trim', car.trimId);
  q.set('kw', String(Math.round(stop.usableKw)));
  q.set('from', String(Math.max(0, Math.round(stop.arriveSoc))));
  q.set('to', String(Math.round(stop.departSoc)));
  return `/charging?${q.toString()}`;
}

export default function TripResults({ plan, route, routeKey, from, to, unit, myCar, carInfo, updated }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const bodyId = useId();
  // "Open charger" in the itinerary: focus goes back to that button when the panel closes.
  const openButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const openedFromList = useRef<number | null>(null);
  useEffect(() => setSelected(null), [plan]);
  const closePanel = () => {
    const back = openedFromList.current;
    openedFromList.current = null;
    setSelected(null);
    if (back !== null) requestAnimationFrame(() => openButtons.current[back]?.focus());
  };
  const dist = (km: number) => `${formatNumber(kmTo(km, unit))} ${unit}`;
  const tilde = (estimated: boolean) => (estimated ? '~' : '');

  const anyEstimated = plan.carEstimated || plan.stops.some((s) => s.estimated);
  const anyTesla = plan.stops.some((s) => s.teslaNetwork);
  /** Nothing compatible anywhere the car needed a charge: say so first, in plain words. */
  const noChargers = plan.stops.length === 0 && plan.gaps.length > 0;
  const line = useMemo(() => route.coords.map((p) => [p[0], p[1]] as [number, number]), [route]);
  const gapLines = useMemo(() => plan.gaps.map((g) => sliceRoute(route, g.fromKm, g.toKm)), [plan, route]);
  const mapStops = useMemo(() => plan.stops.map((s, i) => ({ lonLat: s.lonLat, n: i + 1 })), [plan]);
  const selectedStop = selected !== null ? plan.stops[selected] : null;
  const panelStation: MapFeature | null = selectedStop
    ? { type: 'Feature', geometry: { type: 'Point', coordinates: selectedStop.lonLat }, properties: selectedStop.station }
    : null;

  const leg = (i: number) => {
    const l = plan.legs[i];
    if (!l) return null;
    return <p className="ti-leg">{t('trip.legLine', { distance: dist(l.distanceKm), time: hoursMinutes(l.driveMin) })}</p>;
  };

  return (
    <section className="trip-results" aria-label={t('trip.result')}>
      <div className="trip-map">
        <Suspense fallback={<p className="muted trip-map-loading">{t('trip.mapLoading')}</p>}>
          <TripMap
            key={routeKey}
            line={line}
            gaps={gapLines}
            from={[from.lon, from.lat]}
            to={[to.lon, to.lat]}
            stops={mapStops}
            selected={selected}
            onSelect={(i) => { openedFromList.current = null; setSelected(i); }}
            label={t('trip.mapLabel', { from: from.label, to: to.label })}
          />
        </Suspense>
        {panelStation && (
          <StationPanel station={panelStation} updated={updated} onClose={closePanel} myCar={myCar} carInfo={carInfo} tripLink={false} />
        )}
      </div>

      <div className={`trip-itinerary card${sheetOpen ? ' open' : ''}${selected !== null ? ' behind' : ''}`}>
        <div className="ti-top">
        <h2 className="ti-title">{t('trip.itinerary')}</h2>
        <p className="ti-total">
          {t('trip.total', {
            distance: dist(plan.totals.distanceKm),
            drive: hoursMinutes(plan.totals.driveMin),
            stops: plan.totals.stops,
            charge: `${tilde(anyEstimated && plan.totals.chargeMin > 0)}${hoursMinutes(plan.totals.chargeMin)}`,
          })}
        </p>
        <p className="small muted ti-total-time">{t('trip.totalTime', { time: hoursMinutes(plan.totals.totalMin) })}</p>
        {noChargers && <p className="banner" role="alert">{t('trip.warn.noChargers')}</p>}
        {!plan.reachable && <p className="banner" role="alert">{t('trip.warn.unreachable')}</p>}
        <button type="button" className="btn small ti-toggle" aria-expanded={sheetOpen} aria-controls={bodyId} onClick={() => setSheetOpen((o) => !o)}>
          {sheetOpen ? t('trip.sheetHide') : t('trip.sheetShow')}
        </button>
        </div>

        <div id={bodyId} className="ti-body">
        {/* Warnings that apply to the whole trip (route-planner §7). */}
        {plan.gaps.length > 0 && (
          <p className="banner" role="note">
            {t('trip.warn.gap', { stretches: plan.gaps.map((g) => t('trip.warn.gapStretch', { from: dist(g.fromKm), to: dist(g.toKm) })).join('; ') })}
          </p>
        )}
        {anyEstimated && <p className="banner estimated small" role="note">{t('trip.warn.estimated')}</p>}
        {plan.uncalibratedFactor && <p className="banner small" role="note">{t('trip.warn.uncalibrated')}</p>}
        {anyTesla && <p className="banner small" role="note">{t('trip.warn.tesla')}</p>}

        <ol className="ti-list">
          <li className="ti-end ti-start">
            <span className="ti-mark" aria-hidden="true" />
            <div>
              <p className="ti-head"><strong>{from.label}</strong></p>
              <p className="ti-soc">{t('trip.departWith', { soc: pct(plan.startSoc) })}</p>
              {leg(0)}
            </div>
          </li>
          {plan.stops.map((s, i) => {
            const links = directionsUrls(s.lonLat);
            return (
              <li key={`${s.station.i}-${i}`} className={`ti-stop${selected === i ? ' on' : ''}`}>
                <span className="ti-mark ti-num" aria-hidden="true">{i + 1}</span>
                <div>
                  <p className="ti-head">
                    <span className="sr-only">{t('trip.stopN', { n: i + 1 })} </span>
                    <strong>{s.station.n}</strong>
                  </p>
                  <p className="ti-soc">{t('trip.arriveCharge', { arrive: pct(s.arriveSoc), depart: pct(s.departSoc) })}</p>
                  <p className="small">
                    {t('trip.stopPower', {
                      kw: formatNumber(s.usableKw),
                      plug: t(`value.${s.plug}` as MessageKey),
                      minutes: `${tilde(s.estimated)}${formatNumber(Math.round(s.chargeMin))}`,
                      overhead: formatNumber(s.overheadMin),
                    })}
                  </p>
                  {s.usableKw < s.stationKw && <p className="small muted">{t('trip.carCap', { station: formatNumber(s.stationKw) })}</p>}
                  {s.offKm > NEAR_KM && (
                    <p className="small ti-note">{t('trip.warn.detour', { off: dist(s.offKm), min: formatNumber(Math.round(s.detourMin)) })}</p>
                  )}
                  {s.teslaNetwork && <p className="small ti-note">{t(s.adapter ? 'trip.warn.teslaStopAdapter' : 'trip.warn.teslaStop')}</p>}
                  {s.pick === 'afterGap' && <p className="small ti-note">{t('trip.warn.afterGap')}</p>}
                  <ul className="ti-links small">
                    <li>
                      <button type="button" className="linklike" ref={(el) => { openButtons.current[i] = el; }}
                        onClick={() => { openedFromList.current = i; setSelected(i); }}>
                        {t('trip.openCharger')}
                      </button>
                    </li>
                    <li><a href={stopCurveHref(myCar, s)}>{t('trip.seeCurve')}</a></li>
                    <li>
                      <a href={links.google} target="_blank" rel="noopener">{t('map.station.google')} <span className="sr-only">{t('map.station.newTab')}</span></a>
                    </li>
                    <li>
                      <a href={links.apple} target="_blank" rel="noopener">{t('map.station.apple')} <span className="sr-only">{t('map.station.newTab')}</span></a>
                    </li>
                  </ul>
                  {leg(i + 1)}
                </div>
              </li>
            );
          })}
          <li className="ti-end ti-finish">
            <span className="ti-mark" aria-hidden="true" />
            <div>
              <p className="ti-head"><strong>{to.label}</strong></p>
              <p className="ti-soc">{plan.arriveSoc >= 0 ? t('trip.arriveWith', { soc: pct(plan.arriveSoc) }) : t('trip.arriveEmpty')}</p>
            </div>
          </li>
        </ol>

        <footer className="ti-foot small muted">
          <p>{t('trip.winter')}</p>
          <p>{t('trip.disclaimer')}</p>
          <p>{t('trip.assumptions', { payload: TRIP.payloadKg, target: TRIP.chargeToSoc, overhead: TRIP.stopOverheadMin })}</p>
          {updated && <p>{t('map.station.footer', { date: showDate(updated) })}</p>}
        </footer>
        </div>
      </div>
    </section>
  );
}
