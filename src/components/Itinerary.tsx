// The trip result (route-planner.md §7; DESIGN-4 4.8): total time first, whole-trip warnings, then
// start → legs and stops → arrival along the painted line. It is an ordered list, so it is also
// the accessible version of the route on the map. Each stop is two lines plus one Details control
// (the station panel holds directions and the curve link). Notes that apply to several stops are
// said once, with a short tag on the stops they apply to. On phones the stops open with
// "Show the stops"; the totals, warnings and the "estimate only" line are always visible.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { t } from '../i18n/t.ts';
import type { TripEnd } from '../lib/place-search.ts';
import { gapDetails, hoursMinutes, pct, showDate, stopsText } from '../lib/trip-format.ts';
import { NEAR_KM, type TripPlan } from '../lib/trip-plan.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import { COVERAGE, TRIP } from '../config.ts';
import { chargeCost, chargePrice, PRICE_EVENT } from '../lib/price.ts';

const money = new Intl.NumberFormat(COVERAGE.moneyLocale, { style: 'currency', currency: COVERAGE.currency });

interface Props {
  plan: TripPlan;
  from: TripEnd;
  to: TripEnd;
  unit: DistanceUnit;
  /** The stop whose station panel is open, if any. */
  selected: number | null;
  /** "Details": opens that stop's station panel. */
  onOpenStop: (index: number, button: HTMLButtonElement) => void;
  /** Phones: the stops are folded away until opened. */
  open: boolean;
  onToggle: () => void;
  /** Charger data date (map meta.json), YYYY-MM-DD. */
  updated: string | null;
  /** The car's data date: the latest source check, YYYY-MM-DD. */
  carUpdated: string | null;
  /** Car, start % and threshold, one line. */
  carLine: string;
  /** The plugs the plan used, with Change plugs (after the charging time). */
  plugs: ReactNode;
  /** Makes the share link. */
  onShare: () => void;
  /** The link once made, shown under the time. */
  shareNote: ReactNode;
  /** Opens Drive mode (B72). */
  onDrive: () => void;
}

export default function Itinerary({ plan, from, to, unit, selected, onOpenStop, open, onToggle, updated, carUpdated, carLine, plugs, onShare, shareNote, onDrive }: Props) {
  const bodyId = useId();
  // Stop costs use the charging price from Settings (B66); it can change while the plan is shown.
  const [price, setPrice] = useState(chargePrice);
  useEffect(() => {
    const on = (e: Event) => setPrice((e as CustomEvent<number>).detail);
    window.addEventListener(PRICE_EVENT, on);
    return () => window.removeEventListener(PRICE_EVENT, on);
  }, []);
  const stopCost = (kwh: number) => money.format(chargeCost(kwh, price));
  const totalKwh = plan.stops.reduce((sum, s) => sum + (s.energyKwh ?? 0), 0);
  // A stop picked on the map is brought into view in the list (DESIGN-4 4.11). A folded list on a
  // phone stays folded: the station panel is what the visitor asked for.
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (selected === null) return;
    const li = listRef.current?.querySelector<HTMLElement>(`li[data-stop-item="${selected}"]`);
    if (li && li.offsetParent !== null) li.scrollIntoView({ block: 'nearest' });
  }, [selected]);
  const dist = (km: number) => t(unit === 'mi' ? 'fmt.mi' : 'fmt.km', { value: formatNumber(kmTo(km, unit)) });
  const tilde = (estimated: boolean) => (estimated ? '~' : '');
  const anyEstimated = plan.carEstimated || plan.stops.some((s) => s.estimated);
  const anyTesla = plan.stops.some((s) => s.teslaNetwork);
  const anyAdapter = plan.stops.some((s) => s.teslaNetwork && s.adapter);
  const anyCarCap = plan.stops.some((s) => s.usableKw < s.stationKw);
  /** Nothing compatible anywhere the car needed a charge: say so first, in plain words. */
  const noChargers = plan.stops.length === 0 && plan.gaps.length > 0;
  const gaps = gapDetails(plan, from.label, to.label);
  const gapLegs = new Set(gaps.map((g) => g.leg));
  /** A gap the car won't cross already says so; the general "may not make it" line would repeat it. */
  const gapSaysUnreachable = gaps.some((g) => !g.makesIt);

  const leg = (i: number) => {
    const l = plan.legs[i];
    if (!l) return null;
    return (
      <>
        <p className="ti-leg">{t('trip.legLine', { distance: dist(l.distanceKm), time: hoursMinutes(l.driveMin) })}</p>
        {gapLegs.has(i) && <p className="small ti-leg-gap">{t('trip.legGap')}</p>}
      </>
    );
  };
  /** The list item whose line runs along a gap leg: the start (leg 0) or stop i (leg i + 1). */
  const gapClass = (legIndex: number) => (gapLegs.has(legIndex) ? ' ti-gap' : '');

  return (
    <div className={`route-itinerary${open ? ' open' : ''}`}>
      <div className="ti-top">
        <h2 className="sr-only">{t('trip.itinerary')}</h2>
        <div className="ti-time-row">
          <p className="ti-time">
            <span className="sr-only">{t('trip.totalTimeLabel')} </span>
            {tilde(anyEstimated && plan.totals.chargeMin > 0)}{hoursMinutes(plan.totals.totalMin)}
          </p>
          <button type="button" className="icon-btn ti-share" aria-label={t('trip.share')} title={t('trip.share')} onClick={onShare}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        </div>
        {shareNote}
        <p className="ti-ends"><strong>{from.label}</strong> → <strong>{to.label}</strong></p>
        <p className="ti-total">
          {t('trip.totalLine', {
            distance: dist(plan.totals.distanceKm),
            drive: hoursMinutes(plan.totals.driveMin),
            stops: stopsText(plan.totals.stops),
          })}
        </p>
        <p className="ti-charge small">
          {t('trip.chargeLine', { charge: `${tilde(anyEstimated && plan.totals.chargeMin > 0)}${hoursMinutes(plan.totals.chargeMin)}` })}
          {plugs}
        </p>
        {plan.stops.length > 0 && (
          <p className="ti-cost">
            <span className="sr-only">{t('trip.costLabel')} </span>
            <strong className="ti-cost-value">~{stopCost(totalKwh)}</strong>{' '}
            <span className="small muted">{t('trip.costAt', { price: money.format(price) })}</span>{' '}
            <button type="button" className="link-btn small" onClick={() => window.dispatchEvent(new CustomEvent('voltway:settings', { detail: 'price' }))}>{t('trip.costChange')}</button>
          </p>
        )}
        <p className="small muted ti-car">{carLine}</p>
        {/* B72: hand the trip to Google Maps or Apple Maps, stop by stop. */}
        <button type="button" className="btn primary ti-drive" onClick={onDrive}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7L12 2Z" fill="currentColor" /></svg>
          {t('drive.open')}
        </button>
        {noChargers && <p className="banner small" role="alert">{t('trip.warn.noChargers')}</p>}
        {!plan.reachable && !noChargers && !gapSaysUnreachable && <p className="banner small" role="alert">{t('trip.warn.unreachable')}</p>}
        {/* Charging gaps stay above the fold on phones: they are never behind "Show the stops". */}
        {!noChargers && gaps.map((g) => (
          <p key={g.leg} className="banner small ti-gap-warn" role="alert">
            {t(g.makesIt ? 'trip.warn.gapOk' : 'trip.warn.gapShort', {
              distance: dist(g.distanceKm),
              from: g.fromName,
              to: g.toName,
              soc: pct(g.arriveSoc),
              threshold: pct(plan.thresholdSoc),
            })}
          </p>
        ))}
        <button type="button" className="btn small ti-toggle" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
          {open ? t('trip.sheetHide') : t('trip.sheetShow')}
        </button>
      </div>

      <div id={bodyId} className="ti-body">
        <ol className="ti-list" ref={listRef}>
          <li className={`ti-end ti-start${gapClass(0)}`} style={{ '--i': 0, '--n': plan.stops.length + 1 } as React.CSSProperties}>
            <span className="ti-mark" aria-hidden="true" />
            <div>
              <p className="ti-head"><strong>{from.label}</strong></p>
              <p className="ti-soc">{t('trip.departWith', { soc: pct(plan.startSoc) })}</p>
              {leg(0)}
            </div>
          </li>
          {plan.stops.map((s, i) => (
            <li key={`${s.station.i}-${i}`} style={{ '--i': i + 1, '--n': plan.stops.length + 1 } as React.CSSProperties} data-stop-item={i} aria-current={selected === i ? 'true' : undefined} className={`ti-stop${selected === i ? ' on' : ''}${gapClass(i + 1)}`}>
              <span className="ti-mark ti-num" aria-hidden="true">{i + 1}</span>
              <div>
                <p className="ti-head">
                  <span className="sr-only">{t('trip.stopN', { n: i + 1 })} </span>
                  <strong>{s.station.n}</strong>
                </p>
                <p className="ti-soc">
                  {t('trip.stopLine', {
                    arrive: pct(s.arriveSoc),
                    depart: pct(s.departSoc),
                    minutes: `${tilde(s.estimated)}${formatNumber(Math.round(s.chargeMin))}`,
                  })}
                  {s.energyKwh != null && t('trip.stopCost', { cost: stopCost(s.energyKwh) })}
                </p>
                <p className="ti-row">
                  <button type="button" className="btn small" data-stop={i} aria-label={t('trip.detailsFor', { name: s.station.n })} onClick={(e) => onOpenStop(i, e.currentTarget)}>
                    {t('trip.details')}
                  </button>
                  {s.teslaNetwork && <span className="ti-tag">{t(s.adapter ? 'trip.tag.adapter' : 'trip.tag.tesla')}</span>}
                  {s.usableKw < s.stationKw && <span className="ti-tag">{t('trip.tag.carCap')}</span>}
                  {s.offKm > NEAR_KM && (
                    <span className="ti-tag">{t('trip.tag.detour', { off: dist(s.offKm), min: formatNumber(Math.round(s.detourMin)) })}</span>
                  )}
                </p>
                {leg(i + 1)}
              </div>
            </li>
          ))}
          <li className="ti-end ti-finish" style={{ '--i': plan.stops.length + 1, '--n': plan.stops.length + 1 } as React.CSSProperties}>
            <span className="ti-mark" aria-hidden="true" />
            <div>
              <p className="ti-head"><strong>{to.label}</strong></p>
              <p className="ti-soc">{plan.arriveSoc >= 0 ? t('trip.arriveWith', { soc: pct(plan.arriveSoc) }) : t('trip.arriveEmpty')}</p>
            </div>
          </li>
        </ol>

        {/* Said once for the trip; the tags on the stops point here. */}
        {(anyTesla || anyCarCap) && (
          <ul className="ti-notes small">
            {anyTesla && (
              <li>
                <span className="ti-tag">{t('trip.tag.tesla')}</span> {t('trip.warn.tesla')}
                {anyAdapter && <> {t('trip.note.adapter')}</>}
              </li>
            )}
            {anyCarCap && <li><span className="ti-tag">{t('trip.tag.carCap')}</span> {t('trip.note.carCap')}</li>}
          </ul>
        )}

        <details className="ti-how small">
          <summary>{t('trip.how')}</summary>
          <div className="muted">
            {anyEstimated && <p>{t('trip.warn.estimated')}</p>}
            {plan.uncalibratedFactor && <p>{t('trip.warn.uncalibrated')}</p>}
            <p>{t('trip.assumptions', { payload: TRIP.payloadKg, target: TRIP.chargeToSoc, overhead: TRIP.stopOverheadMin })}</p>
            <p>{t('trip.winter')}</p>
            {updated && <p>{t('map.station.footer', { date: showDate(updated) })}</p>}
            {carUpdated && <p>{t('trip.carDataDate', { date: showDate(carUpdated) })}</p>}
          </div>
        </details>
      </div>
      {/* Last (owner, B67): the reminder that all of this is an estimate. Always visible, phones included. */}
      <p className="small muted ti-disclaimer">{t('trip.disclaimer')}</p>
    </div>
  );
}
