// Route mode on the charger map (B50, 3.18; route-planner.md §1): From, To, swap, one editable line
// for the car, start % and threshold, Plan route, then the itinerary. It replaces the filter panel
// while a route is open; Close route goes back to the plain map. After a plan the form folds into
// a one-line summary with Edit, so the itinerary gets the room.

import { useEffect, useRef, useState } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import { openCarPicker } from '../lib/car-label.ts';
import Itinerary from './Itinerary.tsx';
import PlaceField from './PlaceField.tsx';
import type { TripState } from './useTrip.ts';
import type { MyCar } from '../lib/my-car.ts';
import type { PlaceSearch } from '../lib/place-search.ts';
import { SOC_LIMITS } from '../lib/trip-link.ts';
import { stopsText } from '../lib/trip-format.ts';
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
}

export default function RoutePanel({ trip: T, cars, myCar, search, selectedStop, onOpenStop, onClose, updated }: Props) {
  const { trip, plan, status, current, planCar } = T;
  const [editing, setEditing] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Swapping remounts both fields so each shows its new end (a field keeps typed text otherwise).
  const [swaps, setSwaps] = useState(0);
  const folded = current && !editing;
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
  const carLabel = myCar ? (myCar.label ?? cars.find((c) => c.id === myCar.carId)?.name ?? myCar.carId) : '';
  // Each new plan (Plan route, or a link that plans at once) folds the form so the itinerary has room.
  const planKey = current ? T.routeData?.key ?? '' : '';
  const foldedFor = useRef('');
  useEffect(() => {
    if (!planKey || planKey === foldedFor.current) return; // a car change re-plans the same route: leave the panel as it is
    foldedFor.current = planKey;
    setEditing(false);
    setSheetOpen(false);
  }, [planKey]);
  const submit = async () => {
    await T.submit();
    if (T.current) setEditing(false); // same ends: the plan on screen is already current
  };

  return (
    <section className={`route-panel${folded ? ' folded' : ''}`} aria-label={t('route.label')}>
      <div className="route-head">
        <h2 className="route-title" ref={headRef} tabIndex={-1}>{t('route.title')}</h2>
        <button type="button" className="map-place-close" aria-label={t('route.close')} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {folded ? (
        <div className="route-summary">
          <p className="route-ends"><strong>{trip.from?.label}</strong> → <strong>{trip.to?.label}</strong></p>
          <p className="small muted">{t('route.carLine', { car: carLabel, start: trip.startSoc, min: trip.thresholdSoc })}</p>
          {plugsLine}
          <div className="tp-actions">
            <button type="button" className="btn small" onClick={() => setEditing(true)}>{t('route.edit')}</button>
            <button type="button" className="btn small" onClick={T.share}>{t('trip.share')}</button>
          </div>
        </div>
      ) : (
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
          <PlaceField key={`to-${swaps}`} label={t('trip.to')} hideLabel placeholder={t('trip.toPlaceholder')} value={trip.to} search={search} onChange={(to) => T.setTrip((x) => ({ ...x, to }))} />
          </div>
          <button type="button" className="btn route-swap" aria-label={t('route.swap')} title={t('route.swap')} onClick={() => { T.swap(); setSwaps((n) => n + 1); }} disabled={!trip.from && !trip.to}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 4v14M7 18l-3-3M7 18l3-3M17 20V6M17 6l-3 3M17 6l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
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
          {!T.pctValid && <p className="small tp-error" role="alert">{t('trip.pctInvalid', { ...SOC_LIMITS })}</p>}
          {planCar && !planCar.ok && (
            <div className="banner small route-carmissing">
              <p role="status">{t('trip.carMissing', { fields: planCar.missing.map((m) => t(`trip.missing.${m}` as MessageKey)).join(', ') })}</p>
              <button type="button" className="btn small" onClick={openCarPicker}>{t('trip.changeCar')}</button>
            </div>
          )}

          <div className="tp-actions route-go">
            <button type="submit" className="btn primary" disabled={!T.canPlan}>
              {status === 'planning' ? t('trip.planning') : t('route.plan')}
            </button>
            {current && <button type="button" className="btn" onClick={() => setEditing(false)}>{t('route.showPlan')}</button>}
          </div>
          {(!trip.from || !trip.to) && <p className="small muted tp-hint">{t('trip.needEnds')}</p>}
        </form>
      )}

      {T.shareUrl && (
        <p className="small tp-share" role="status">
          {t('trip.shareNote')} <input className="field-input" readOnly value={T.shareUrl} onFocus={(e) => e.target.select()} aria-label={t('trip.shareLink')} />
        </p>
      )}

      <div aria-live="polite">
        {status !== 'idle' && status !== 'done' && status !== 'planning' && (
          <p className="banner small" role="alert">{t(`trip.status.${status}` as MessageKey)}</p>
        )}
        {plan && current && (
          <p className="sr-only" role="status">{plan.reachable ? t('trip.planned', { stops: stopsText(plan.totals.stops) }) : t('trip.plannedUnreachable')}</p>
        )}
      </div>

      {plan && current && myCar && trip.from && trip.to && (
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
        />
      )}
    </section>
  );
}
