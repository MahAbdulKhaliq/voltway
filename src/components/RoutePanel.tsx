// Route mode on the charger map (B50, 3.18; route-planner.md §1): From, To, swap, one editable line
// for the car, start % and threshold, Plan route, then the itinerary. It replaces the filter panel
// while a route is open; Close route goes back to the plain map. After a plan the form folds into
// a one-line summary with Edit, so the itinerary gets the room.

import { PlanIcon, RouteIcon } from './ButtonIcons.tsx';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import { openCarPicker } from '../lib/car-label.ts';
import Itinerary from './Itinerary.tsx';
import ChangeLink from './ChangeLink.tsx';
import DriveView from './DriveView.tsx';
import { clearDrive, saveDrive } from '../lib/drive.ts';
import PlaceField, { loadUsPlaces } from './PlaceField.tsx';
import { borderRows } from '../lib/border-rows.ts';
import type { TripState, WeatherInfo } from './useTrip.ts';
import { setRouteOptions } from '../lib/route-options.ts';
import { currentTempUnit, TEMP_UNIT_EVENT } from '../lib/temp-unit.ts';
import { cToF, fToC, type TempUnit } from '../lib/temperature-effect.ts';
import { formatNumber } from '../lib/units.ts';
import { setMyCar, settingsChanged, type MyCar } from '../lib/my-car.ts';
import type { PlaceSearch } from '../lib/place-search.ts';
import { SOC_LIMITS, TEMP_LIMITS_C } from '../lib/trip-link.ts';
import { stopsText } from '../lib/trip-format.ts';
import PlugIcon from './PlugIcon.tsx';
import { morph, reducedMotion } from '../lib/motion.ts';
import type { IndexEntry } from '../lib/types.ts';

// B89: the summary line's values become spans, so they can grow into the fields.
const VAL_START = '\u0001', VAL_MIN = '\u0002';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // --ease-out
const OPEN_MS = 320, SHUT_MS = 220; // as the sections that unroll (road-unroll.ts)
/** B123: a temperature in the site's unit, whole degrees ("−10 °C"). */
function fmtTemp(c: number, unit: TempUnit): string {
  return t('trip.tempValue', { value: formatNumber(Math.round(unit === 'F' ? cToF(c) : c)).replace('-', '−'), unit: t(`temp.unit.${unit}`) });
}
function withValues(text: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return text.split(/([\u0001\u0002])/).map((part, i) => (part in nodes ? <span key={i}>{nodes[part]}</span> : part));
}

interface Props {
  trip: TripState;
  cars: IndexEntry[];
  myCar: MyCar | null;
  search: PlaceSearch | null;
  /** The stop whose station panel is open, if any. */
  selectedStop: number | null;
  onOpenStop: (index: number, button: HTMLButtonElement) => void;
  /** B89: the trip spot the map is closed in on ("border-<k>", "from", "to"), and what does it. */
  selectedSpot: string | null;
  onOpenSpot: (key: string, at: [number, number]) => void;
  onClose: () => void;
  /** B89 round 4: the phone sheet is at peek; the car card can't be used until it is raised. */
  peek?: boolean;
  /** Charger data date, YYYY-MM-DD. */
  updated: string | null;
  /** Drive progress from this tab (B72): reopen Drive once the trip is planned again. */
  resumeDrive: boolean[] | null;
  /** The car's position while Drive watches it, for the map dot. */
  onDriveFix: (at: [number, number] | null) => void;
}

export default function RoutePanel({ trip: T, cars, myCar, search, selectedStop, onOpenStop, selectedSpot, onOpenSpot, onClose, updated, resumeDrive, onDriveFix, peek = false }: Props) {
  const { trip, plan, status, current, planCar } = T;
  const [editing, setEditing] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // B89: the car tile is an accordion. Opening grows the start and charge-at values in its summary
  // line into the fields (they keep their place on screen and become the boxes); closing shrinks
  // the settings back into the line. Instant with Animations off.
  const startVal = useRef<HTMLSpanElement>(null), minVal = useRef<HTMLSpanElement>(null);
  const startIn = useRef<HTMLInputElement>(null), minIn = useRef<HTMLInputElement>(null);
  const settingsBox = useRef<HTMLDivElement>(null);
  const flipFrom = useRef<{ start: DOMRect; min: DOMRect; font: string } | null>(null);
  const accRef = useRef<HTMLDivElement>(null);
  const [shutting, setShutting] = useState(false);
  // Set when the close finishes: the card's height then, so the last step (the box goes, the
  // summary line takes back its values) eases instead of snapping.
  const fadeLine = useRef<number | null>(null);
  const toggleSettings = () => {
    const a = startVal.current, b = minVal.current;
    if (shutting) return;
    if (settingsOpen) {
      const box = settingsBox.current;
      if (box && !reducedMotion() && typeof box.animate === 'function') {
        // Held at 0 when it ends (fill), so nothing flashes back before the box is removed.
        const shrink = box.animate([{ height: `${box.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: SHUT_MS, easing: EASE, fill: 'forwards' });
        setShutting(true);
        shrink.finished.then(() => { fadeLine.current = accRef.current?.offsetHeight ?? 0; setShutting(false); setSettingsOpen(false); }, () => setShutting(false));
        return;
      }
      setSettingsOpen(false);
      return;
    }
    flipFrom.current = a && b ? { start: a.getBoundingClientRect(), min: b.getBoundingClientRect(), font: getComputedStyle(a).fontSize } : null;
    setSettingsOpen(true);
  };
  useLayoutEffect(() => {
    const from = flipFrom.current;
    flipFrom.current = null;
    // Closed again: the values come back into the summary line softly.
    if (!settingsOpen && fadeLine.current !== null) {
      const acc = accRef.current, was = fadeLine.current;
      fadeLine.current = null;
      if (acc && was && Math.abs(acc.offsetHeight - was) > 1) {
        acc.style.overflow = 'clip';
        acc.animate?.([{ height: `${was}px` }, { height: `${acc.offsetHeight}px` }], { duration: 160, easing: EASE })
          .finished.finally(() => { acc.style.overflow = ''; }).catch(() => {});
      }
      acc?.querySelectorAll<HTMLElement>('.route-soc').forEach((el) =>
        el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: EASE }));
      return;
    }
    if (!settingsOpen || !from || reducedMotion()) return;
    const box = settingsBox.current;
    if (!box || typeof box.animate !== 'function') return;
    box.animate([{ height: '0px' }, { height: `${box.offsetHeight}px` }], { duration: OPEN_MS, easing: EASE });
    // Each value grows into its field from where it sat in the line.
    for (const [el, r] of [[startIn.current, from.start], [minIn.current, from.min]] as const) {
      if (!el) continue;
      const to = el.getBoundingClientRect();
      el.animate([
        { translate: `${r.left - to.left}px ${r.top - to.top}px`, width: `${r.width + 8}px`, height: `${r.height}px`, fontSize: from.font, borderColor: 'transparent', backgroundColor: 'transparent', paddingLeft: '0px' },
        { translate: '0px 0px', width: `${to.width}px`, height: `${to.height}px` },
      ], { duration: OPEN_MS, easing: EASE });
    }
    // The labels, the plugs line and Change car rise in after them.
    [...box.querySelectorAll<HTMLElement>('.tp-sec-title, .tp-label, .tp-switch, .route-car-plugs, .route-car-change')].forEach((el, i) =>
      el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: 120 + i * 30, easing: EASE, fill: 'backwards' }));
  }, [settingsOpen]);
  // B123: Weather and wheels. The temperature is typed in the site's unit (Settings) and kept in °C.
  const W = T.weatherInfo;
  const [tempUnit, setTempUnitState] = useState<TempUnit>('C');
  useEffect(() => {
    setTempUnitState(currentTempUnit());
    const on = (e: Event) => setTempUnitState((e as CustomEvent<TempUnit>).detail === 'F' ? 'F' : 'C');
    // With no °C/°F saved, the temperature follows km/mi (B116), so a distance switch can change it too.
    const onUnits = () => setTempUnitState(currentTempUnit());
    window.addEventListener(TEMP_UNIT_EVENT, on);
    window.addEventListener('voltway:units', onUnits);
    return () => { window.removeEventListener(TEMP_UNIT_EVENT, on); window.removeEventListener('voltway:units', onUnits); };
  }, []);
  const tempIn = useRef<HTMLInputElement>(null);
  const [tempText, setTempText] = useState('');
  const typedC = (txt: string): number => {
    const n = txt.trim() === '' ? Number.NaN : Number(txt);
    return tempUnit === 'F' ? fToC(n) : n;
  };
  const tempOk = (c: number) => Number.isFinite(c) && c >= TEMP_LIMITS_C.min && c <= TEMP_LIMITS_C.max;
  // The field follows the trip's temperature (a link, a unit change) unless it already says it.
  useEffect(() => {
    setTempText((txt) => (Math.abs(typedC(txt) - trip.tempC) < 0.06 ? txt : String(Math.round(tempUnit === 'F' ? cToF(trip.tempC) : trip.tempC))));
  }, [trip.tempC, tempUnit]); // eslint-disable-line react-hooks/exhaustive-deps
  const onTempText = (v: string) => {
    setTempText(v);
    const c = typedC(v);
    if (tempOk(c)) T.setTempC(c);
  };
  const tempBad = trip.weather && !tempOk(typedC(tempText));
  // Owner 2026-11-20: said as range (same battery, more energy per km = less range).
  const estimateText = (factor: number) => {
    const pct = Math.round((1 / factor - 1) * 100);
    return pct === 0 ? t('trip.weatherEstimateSame') : t(pct < 0 ? 'trip.weatherEstimateLess' : 'trip.weatherEstimateMore', { pct: Math.abs(pct) });
  };
  const wheelsText = (w: WeatherInfo) =>
    w.wheelIn === null ? t('trip.wheelsUnknown') : t(w.wheelsChanged ? 'trip.wheels' : 'trip.wheelsStandard', { size: w.wheelIn });
  const hpKey = (w: WeatherInfo) =>
    w.heatPump === 'optional' ? (w.heatPumpFitted ? 'fitted' : 'notFitted') : w.heatPump;
  // "Change" under the closed card and the results hint open the card at Route or at Weather and
  // wheels (the hint also turns the switch on and puts the cursor in the temperature field).
  // Owner 2026-11-20: Route and Plugs used fold to a summary line (open state).
  const [routeOpen, setRouteOpen] = useState(false);
  const focusAt = useRef<'route' | 'weather' | null>(null);
  const openCardAt = (at: 'route' | 'weather', fromResults = false) => {
    focusAt.current = at;
    if (at === 'route') setRouteOpen(true);
    // Owner 2026-11-20: "Cold out? Change" only takes the visitor to Range adjustments (no switching it on, no keyboard).
    if (fromResults) morph(() => { setEditing(true); setSettingsOpen(true); }, 'back', 'left');
    else if (!settingsOpen) toggleSettings();
    else setFocusTick((n) => n + 1);
  };
  const [focusTick, setFocusTick] = useState(0);
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
  // B123: after openCardAt, once the card is open, bring the asked-for part into view and focus it.
  useEffect(() => {
    const at = focusAt.current;
    if (!at || !settingsOpen || folded) return;
    // The card's sections can mount a frame or two after it opens (from the results), so look again for a few frames.
    let id = 0;
    let tries = 0;
    const go = () => {
      const sec = document.getElementById(at === 'route' ? 'route-sec-route' : 'route-sec-weather');
      const target = sec?.querySelector<HTMLElement>('[role="switch"]');
      if (!sec || !target) { if (++tries < 20) id = requestAnimationFrame(go); return; }
      focusAt.current = null;
      sec.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
      target.focus({ preventScroll: true });
    };
    id = requestAnimationFrame(go);
    return () => cancelAnimationFrame(id);
  }, [settingsOpen, folded, trip.weather, focusTick, routeOpen]);

  // B55: the DC plugs the plan used (My car's switches), with a way to change them.
  const dcUsed = planCar?.ok ? planCar.car.rule.plugs.filter((p) => p !== 'j1772') : null;
  // B89: the plugs as a list with the map filter's plug drawings, on a raised panel.
  // Owner 2026-11-20: Route and Plugs used fold to a title and a summary line; Battery stays open.
  const fold = (k: 'route', title: string, summary: string) => {
    const open = routeOpen;
    return (
      <button type="button" className="tp-fold" aria-expanded={open} aria-controls={open ? `tp-fold-${k}` : undefined}
        onClick={() => setRouteOpen((o) => !o)}>
        <span className="tp-fold-text">
          <span className="route-car-plugs-title">{title}</span>
          {!open && <span className="small muted">{summary}</span>}
        </span>
        <span className="acc-chev" aria-hidden="true" />
      </button>
    );
  };
  const routeSummary = [
    T.opts.avoidTolls && T.opts.avoidHighways ? t('route.avoid.both') : T.opts.avoidTolls ? t('route.avoid.tolls') : T.opts.avoidHighways ? t('route.avoid.highways') : t('trip.routeFastest'),
    T.opts.crossBorder ? t('trip.routeCross') : t('trip.routeStay'),
  ].join(' · ');
  /** A grey line with "Change ›" on the right that opens where it is changed (owner 2026-11-20). */
  const changeRow = (line: ReactNode, srName: string, onClick: () => void) => (
    <button type="button" className="tp-car-row" onClick={onClick}>
      <span className="small muted">{line}</span>
      <span className="tp-car-row-go" aria-hidden="true">{t('trip.carChange')}
        <svg width="14" height="14" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
      </span>
      <span className="sr-only">{srName}</span>
    </button>
  );
  // Plugs used: the title, then the plugs (with the map filter's drawings) as a Change row that
  // opens the My car menu's plug switches.
  const plugsLine = dcUsed && (
    <div className="route-car-plugs">
      <h3 className="route-car-plugs-title">{t('route.plugsTitle')}</h3>
      {changeRow(
        dcUsed.length
          ? <span className="tp-plugs">{dcUsed.map((p) => <span key={p}><PlugIcon plug={p} />{t(`value.${p}` as MessageKey)}</span>)}</span>
          : t('route.plugsNone'),
        t('route.plugsChange'),
        () => window.dispatchEvent(new CustomEvent('voltway:mycar-menu')),
      )}
    </div>
  );
  // The trip card's line (B67): charging time, then the plugs used and a way to change them.
  const plugsInline = dcUsed && (
    <>
      {' · '}{dcUsed.length ? dcUsed.map((p) => t(`value.${p}` as MessageKey)).join(', ') : t('route.plugsNoneShort')}{' '}
      <ChangeLink label={t('route.plugsChange')} onClick={() => window.dispatchEvent(new CustomEvent('voltway:mycar-menu'))} />
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
          <div ref={accRef} inert={peek} className={`car-tile route-car-acc${settingsOpen ? ' open' : ''}${shutting ? ' shutting' : ''}`}>
          <button type="button" className="route-car-row" aria-expanded={settingsOpen} aria-controls="route-settings" onClick={toggleSettings}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7.3h9a2 2 0 0 1 1.9 1.3L20 13M4 13h16v5H4v-5ZM7 18v1.5M17 18v1.5M7.5 15.5h.01M16.5 15.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="car-tile-text">
              <strong>{carLabel}{settingsChanged(myCar) && <><span className="car-changed" aria-hidden="true">*</span><span className="sr-only"> ({t('mycar.changed')})</span></>}</strong>
              <span className="route-car-sub small muted">
                {/* Open: the values and plugs live in the card below, so the line names what's there. */}
                {settingsOpen ? t('route.settings') : (
                  <>
                    {withValues(t('route.carSub', { start: VAL_START, min: VAL_MIN }), {
                      [VAL_START]: <span ref={startVal} className="route-soc">{trip.startSoc}</span>,
                      [VAL_MIN]: <span ref={minVal} className="route-soc">{trip.thresholdSoc}</span>,
                    })}
                    {dcUsed && <> · {dcUsed.length ? dcUsed.map((p) => t(`value.${p}` as MessageKey)).join(', ') : t('route.plugsNoneShort')}</>}
                    {/* B123: the weather the plan uses, so Trip settings is one look away. */}
                    {' · '}{trip.weather ? fmtTemp(trip.tempC, tempUnit) : t('route.weatherMild')}
                  </>
                )}
              </span>
            </span>
            {!settingsOpen && <span className="sr-only">{t('route.settings')}</span>}
            <span className="acc-chev" aria-hidden="true" />
          </button>
          {settingsOpen && <span className="acc-lane" aria-hidden="true" />}
          {settingsOpen && (
            <div id="route-settings" className="route-settings" ref={settingsBox}>
              {/* B123: Battery, Route, Weather and wheels, then the plugs and the car rows. */}
              <div className="tp-sec tp-sec-battery">
                <h3 className="route-car-plugs-title tp-sec-title">{t('trip.batteryTitle')}</h3>
                <div className="tp-pcts tp-pcts-3">
                  <label>
                    <span className="tp-label" aria-hidden="true">{t('trip.start')}</span>
                    <span className="tp-suffix-field">
                      <input ref={startIn} type="number" className="field-input" min={SOC_LIMITS.startMin} max={SOC_LIMITS.startMax} step={5}
                        aria-label={t('trip.startSoc')} value={trip.startSoc} onChange={(e) => T.setPct('startSoc', e.target.value)} />
                      <span className="tp-suffix" aria-hidden="true">%</span>
                    </span>
                  </label>
                  <label>
                    <span className="tp-label" aria-hidden="true">{t('trip.chargeAt')}</span>
                    <span className="tp-suffix-field">
                      <input ref={minIn} type="number" className="field-input" min={SOC_LIMITS.thresholdMin} max={SOC_LIMITS.thresholdMax} step={5}
                        aria-label={t('trip.thresholdSoc')} value={trip.thresholdSoc} onChange={(e) => T.setPct('thresholdSoc', e.target.value)} />
                      <span className="tp-suffix" aria-hidden="true">%</span>
                    </span>
                  </label>
                  <label>
                    <span className="tp-label" aria-hidden="true">{t('trip.arriveAt')}</span>
                    <span className="tp-suffix-field">
                      <input type="number" className="field-input" min={SOC_LIMITS.arriveMin} max={SOC_LIMITS.arriveMax} step={5}
                        aria-label={t('trip.arriveSoc')} value={trip.arriveSoc} onChange={(e) => T.setPct('arriveSoc', e.target.value)} />
                      <span className="tp-suffix" aria-hidden="true">%</span>
                    </span>
                  </label>
                </div>
              </div>
              <div className="tp-sec" id="route-sec-route">
                {fold('route', t('trip.routeTitle'), routeSummary)}
                {/* The same stored options as the Settings menu (B73, B79): either place changes both. */}
                {routeOpen && <div id="tp-fold-route" className="tp-fold-body">{([
                  ['avoidTolls', t('settings.avoidTolls'), T.opts.avoidTolls],
                  ['avoidHighways', t('settings.avoidHighways'), T.opts.avoidHighways],
                  ['crossBorder', t('settings.inBorder'), !T.opts.crossBorder],
                ] as const).map(([k, label, on]) => (
                  <button key={k} type="button" role="switch" aria-checked={on} className="tp-switch"
                    onClick={() => setRouteOptions({ ...T.opts, [k]: !T.opts[k] })}>
                    <span>{label}</span><span className="switch" aria-hidden="true" />
                  </button>
                ))}</div>}
              </div>
              <div className="tp-sec" id="route-sec-weather">
                <button type="button" role="switch" aria-checked={trip.weather} className="tp-switch tp-switch-head" onClick={() => T.setWeather(!trip.weather)}>
                  <span className="route-car-plugs-title">{t('trip.weather')}</span><span className="switch" aria-hidden="true" />
                </button>
                {!trip.weather && <p className="small muted tp-sum">{t('trip.weatherOffLine')}</p>}
                {trip.weather && (
                  <div className="tp-weather">
                    <label className="tp-temp">
                      <span className="tp-label">{t('trip.weatherTemp')}</span>
                      <span className="tp-suffix-field">
                        <input ref={tempIn} type="number" inputMode="decimal" className="field-input" step={1}
                          aria-label={t('temp.inputLabel', { unit: t(`temp.unit.${tempUnit}`) })} aria-invalid={tempBad || undefined}
                          aria-describedby={tempBad ? 'tp-temp-error' : undefined}
                          value={tempText} onChange={(e) => onTempText(e.target.value)} />
                        <span className="tp-suffix" aria-hidden="true">{t(`temp.unit.${tempUnit}`)}</span>
                      </span>
                    </label>
                    {tempBad && <p id="tp-temp-error" className="small tp-error" role="alert">{t('trip.weatherTempInvalid', { min: fmtTemp(TEMP_LIMITS_C.min, tempUnit), max: fmtTemp(TEMP_LIMITS_C.max, tempUnit) })}</p>}
                    {W && (
                      <>
                        {/* Owner 2026-11-20: My car's wheels and heat pump feed this, so the way to
                            change them (Modify car settings) lives here, as the line itself. */}
                        {changeRow(t('trip.weatherCar', { wheels: wheelsText(W), heatPump: t(`trip.hp.${hpKey(W)}` as MessageKey) }), t('mycar.settings'),
                          () => window.dispatchEvent(new CustomEvent('voltway:mycar-settings')))}
                        {/* Owner 2026-11-20: the estimate is the answer, so it comes last and stands out. */}
                        <p className="tp-estimate" aria-live="polite">{estimateText(W.effect.factor)}</p>
                        {W.effect.clamped && <p className="small muted">{t('trip.weatherClamped')}</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
              {plugsLine}
              <button type="button" className="route-car-change" onClick={openCarPicker}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7.3h9a2 2 0 0 1 1.9 1.3L20 13M4 13h16v5H4v-5ZM7 18v1.5M17 18v1.5M7.5 15.5h.01M16.5 15.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                <span>{t('trip.changeCar')}</span>
                <svg className="route-car-change-go" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>
            </div>
          )}
          </div>
          )}
          {(T.opts.avoidTolls || T.opts.avoidHighways) && (
            <p className="small muted route-avoid">
              {t(T.opts.avoidTolls && T.opts.avoidHighways ? 'route.avoid.both' : T.opts.avoidTolls ? 'route.avoid.tolls' : 'route.avoid.highways')}{' · '}
              <ChangeLink label={t('trip.routeChangeLabel')} onClick={() => openCardAt('route')} />
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
              <button type="button" className="btn primary btn-with-icon" onClick={() => morph(() => setEditing(false), 'forward', 'left')}><PlanIcon />{t('route.showPlan')}</button>
            ) : (
              <button type="submit" className="btn primary btn-with-icon" disabled={!T.canPlan} aria-busy={status === 'planning'}>
                {status === 'planning' ? <><span className="road-loader" aria-hidden="true"><span /></span>{t('trip.planning')}</> : <><RouteIcon />{t('route.plan')}</>}
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
          reached={reached} onReached={onReached} onFix={onDriveFix}
          selected={selectedStop} onOpenStop={onOpenStop} selectedSpot={selectedSpot} onOpenSpot={onOpenSpot} />
      )}
      {!showDrive && folded && plan && myCar && trip.from && trip.to && (
        <Itinerary
          plan={plan}
          from={trip.from}
          to={trip.to}
          unit={T.unit}
          selected={selectedStop}
          onOpenStop={onOpenStop}
          selectedSpot={selectedSpot}
          onOpenSpot={onOpenSpot}
          updated={updated}
          carUpdated={T.carUpdated}
          carLine={t('route.carLine', { car: carLabel, start: trip.startSoc, min: trip.thresholdSoc })}
          plugs={plugsInline}
          onShare={T.share}
          onDrive={openDrive}
          onNacs={T.nacsHelps && myCar && dcUsed ? () => setMyCar({ ...myCar, plugs: [...dcUsed, 'nacs'] }) : undefined}
          crossings={borderList}
          weatherOn={trip.weather}
          weatherHint={
            <p className="small muted ti-weather">
              {trip.weather
                ? (T.weatherInfo?.wheelIn
                  ? t('trip.hintOn', { temp: fmtTemp(trip.tempC, tempUnit), wheels: t('trip.wheels', { size: T.weatherInfo.wheelIn }) })
                  : t('trip.hintOnNoWheels', { temp: fmtTemp(trip.tempC, tempUnit) }))
                : t('trip.hintCold')}{' '}
              {/* Owner 2026-11-20 (B131): "Change ›" like the other trip links, on or off. */}
              <ChangeLink label={t('trip.hintChange')} onClick={() => openCardAt('weather', true)} />
            </p>
          }
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
