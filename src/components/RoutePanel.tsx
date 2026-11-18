// Route mode on the charger map (B50, 3.18; route-planner.md §1): From, To, swap, one editable line
// for the car, start % and threshold, Plan route, then the itinerary. It replaces the filter panel
// while a route is open; Close route goes back to the plain map. After a plan the form folds into
// a one-line summary with Edit, so the itinerary gets the room.

import { useEffect, useMemo, useRef, useState } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import { openCarPicker } from '../lib/car-label.ts';
import Itinerary from './Itinerary.tsx';
import DriveView from './DriveView.tsx';
import { clearDrive, saveDrive } from '../lib/drive.ts';
import PlaceField, { loadUsPlaces } from './PlaceField.tsx';
import { borderRows } from '../lib/border-rows.ts';
import type { TripState } from './useTrip.ts';
import { setMyCar, type MyCar } from '../lib/my-car.ts';
import type { PlaceSearch } from '../lib/place-search.ts';
import { SOC_LIMITS } from '../lib/trip-link.ts';
import { stopsText } from '../lib/trip-format.ts';
import { morph } from '../lib/motion.ts';
import type { IndexEntry } from '../lib/types.ts';

interface Props {
  trip: TripState;
  cars: IndexEntry[];
  myCar: MyCar | null;
  search: PlaceSearch | null;
  /** The stop whose station panel is open, if any. */
  selectedStop: number | null;
  onOpenStop: (index: number, button: HTMLButtonElement) => void;
  onClose: () => void;
  /** Charger data date, YYYY-MM-DD. */
  updated: string | null;
  /** Drive progress from this tab (B72): reopen Drive once the trip is planned again. */
  resumeDrive: boolean[] | null;
  /** The car's position while Drive watches it, for the map dot. */
  onDriveFix: (at: [number, number] | null) => void;
}

export default function RoutePanel({ trip: T, cars, myCar, search, selectedStop, onOpenStop, onClose, updated, resumeDrive, onDriveFix }: Props) {
  const { trip, plan, status, current, planCar } = T;
  const [editing, setEditing] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Drive mode (B72): open, and which stops are reached. Kept for this tab only (sessionStorage).
  const [driving, setDriving] = useState(false);
  const [reached, setReached] = useState<boolean[]>([]);
  const resume = useRef(resumeDrive);
  // Swapping remounts both fields so each shows its new end (a field keeps typed text otherwise).
  const [swaps, setSwaps] = useState(0);
  // Ends typed but not picked from the suggestions (B62): only then does the "pick from the list" hint show.
  const [loose, setLoose] = useState({ from: false, to: false });
  useEffect(() => setLoose({ from: false, to: false }), [swaps]);
  const folded = current && !editing;
  // B73: an option change re-plans by itself only while the trip is on screen (not on the form).
  const { setShown } = T;
  useEffect(() => { setShown(Boolean(folded)); }, [folded, setShown]);
  // Opening route mode, folding the form and Edit each replace the control that had focus:
  // focus moves to the panel's heading so keyboard and screen-reader users keep their place (3.20).
  const headRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headRef.current?.focus({ preventScroll: true }); }, [folded]);

  // B55: the DC plugs the plan used (My car's switches), with a way to change them.
  const dcUsed = planCar?.ok ? planCar.car.rule.plugs.filter((p) => p !== 'j1772') : null;
  const plugsLine = dcUsed && (
    <p className="small route-plugs">
      {dcUsed.length ? t('route.plugs', { plugs: dcUsed.map((p) => t(`value.${p}` as MessageKey)).join(', ') }) : t('route.plugsNone')}{' '}
      <button type="button" className="link-btn" onClick={() => window.dispatchEvent(new CustomEvent('voltway:mycar-menu'))}>{t('route.plugsChange')}</button>
    </p>
  );
  // The trip card's line (B67): charging time, then the plugs used and a way to change them.
  const plugsInline = dcUsed && (
    <>
      {' · '}{dcUsed.length ? dcUsed.map((p) => t(`value.${p}` as MessageKey)).join(', ') : t('route.plugsNoneShort')}{' '}
      <button type="button" className="link-btn" onClick={() => window.dispatchEvent(new CustomEvent('voltway:mycar-menu'))}>{t('route.plugsChange')}</button>
    </>
  );
  const carLabel = myCar ? (myCar.label ?? cars.find((c) => c.id === myCar.carId)?.name ?? myCar.carId) : '';
  // Each new plan (Plan route, or a link that plans at once) folds the form so the itinerary has room.
  const planKey = current ? T.routeData?.key ?? '' : '';
  const foldedFor = useRef('');
  useEffect(() => {
    if (!planKey || planKey === foldedFor.current) return; // a car change re-plans the same route: leave the panel as it is
    foldedFor.current = planKey;
    setEditing(false);
    setSheetOpen(false);
    // A new plan starts Drive over, unless this tab is coming back to it.
    if (resume.current) { setReached(resume.current.slice(0, plan?.stops.length ?? 0)); setDriving(true); resume.current = null; }
    else { setDriving(false); setReached([]); clearDrive(); }
  }, [planKey]);
  const openDrive = () => morph(() => { setDriving(true); saveDrive({ trip, reached }); }, 'forward', 'left');
  const leaveDrive = () => morph(() => { setDriving(false); clearDrive(); }, 'back', 'left');
  const onReached = (next: boolean[]) => { setReached(next); saveDrive({ trip, reached: next }); };
  const showDrive = Boolean(driving && folded && plan && T.routeData && trip.from && trip.to);
  // B79: a trip that crosses the border names each crossing after a town on the far side, so it
  // loads both place lists (shared with the search fields); until they're in, the rows say just the country.
  const crossings = T.routeData?.crossings;
  const [bothPlaces, setBothPlaces] = useState<PlaceSearch | null>(null);
  useEffect(() => {
    if (!crossings?.length || bothPlaces) return;
    let alive = true;
    // A PlaceSearch is itself a function: wrap it, or React would call it as a state updater.
    loadUsPlaces().then((s) => alive && setBothPlaces(() => s), () => {});
    return () => { alive = false; };
  }, [crossings, bothPlaces]);
  const borderList = useMemo(() => (T.routeData ? borderRows(crossings, T.routeData.route, bothPlaces) : []), [T.routeData, crossings, bothPlaces]);
  const firstDrive = useRef(true);
  useEffect(() => { if (firstDrive.current) { firstDrive.current = false; return; } headRef.current?.focus({ preventScroll: true }); }, [showDrive]);
  const submit = async () => {
    await T.submit();
    if (T.current) setEditing(false); // same ends: the plan on screen is already current
  };

  return (
    <section className={`route-panel${folded ? ' folded' : ''}`} aria-label={t('route.label')}>
      <div className="route-head">
        {folded && (
          <button type="button" className="map-place-close route-back" aria-label={showDrive ? t('drive.back') : t('route.back')} title={showDrive ? t('drive.back') : t('route.back')}
            onClick={() => (showDrive ? leaveDrive() : morph(() => setEditing(true), 'back', 'left'))}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        )}
        <h2 className="route-title" ref={headRef} tabIndex={-1}>{showDrive ? t('drive.title') : t('route.title')}</h2>
        <button type="button" className="map-place-close" aria-label={t('route.close')} onClick={() => { clearDrive(); onClose(); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* B69: only this part scrolls; the header (back, title, close) stays above it. */}
      <div className="route-body">

      {folded ? null : (
        <form className="route-form" onSubmit={(e) => { e.preventDefault(); submit(); }} aria-label={t('trip.formLabel')}>
          <div className="route-ends-grid">
          <div className="route-ends-fields">
          <PlaceField
            key={`from-${swaps}`}
            label={t('trip.from')}
            hideLabel
            placeholder={t('trip.fromPlaceholder')}
            value={trip.from}
            search={search}
            onChange={(from) => T.setTrip((x) => ({ ...x, from }))}
            onText={(v) => setLoose((l) => ({ ...l, from: v.trim() !== '' }))}
            extra={
              <button type="button" className="route-locate" onClick={() => T.locate()} disabled={T.locating === 'busy'}
                aria-label={T.locating === 'busy' ? t('trip.locating') : t('trip.useLocation')} title={t('trip.useLocation')}
                aria-busy={T.locating === 'busy'}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>
            }
          />
          {T.locating === 'denied' && <p className="small muted" role="status">{t('trip.locationDenied')}</p>}
          <PlaceField key={`to-${swaps}`} label={t('trip.to')} hideLabel placeholder={t('trip.toPlaceholder')} value={trip.to} search={search} near={trip.from} onChange={(to) => T.setTrip((x) => ({ ...x, to }))} onText={(v) => setLoose((l) => ({ ...l, to: v.trim() !== '' }))} />
          </div>
          <button type="button" className="btn route-swap" aria-label={t('route.swap')} title={t('route.swap')} onClick={() => { T.swap(); setSwaps((n) => n + 1); }} disabled={!trip.from && !trip.to}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14M5 16l3 3 3-3M16 19V5M13 8l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          </div>

          {!myCar ? (
            <button type="button" className="car-tile route-pickcar" onClick={openCarPicker}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7.3h9a2 2 0 0 1 1.9 1.3L20 13M4 13h16v5H4v-5ZM7 18v1.5M17 18v1.5M7.5 15.5h.01M16.5 15.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span className="car-tile-text"><strong>{t('car.tile.none')}</strong> <span className="muted">{t('route.carWhy')}</span></span>
            </button>
          ) : (
          <button type="button" className="car-tile route-car-row" aria-expanded={settingsOpen} aria-controls="route-settings" onClick={() => setSettingsOpen((o) => !o)}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7.3h9a2 2 0 0 1 1.9 1.3L20 13M4 13h16v5H4v-5ZM7 18v1.5M17 18v1.5M7.5 15.5h.01M16.5 15.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="car-tile-text">
              <strong>{carLabel}</strong>
              <span className="route-car-sub small muted">
                {t('route.carSub', { start: trip.startSoc, min: trip.thresholdSoc })}
                {dcUsed && <> · {dcUsed.length ? dcUsed.map((p) => t(`value.${p}` as MessageKey)).join(', ') : t('route.plugsNoneShort')}</>}
              </span>
            </span>
            <span className="sr-only">{t('route.settings')}</span>
            <svg className="route-car-chevron" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          )}
          {myCar && settingsOpen && (
            <div id="route-settings" className="route-settings">
              <div className="tp-pcts">
                <label>
                  <span className="tp-label">{t('trip.startSoc')}</span>
                  <input type="number" className="field-input" min={SOC_LIMITS.startMin} max={SOC_LIMITS.startMax} step={5}
                    value={trip.startSoc} onChange={(e) => T.setPct('startSoc', e.target.value)} />
                </label>
                <label>
                  <span className="tp-label">{t('trip.thresholdSoc')}</span>
                  <input type="number" className="field-input" min={SOC_LIMITS.thresholdMin} max={SOC_LIMITS.thresholdMax} step={5}
                    value={trip.thresholdSoc} onChange={(e) => T.setPct('thresholdSoc', e.target.value)} />
                </label>
              </div>
              {plugsLine}
              <button type="button" className="link-btn small" onClick={openCarPicker}>{t('trip.changeCar')}</button>
            </div>
          )}
          {(T.opts.avoidTolls || T.opts.avoidHighways) && (
            <p className="small muted route-avoid">
              {t(T.opts.avoidTolls && T.opts.avoidHighways ? 'route.avoid.both' : T.opts.avoidTolls ? 'route.avoid.tolls' : 'route.avoid.highways')}{' · '}
              <button type="button" className="link-btn" onClick={() => window.dispatchEvent(new CustomEvent('voltway:settings', { detail: 'route' }))}>{t('route.avoid.change')}</button>
            </p>
          )}
          {!T.pctValid && <p className="small tp-error" role="alert">{t('trip.pctInvalid', { ...SOC_LIMITS })}</p>}
          {planCar && !planCar.ok && (
            <div className="banner small route-carmissing">
              <p role="status">{t('trip.carMissing', { fields: planCar.missing.map((m) => t(`trip.missing.${m}` as MessageKey)).join(', ') })}</p>
              <button type="button" className="btn small" onClick={openCarPicker}>{t('trip.changeCar')}</button>
            </div>
          )}

          <div className="tp-actions route-go">
            {/* B68: with the same ends the plan is already current (battery changes re-plan by
                themselves), so the one button goes back to it. */}
            {current ? (
              <button type="button" className="btn primary" onClick={() => morph(() => setEditing(false), 'forward', 'left')}>{t('route.showPlan')}</button>
            ) : (
              <button type="submit" className="btn primary" disabled={!T.canPlan} aria-busy={status === 'planning'}>
                {status === 'planning' ? <><span className="road-loader" aria-hidden="true"><span /></span>{t('trip.planning')}</> : t('route.plan')}
              </button>
            )}
          </div>
          {((loose.from && !trip.from) || (loose.to && !trip.to)) && <p className="small muted tp-hint">{t('trip.needEnds')}</p>}
        </form>
      )}

      {T.shareUrl && !folded && (
        <p className="small tp-share" role="status">
          {t('trip.shareNote')} <input className="field-input" readOnly value={T.shareUrl} onFocus={(e) => e.target.select()} aria-label={t('trip.shareLink')} />
        </p>
      )}

      <div aria-live="polite">
        {status !== 'idle' && status !== 'done' && status !== 'planning' && (
          <p className="banner small" role="alert">
            {t(`trip.status.${status}` as MessageKey)}
            {/* B79: a cross-border trip with Stay within the border on says where to allow it. */}
            {(status === 'crossBorderCa' || status === 'crossBorderUs' || status === 'crossBorderAlaska') && (
              <>
                {' '}
                <button type="button" className="link-btn small" onClick={() => window.dispatchEvent(new CustomEvent('voltway:settings', { detail: 'border' }))}>
                  {t('trip.status.openSettings')}
                </button>
              </>
            )}
          </p>
        )}
        {plan && current && (
          <p className="sr-only" role="status">{plan.reachable ? t('trip.planned', { stops: stopsText(plan.totals.stops) }) : t('trip.plannedUnreachable')}</p>
        )}
      </div>

      {showDrive && plan && T.routeData && trip.from && trip.to && (
        <DriveView plan={plan} route={T.routeData.route} from={trip.from} to={trip.to} unit={T.unit} opts={T.opts}
          reached={reached} onReached={onReached} onFix={onDriveFix} />
      )}
      {!showDrive && folded && plan && myCar && trip.from && trip.to && (
        <Itinerary
          plan={plan}
          from={trip.from}
          to={trip.to}
          unit={T.unit}
          selected={selectedStop}
          onOpenStop={onOpenStop}
          open={sheetOpen}
          onToggle={() => setSheetOpen((o) => !o)}
          updated={updated}
          carUpdated={T.carUpdated}
          carLine={t('route.carLine', { car: carLabel, start: trip.startSoc, min: trip.thresholdSoc })}
          plugs={plugsInline}
          onShare={T.share}
          onDrive={openDrive}
          onNacs={T.nacsHelps && myCar && dcUsed ? () => setMyCar({ ...myCar, plugs: [...dcUsed, 'nacs'] }) : undefined}
          crossings={borderList}
          shareNote={T.shareUrl ? (
            <p className="small tp-share" role="status">
              {t('trip.shareNote')} <input className="field-input" readOnly value={T.shareUrl} onFocus={(e) => e.target.select()} aria-label={t('trip.shareLink')} />
            </p>
          ) : null}
        />
      )}
      </div>
    </section>
  );
}
