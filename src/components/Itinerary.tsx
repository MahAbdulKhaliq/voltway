// The trip result (route-planner.md §7; DESIGN-4 4.8): total time first, whole-trip warnings, then
// start → legs and stops → arrival along the painted line. It is an ordered list, so it is also
// the accessible version of the route on the map. Each row sits on a card (B89). A stop's number
// is its button: it closes in on the stop and opens its station panel (directions, the curve link);
// a border row's diamond closes in on the crossing; the same one again goes back to the whole route. Notes that apply to several stops are
// said once, with a short tag on the stops they apply to. On phones the stops open with
// "Show the stops"; the totals, warnings and the "estimate only" line are always visible.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { t } from '../i18n/t.ts';
import ChangeLink from './ChangeLink.tsx';
import type { TripEnd } from '../lib/place-search.ts';
import { gapDetails, hoursMinutes, pct, showDate, stopsText } from '../lib/trip-format.ts';
import { NEAR_KM, type TripPlan } from '../lib/trip-plan.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import { TRIP } from '../config.ts';
import { chargeCost, chargePrice, money, PRICE_EVENT } from '../lib/price.ts';
import { rowsOnLeg, type BorderRow } from '../lib/border-rows.ts';
import { Accordion } from './react/Accordion.tsx';
import { SpeedMark } from './SpeedIcon.tsx';
import { speedTier } from '../lib/map-icons.ts';


interface Props {
  plan: TripPlan;
  from: TripEnd;
  to: TripEnd;
  unit: DistanceUnit;
  /** The stop whose station panel is open, if any. */
  selected: number | null;
  /** The stop number: closes in on the stop and opens its station panel (again: the whole route). */
  onOpenStop: (index: number, button: HTMLButtonElement) => void;
  /** The spot the map is closed in on: "border-<k>" (index in `crossings`), "from" or "to". */
  selectedSpot?: string | null;
  /** A border row's diamond, or the start or destination mark: closes in on it (again: the whole route). */
  onOpenSpot?: (key: string, at: [number, number]) => void;
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
  /** B76: the trip works with NACS on; turns it on in My car (the plan follows). */
  onNacs?: () => void;
  /** B79: where the route crosses the border, in route order. */
  crossings?: readonly BorderRow[];
  /** B123: Weather and wheels is on, and the line that points to it in Trip settings. */
  weatherOn?: boolean;
  weatherHint?: ReactNode;
}

export default function Itinerary({ plan, from, to, unit, selected, onOpenStop, selectedSpot = null, onOpenSpot, open, onToggle, updated, carUpdated, carLine, plugs, onShare, shareNote, onDrive, onNacs, crossings = [], weatherOn = false, weatherHint }: Props) {
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
  // B79: a "Border crossing" row after the item whose leg the crossing is on.
  const stopKms = plan.stops.map((s) => s.alongKm);
  const countryName = (cc: string) => t(cc === 'us' ? 'trip.border.us' : 'trip.border.ca');
  const borderItems = (legIndex: number, i: number) =>
    rowsOnLeg(crossings, stopKms, legIndex).map((r) => {
      const k = crossings.indexOf(r);
      const on = selectedSpot === `border-${k}`;
      return (
      <li key={`border-${k}`} className={`ti-border${on ? ' on' : ''}${gapClass(legIndex)}`} style={{ '--i': i, '--n': plan.stops.length + 1 } as React.CSSProperties} aria-current={on ? 'true' : undefined}>
        <button type="button" className="ti-mark ti-border-mark" aria-pressed={on} aria-label={t('trip.border.show')} title={t('trip.border.show')}
          onClick={() => onOpenSpot?.(`border-${k}`, r.at)} />
        <div>
          <p className="ti-head">
            <strong>{t('trip.border.row')}</strong>
            {' · '}
            {r.place ? t('trip.border.near', { country: countryName(r.to), place: r.place }) : t('trip.border.into', { country: countryName(r.to) })}
          </p>
        </div>
      </li>
      );
    });

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
            <ChangeLink className="small" label={t('trip.costChange')} onClick={() => window.dispatchEvent(new CustomEvent('voltway:settings', { detail: 'price' }))} />
          </p>
        )}
        <p className="small muted ti-car">{carLine}</p>
        {/* B72: hand the trip to Google Maps or Apple Maps, stop by stop. */}
        <button type="button" className="btn primary ti-drive" onClick={onDrive}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7L12 2Z" fill="currentColor" /></svg>
          {t('drive.open')}
        </button>
        {crossings.length > 0 && <p className="banner small ti-border-note">{t('trip.border.note')}</p>}
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
        {onNacs && (
          <div className="banner small ti-nacs" role="status">
            <p>{t('trip.nacsHelps')}</p>
            <button type="button" className="btn small" onClick={onNacs}>{t('trip.nacsTurnOn')}</button>
          </div>
        )}
        <button type="button" className="btn small ti-toggle" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
          {open ? t('trip.sheetHide') : t('trip.sheetShow')}
        </button>
      </div>

      <div id={bodyId} className="ti-body">
        <ol className="ti-list" ref={listRef}>
          <li className={`ti-end ti-start${selectedSpot === 'from' ? ' on' : ''}${gapClass(0)}`} style={{ '--i': 0, '--n': plan.stops.length + 1 } as React.CSSProperties} aria-current={selectedSpot === 'from' ? 'true' : undefined}>
            <button type="button" className="ti-mark" aria-pressed={selectedSpot === 'from'} aria-label={t('trip.endShow', { name: from.label })} title={t('trip.endShow', { name: from.label })}
              onClick={() => onOpenSpot?.('from', [from.lon, from.lat])} />
            <div>
              <p className="ti-head"><strong>{from.label}</strong></p>
              <p className="ti-soc">{t('trip.departWith', { soc: pct(plan.startSoc) })}</p>
              {leg(0)}
            </div>
          </li>
          {borderItems(0, 0)}
          {plan.stops.map((s, i) => [
            <li key={`${s.station.i}-${i}`} style={{ '--i': i + 1, '--n': plan.stops.length + 1 } as React.CSSProperties} data-stop-item={i} aria-current={selected === i ? 'true' : undefined} className={`ti-stop${selected === i ? ' on' : ''}${gapClass(i + 1)}`}>
              <button type="button" className="ti-mark ti-num" data-stop={i} aria-pressed={selected === i}
                aria-label={t('trip.stopShow', { n: i + 1, name: s.station.n })} title={t('trip.stopShow', { n: i + 1, name: s.station.n })}
                onClick={(e) => onOpenStop(i, e.currentTarget)}>{i + 1}</button>
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
                {/* B89 round 4: the charger's speed first (the map's bolts and its top kW), then Car-limited. */}
                <p className="ti-row">
                  <span className="ti-speed"><SpeedMark tier={speedTier(s.stationKw)} size={15} />{t('fmt.kw', { value: formatNumber(Math.round(s.stationKw)) })}</span>
                  {s.usableKw < s.stationKw && <span className="ti-tag">{t('trip.tag.carCap')}</span>}
                  {s.teslaNetwork && <span className="ti-tag">{t(s.adapter ? 'trip.tag.adapter' : 'trip.tag.tesla')}</span>}
                  {s.offKm > NEAR_KM && (
                    <span className="ti-tag">{t('trip.tag.detour', { off: dist(s.offKm), min: formatNumber(Math.round(s.detourMin)) })}</span>
                  )}
                </p>
                {leg(i + 1)}
              </div>
            </li>,
            ...borderItems(i + 1, i + 1),
          ])}
          <li className={`ti-end ti-finish${selectedSpot === 'to' ? ' on' : ''}`} style={{ '--i': plan.stops.length + 1, '--n': plan.stops.length + 1 } as React.CSSProperties} aria-current={selectedSpot === 'to' ? 'true' : undefined}>
            <button type="button" className="ti-mark" aria-pressed={selectedSpot === 'to'} aria-label={t('trip.endShow', { name: to.label })} title={t('trip.endShow', { name: to.label })}
              onClick={() => onOpenSpot?.('to', [to.lon, to.lat])} />
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

        {/* B89: a section that unrolls (design-language §8), on a raised card like the rows. */}
        <Accordion bare level={3} className="ti-how" title={t('trip.how')}>
          <div className="small muted">
            {anyEstimated && <p>{t('trip.warn.estimated')}</p>}
            {plan.uncalibratedFactor && <p>{t('trip.warn.uncalibrated')}</p>}
            <p>{t('trip.assumptions', { payload: TRIP.payloadKg, target: TRIP.chargeToSoc, overhead: TRIP.stopOverheadMin })}</p>
            <p>{t(weatherOn ? 'trip.winterOn' : 'trip.winter')}</p>
            {updated && <p>{t('trip.chargerData', { date: showDate(updated) })}</p>}
            {carUpdated && <p>{t('trip.carDataDate', { date: showDate(carUpdated) })}</p>}
          </div>
        </Accordion>
      </div>
      {/* B123: the weather the plan used, and the way to Trip settings. */}
      {weatherHint}
      {/* Last (owner, B67): the reminder that all of this is an estimate. Always visible, phones included. */}
      <p className="small muted ti-disclaimer">{t('trip.disclaimer')}</p>
    </div>
  );
}
