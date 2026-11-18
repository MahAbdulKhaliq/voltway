// Drive mode (B72, DESIGN-5 §1): hands the trip to Google Maps or Apple Maps, one stop at a time
// (or the whole remaining trip when it fits the app's limit), and keeps track of the stops while the
// page is open. No turn-by-turn in Voltway (R7). Location is watched only while this view is open
// and the page is visible, and is never stored; the screen is kept awake with a Wake Lock.

import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/t.ts';
import type { TripEnd } from '../lib/place-search.ts';
import type { Route } from '../lib/route-geo.ts';
import type { TripPlan } from '../lib/trip-plan.ts';
import type { RouteOptions } from '../lib/route-options.ts';
import { nextTarget, tickReached, toTarget, type Fix } from '../lib/drive.ts';
import { directionsUrls, WHOLE_TRIP_MAX, wholeTripUrls } from '../lib/nav-links.ts';
import { pct } from '../lib/trip-format.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import { chargeCost, chargePrice, PRICE_EVENT } from '../lib/price.ts';
import { COVERAGE } from '../config.ts';

const money = new Intl.NumberFormat(COVERAGE.moneyLocale, { style: 'currency', currency: COVERAGE.currency });
const clock = new Intl.DateTimeFormat(COVERAGE.moneyLocale, { hour: 'numeric', minute: '2-digit' });

type Locating = 'waiting' | 'on' | 'off';

interface Props {
  plan: TripPlan;
  route: Route;
  from: TripEnd;
  to: TripEnd;
  unit: DistanceUnit;
  opts: RouteOptions;
  reached: boolean[];
  onReached: (next: boolean[]) => void;
  /** The car's position for the map dot (memory only), or null when there is none. */
  onFix: (at: [number, number] | null) => void;
}

export default function DriveView({ plan, route, from, to, unit, opts, reached, onReached, onFix }: Props) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [locating, setLocating] = useState<Locating>('waiting');
  const [now, setNow] = useState(() => new Date());
  const reachedRef = useRef(reached);
  reachedRef.current = reached;

  // Location, only while the page is visible (B72: no background tracking).
  useEffect(() => {
    if (!('geolocation' in navigator)) { setLocating('off'); return; }
    let id: number | null = null;
    const startWatch = () => {
      if (id !== null || document.visibilityState !== 'visible') return;
      id = navigator.geolocation.watchPosition(
        ({ coords }) => {
          const f = { lon: coords.longitude, lat: coords.latitude };
          setFix(f);
          setLocating('on');
          setNow(new Date());
          onFix([f.lon, f.lat]);
          const next = tickReached(plan, route, reachedRef.current, f);
          if (next.some((r, i) => r !== (reachedRef.current[i] === true))) onReached(next);
        },
        () => setLocating('off'),
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 },
      );
    };
    const stopWatch = () => { if (id !== null) { navigator.geolocation.clearWatch(id); id = null; } };
    const onVis = () => (document.visibilityState === 'visible' ? startWatch() : stopWatch());
    startWatch();
    document.addEventListener('visibilitychange', onVis);
    return () => { stopWatch(); document.removeEventListener('visibilitychange', onVis); onFix(null); };
  }, [plan, route]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the screen on while Drive is open; the browser drops the lock when the page is hidden.
  useEffect(() => {
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
    if (!wl) return;
    let lock: { release: () => Promise<void> } | null = null;
    let alive = true;
    const ask = () => {
      if (document.visibilityState !== 'visible') return;
      wl.request('screen').then((l) => { if (alive) lock = l; else l.release().catch(() => {}); }, () => {});
    };
    const onVis = () => { if (document.visibilityState === 'visible') ask(); };
    ask();
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVis); lock?.release().catch(() => {}); };
  }, []);

  // The clock moves on without a fix too (arrival times are from now).
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const end: [number, number] = [to.lon, to.lat];
  const target = nextTarget(plan, route, end, reached);
  const left = toTarget(plan, route, target, fix, now);
  const stop = target.kind === 'stop' ? plan.stops[target.index] : null;
  const dist = (km: number) => t(unit === 'mi' ? 'fmt.mi' : 'fmt.km', { value: formatNumber(Math.round(kmTo(km, unit))) });
  const [price, setPrice] = useState(chargePrice);
  useEffect(() => {
    const on = () => setPrice(chargePrice());
    window.addEventListener(PRICE_EVENT, on);
    return () => window.removeEventListener(PRICE_EVENT, on);
  }, []);
  const nav = directionsUrls(target.lonLat, opts);
  const remaining = plan.stops.filter((_, i) => !reached[i]).map((s) => s.lonLat);
  const whole = remaining.length > 0 ? wholeTripUrls(remaining, end, opts) : null;
  const avoiding = opts.avoidTolls || opts.avoidHighways;

  const mark = (i: number, on: boolean) => onReached(plan.stops.map((_, k) => (on ? k <= i || reached[k] === true : k < i && reached[k] === true)));

  return (
    <div className="drive">
      <div className="drive-next">
        <p className="drive-kicker small">
          {stop ? t('drive.stopOf', { n: target.index + 1, total: plan.stops.length }) : t('drive.destination')}
        </p>
        <p className="drive-name">{stop ? stop.station.n : to.label}</p>
        <p className="drive-eta">
          {t('drive.eta', { distance: dist(left.distanceKm), time: clock.format(left.arrive) })}
        </p>
        <p className="drive-charge small">
          {stop ? (
            <>
              {t('trip.stopLine', { arrive: pct(stop.arriveSoc), depart: pct(stop.departSoc), minutes: `${stop.estimated ? '~' : ''}${formatNumber(Math.round(stop.chargeMin))}` })}
              {stop.energyKwh != null && t('trip.stopCost', { cost: money.format(chargeCost(stop.energyKwh, price)) })}
            </>
          ) : (
            plan.arriveSoc >= 0 ? t('trip.arriveWith', { soc: pct(plan.arriveSoc) }) : t('trip.arriveEmpty')
          )}
        </p>
      </div>

      <div className="drive-go" role="group" aria-label={stop ? t('drive.navigateStop') : t('drive.navigateEnd')}>
        <p className="drive-go-title">{stop ? t('drive.navigateStop') : t('drive.navigateEnd')}</p>
        <div className="drive-apps">
          <a className="btn primary drive-app" href={nav.google} target="_blank" rel="noopener noreferrer">{t('drive.google')}</a>
          <a className="btn primary drive-app" href={nav.apple} target="_blank" rel="noopener noreferrer">{t('drive.apple')}</a>
        </div>
      </div>

      {whole && (
        <div className="drive-whole" role="group" aria-label={t('drive.wholeTitle')}>
          <p className="small drive-whole-title">{t('drive.wholeTitle')}</p>
          {whole.google || whole.apple ? (
            <div className="drive-apps">
              {whole.google && <a className="btn drive-app" href={whole.google} target="_blank" rel="noopener noreferrer">{t('drive.google')}</a>}
              {whole.apple && <a className="btn drive-app" href={whole.apple} target="_blank" rel="noopener noreferrer">{t('drive.apple')}</a>}
            </div>
          ) : null}
          {(!whole.google || !whole.apple) && (
            <p className="small muted">{!whole.google && !whole.apple ? t('drive.tooManyBoth') : !whole.google ? t('drive.tooManyGoogle', { max: WHOLE_TRIP_MAX.google }) : t('drive.tooManyApple', { max: WHOLE_TRIP_MAX.apple })}</p>
          )}
        </div>
      )}

      <p className="small muted drive-loc" role="status">
        {locating === 'off' ? t('drive.locationOff') : t('drive.locationOn')}
      </p>

      <ol className="drive-list" aria-label={t('drive.listLabel')}>
        <li className="drive-item done">
          <span className="drive-mark" aria-hidden="true" />
          <span className="drive-item-name">{from.label}</span>
        </li>
        {plan.stops.map((s, i) => {
          const isReached = reached[i] === true;
          const isNext = target.kind === 'stop' && target.index === i;
          return (
            <li key={`${s.station.i}-${i}`} className={`drive-item${isReached ? ' done' : ''}${isNext ? ' next' : ''}`} aria-current={isNext ? 'step' : undefined}>
              <span className="drive-mark drive-num" aria-hidden="true">{isReached ? '✓' : i + 1}</span>
              <span className="drive-item-name">
                <span className="sr-only">{t('trip.stopN', { n: i + 1 })} </span>
                {s.station.n}
                <span className="drive-state small">{isReached ? t('drive.reached') : isNext ? t('drive.next') : ''}</span>
              </span>
              <button type="button" className="link-btn small drive-toggle" onClick={() => mark(i, !isReached)}
                aria-label={t(isReached ? 'drive.unmarkFor' : 'drive.markFor', { name: s.station.n })}>
                {isReached ? t('drive.unmark') : t('drive.mark')}
              </button>
            </li>
          );
        })}
        <li className={`drive-item end${target.kind === 'end' ? ' next' : ''}`} aria-current={target.kind === 'end' ? 'step' : undefined}>
          <span className="drive-mark" aria-hidden="true" />
          <span className="drive-item-name">{to.label}</span>
        </li>
      </ol>

      <div className="small muted drive-notes">
        <p>{t('drive.noteChargers')}</p>
        {avoiding && <p>{t('drive.noteAvoid')}</p>}
        <p>{t('drive.noteLocation')}</p>
      </div>
    </div>
  );
}
