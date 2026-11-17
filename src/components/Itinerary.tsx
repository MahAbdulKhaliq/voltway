// The trip itinerary (route-planner.md §7): start → legs and stops → arrival, totals, inline warnings
// and per-stop links. It is an ordered list, so it is also the accessible version of the route on
// the map. On the charger map (B50) it sits in the side panel; on phones the panel is a bottom
// sheet and the stops open with "Show the stops".

import { useId } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import type { MyCar } from '../lib/my-car.ts';
import type { TripEnd } from '../lib/place-search.ts';
import { directionsUrls } from '../lib/station-details.ts';
import { hoursMinutes, pct, showDate, stopCurveHref, stopsText } from '../lib/trip-format.ts';
import { NEAR_KM, type TripPlan } from '../lib/trip-plan.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import { TRIP } from '../config.ts';

interface Props {
  plan: TripPlan;
  from: TripEnd;
  to: TripEnd;
  unit: DistanceUnit;
  myCar: MyCar;
  /** The stop whose station panel is open, if any. */
  selected: number | null;
  /** "Charger details": opens that stop's station panel. */
  onOpenStop: (index: number, button: HTMLButtonElement) => void;
  /** Phones: the stops are folded away until opened. */
  open: boolean;
  onToggle: () => void;
  /** Charger data date (map meta.json), YYYY-MM-DD. */
  updated: string | null;
  /** The car's data date: the latest source check, YYYY-MM-DD. */
  carUpdated: string | null;
}

export default function Itinerary({ plan, from, to, unit, myCar, selected, onOpenStop, open, onToggle, updated, carUpdated }: Props) {
  const bodyId = useId();
  const dist = (km: number) => `${formatNumber(kmTo(km, unit))} ${unit}`;
  const tilde = (estimated: boolean) => (estimated ? '~' : '');
  const anyEstimated = plan.carEstimated || plan.stops.some((s) => s.estimated);
  const anyTesla = plan.stops.some((s) => s.teslaNetwork);
  /** Nothing compatible anywhere the car needed a charge: say so first, in plain words. */
  const noChargers = plan.stops.length === 0 && plan.gaps.length > 0;

  const leg = (i: number) => {
    const l = plan.legs[i];
    if (!l) return null;
    return <p className="ti-leg">{t('trip.legLine', { distance: dist(l.distanceKm), time: hoursMinutes(l.driveMin) })}</p>;
  };

  return (
    <div className={`route-itinerary${open ? ' open' : ''}`}>
      <div className="ti-top">
        <h2 className="ti-title">{t('trip.itinerary')}</h2>
        <p className="ti-total">
          {t('trip.total', {
            distance: dist(plan.totals.distanceKm),
            drive: hoursMinutes(plan.totals.driveMin),
            stops: stopsText(plan.totals.stops),
            charge: `${tilde(anyEstimated && plan.totals.chargeMin > 0)}${hoursMinutes(plan.totals.chargeMin)}`,
          })}
        </p>
        <p className="small muted ti-total-time">{t('trip.totalTime', { time: hoursMinutes(plan.totals.totalMin) })}</p>
        {noChargers && <p className="banner" role="alert">{t('trip.warn.noChargers')}</p>}
        {!plan.reachable && !noChargers && <p className="banner" role="alert">{t('trip.warn.unreachable')}</p>}
        <button type="button" className="btn small ti-toggle" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
          {open ? t('trip.sheetHide') : t('trip.sheetShow')}
        </button>
      </div>

      <div id={bodyId} className="ti-body">
        {/* Warnings that apply to the whole trip (route-planner §7). */}
        {plan.gaps.length > 0 && !noChargers && (
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
                      <button type="button" className="linklike" data-stop={i} onClick={(e) => onOpenStop(i, e.currentTarget)}>
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
          {carUpdated && <p>{t('trip.carDataDate', { date: showDate(carUpdated) })}</p>}
        </footer>
      </div>
    </div>
  );
}
