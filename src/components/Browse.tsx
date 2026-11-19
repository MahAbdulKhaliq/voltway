// Cars tab (database-ui.md §4, B39): search, filters (side panel; bottom sheet on phones),
// cards or a sortable table. Each car opens in the Charging tab. Choices are remembered.
//
// B86 (owner, 2026-11-19): the content-page design language (design-language.md) and "Live
// reflow". Every filter category is a collapsible section showing its choices as pills; sections
// start closed unless a filter in them is set, and the visitor's open/closed choices are remembered.
// Filtering, searching and sorting animate the results (useFlip), the count ticks, and search
// highlights the matched words. With Animations off every change is instant.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import { COVERAGE } from '../config.ts';
import {
  activeCount, DEFAULT_DIR, defaultFilters, matches, optionsFor, readState, SORTS, sortCars,
  type BrowseFilters, type BrowseState, type SortKey,
} from '../lib/browse.ts';
import { makeCarSearch } from '../lib/car-search.ts';
import { displayMinutes } from '../lib/charging.ts';
import { valueLabel } from '../lib/format.ts';
import { reducedMotion } from '../lib/motion.ts';
import { addToCompare, getCompare, type AddResult } from '../lib/my-car.ts';
import { getItem, getJSON, setJSON, KEYS } from '../lib/storage.ts';
import { formatNumber, kmTo, whPerKmToDisplay, type DistanceUnit } from '../lib/units.ts';
import VariantName from './VariantName.tsx';
import { Accordion } from './react/Accordion.tsx';
import { useFlip } from './react/useFlip.ts';
import type { IndexEntry } from '../lib/types.ts';

interface Props { index: IndexEntry[] }

const RANGE_MAX = 700;  // km
const DC_MAX = 350;     // kW
const TIME_MAX = 60;    // min; the slider's top means "off"

const carHref = (id: string) => `/charging?car=${id.split('/').map(encodeURIComponent).join('/')}`;
const carName = (e: IndexEntry) => `${e.year} ${e.make} ${e.model} ${e.name}`;
const same = (a: readonly unknown[], b: readonly unknown[]) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

/** The search words, marked where they start a word in `text` (B86). */
function Mark({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const esc = terms.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length);
  const re = new RegExp(`(^|[\\s\\-/(])(${esc.join('|')})`, 'gi');
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = (m.index ?? 0) + m[1].length;
    if (at > last) out.push(text.slice(last, at));
    out.push(<mark key={at} className="hit">{m[2]}</mark>);
    last = at + m[2].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** The result count, counting to its new value; screen readers get the final text from the status line. */
function Ticker({ value, render }: { value: number; render: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const drawn = useRef(value); // the number on screen, so an interrupted tick carries on from it
  useEffect(() => {
    const start = drawn.current;
    const show = (n: number) => { drawn.current = n; setShown(n); };
    if (start === value || reducedMotion()) { show(value); return; }
    const t0 = performance.now();
    let frame = 0;
    const step = (now: number) => {
      // A frame's timestamp can be a little earlier than t0; clamp so the count never overshoots.
      const p = Math.min(1, Math.max(0, (now - t0) / 360));
      const eased = 1 - Math.pow(1 - p, 3);
      show(Math.round(start + (value - start) * eased));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{render(shown)}</>;
}

export default function Browse({ index }: Props) {
  const [state, setState] = useState<BrowseState>(() => readState(null, index));
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [compare, setCompareList] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Filter sections the visitor opened or closed (B86); the others follow "open when in use".
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const sheetBtn = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const cardsEl = useRef<HTMLUListElement>(null);
  const ghostEl = useRef<HTMLDivElement>(null);
  const rowsEl = useRef<HTMLTableSectionElement>(null);
  const search = useMemo(() => makeCarSearch(index), [index]);

  // Remembered choices, units and the comparison list (browser only, after hydration).
  useEffect(() => {
    setState(readState(getJSON<unknown>(KEYS.browse, null), index));
    const savedOpen = getJSON<unknown>(KEYS.browseOpen, {});
    if (savedOpen && typeof savedOpen === 'object' && !Array.isArray(savedOpen)) {
      setOpened(Object.fromEntries(Object.entries(savedOpen as Record<string, unknown>).filter(([, v]) => typeof v === 'boolean')) as Record<string, boolean>);
    }
    setUnit(getItem(KEYS.units) === 'mi' ? 'mi' : 'km');
    setCompareList(getCompare());
    setReady(true);
    const onUnits = (e: Event) => setUnit((e as CustomEvent<DistanceUnit>).detail);
    const onCompare = (e: Event) => setCompareList((e as CustomEvent<string[]>).detail);
    window.addEventListener('voltway:units', onUnits);
    window.addEventListener('voltway:compare', onCompare);
    return () => {
      window.removeEventListener('voltway:units', onUnits);
      window.removeEventListener('voltway:compare', onCompare);
    };
  }, [index]);
  useEffect(() => { if (ready) setJSON(KEYS.browse, state); }, [state, ready]);
  const setOpen = (id: string, open: boolean) => setOpened((o) => {
    if (o[id] === open) return o;
    const next = { ...o, [id]: open };
    setJSON(KEYS.browseOpen, next);
    return next;
  });

  // Escape closes the phone sheet and returns focus to its button.
  useEffect(() => {
    if (!sheetOpen) return;
    // The phone sheet is modal: focus moves in, Tab stays inside, Escape closes.
    sheetRef.current?.querySelector<HTMLElement>('.bf-close')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSheetOpen(false); sheetBtn.current?.focus(); return; }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const els = [...sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], summary')]
        .filter((el) => el.offsetParent !== null);
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const f = state.filters;
  const setF = (patch: Partial<BrowseFilters>) => setState((s) => ({ ...s, filters: { ...s.filters, ...patch } }));
  const setSort = (sort: SortKey, dir = DEFAULT_DIR[sort]) => setState((s) => ({ ...s, sort, dir }));

  const results = useMemo(() => {
    const hits = query.trim() ? new Set(search(query)) : null;
    const pool = index.filter((e) => matches(e, f) && (!hits || hits.has(e.id)));
    return sortCars(pool, state.sort, state.dir);
  }, [index, f, query, search, state.sort, state.dir]);
  const terms = query.trim().split(/\s+/).filter((w) => w.length > 0);

  // Live reflow: the cards (or table rows) animate whenever the shown list or its order changes.
  const order = `${state.view}:${results.map((e) => e.id).join('|')}`;
  useFlip(state.view === 'cards' ? cardsEl : rowsEl, state.view === 'cards' ? ghostEl : null, order);

  const active = activeCount(f, index);
  const onCompare = (e: IndexEntry) => {
    const r: AddResult = addToCompare(e.id);
    setNotice(r === 'full' ? t('browse.compareFull') : null);
  };

  // Figures as shown, with "~" for estimates.
  const distanceText = (km: number) => t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(km, unit)) });
  const rangeText = (e: IndexEntry) => (e.range_km === null ? null : distanceText(e.range_km));
  const effText = (e: IndexEntry) => (e.consumption_wh_per_km === null ? null : t(unit === 'km' ? 'fmt.kwh100km' : 'fmt.kwh100mi', { value: formatNumber(whPerKmToDisplay(e.consumption_wh_per_km, unit), 1) }));
  const dcText = (e: IndexEntry) => (e.dc_max_kw === null ? null : t('fmt.kw', { value: formatNumber(e.dc_max_kw) }));
  const timeText = (e: IndexEntry) => {
    const m = e.derived.minutes_10_80;
    if (m === null) return null;
    return e.derived.estimated ? t('fmt.approxMin', { value: displayMinutes(m, true) }) : t('fmt.min', { value: displayMinutes(m, false) });
  };
  const km10Text = (e: IndexEntry) => {
    const k = e.derived.km_per_10_min;
    if (k === null) return null;
    const text = distanceText(k);
    return e.derived.estimated ? `~${text}` : text;
  };
  const curveBadge = (e: IndexEntry) => {
    if (!e.curve_kind) return <span className="muted small">{t('browse.noCurve')}</span>;
    const measured = e.curve_kind !== 'estimated';
    return <span className={`kind-tag ${measured ? 'measured' : 'estimated'}`}>{t(`kind.${e.curve_kind}` as MessageKey)}</span>;
  };
  const unknown = <span className="muted">{t('badge.unknown')}</span>;
  const show = (s: string | null) => s ?? unknown;

  const compareBtn = (e: IndexEntry) => {
    const inList = compare.includes(e.id);
    return (
      <button type="button" className="btn small" onClick={() => onCompare(e)} disabled={inList} aria-label={inList ? undefined : t('browse.compareFor', { car: carName(e) })}>
        {inList ? t('browse.compareAdded') : t('browse.compare')}
      </button>
    );
  };

  // ---- Filter panel ----
  const d = defaultFilters(index);
  const isOpen = (id: string, inUse: boolean) => (id in opened ? opened[id] : inUse);
  // Each category: a section that unrolls, plus its own Clear button beside the header while the filter is set
  // (a button can't sit inside <summary>, so it is placed over the header row, before it in tab order).
  const section = (id: string, title: string, inUse: boolean, chips: string[], body: ReactNode, reset: Partial<BrowseFilters>) => (
    <div key={id} className={`bf-sec-wrap${inUse ? ' has-clear' : ''}`}>
      {inUse && (
        <button type="button" className="bf-sec-clear" aria-label={t('browse.clearFor', { filter: title })}
          onClick={(ev) => { const wrap = ev.currentTarget.parentElement; setF(reset); requestAnimationFrame(() => wrap?.querySelector<HTMLElement>('summary')?.focus()); }}>
          {t('browse.clearOne')}
        </button>
      )}
      <Accordion bare level={3} className="bf-sec" title={title} chips={chips} open={isOpen(id, inUse)} onToggle={(o) => setOpen(id, o)}>
        {body}
      </Accordion>
    </div>
  );
  // Choices as a checkbox (or radio) list.
  const checks = (legend: string, all: string[], chosen: string[], toggle: (v: string, on: boolean) => void, text: (v: string) => string, kind: 'checkbox' | 'radio' = 'checkbox', name?: string) => (
    <fieldset className="bf-list">
      <legend className="sr-only">{legend}</legend>
      {all.map((v) => (
        <label key={v} className="bf-check">
          <input type={kind} name={name} checked={chosen.includes(v)} onChange={(ev) => toggle(v, ev.target.checked)} />
          <span>{text(v)}</span>
        </label>
      ))}
    </fieldset>
  );
  const listSection = (id: string, label: string, all: string[], chosen: string[], key: 'makes' | 'bodies' | 'drivetrains' | 'ports' | 'voltages' | 'chemistries', text: (v: string) => string = valueLabel) =>
    section(id, label, chosen.length > 0, all.filter((v) => chosen.includes(v)).map(text),
      checks(label, all, chosen, (v, on) => setF({ [key]: on ? [...chosen, v] : chosen.filter((x) => x !== v) }), text), { [key]: [] });
  // One-handle sliders in the map's kW-slider look (design-language.md §4).
  const slider = (id: string, label: string, value: number, max: number, step: number, onChange: (n: number) => void, words: string) => (
    <div className="bf-slider">
      <label htmlFor={id} className="bf-label">{label}: <strong>{words}</strong></label>
      <div className="power-track">
        <div className="power-rail" aria-hidden="true" />
        <div className="power-fill" aria-hidden="true" style={{ left: 0, width: `${(value / max) * 100}%` }} />
        <input id={id} type="range" min={0} max={max} step={step} value={value} aria-valuetext={words} onChange={(ev) => onChange(Number(ev.target.value))} />
      </div>
    </div>
  );
  const sw = (on: boolean, label: ReactNode, toggle: () => void, help?: string) => (
    <button type="button" role="switch" aria-checked={on} className="bf-switch" onClick={toggle}>
      <span className="bf-switch-text">{label}{help && <span className="muted small bf-help">{help}</span>}</span>
      <span className="switch" aria-hidden="true" />
    </button>
  );
  const years = [...new Set(index.map((e) => e.year))].sort((a, b) => b - a);
  const rangeWords = f.minRangeKm > 0 ? t('browse.atLeast', { value: distanceText(f.minRangeKm) }) : t('browse.off');
  const dcWords = f.minDcKw > 0 ? t('browse.atLeast', { value: t('fmt.kw', { value: f.minDcKw }) }) : t('browse.off');
  const timeWords = f.max1080Min > 0 ? t('browse.atMost', { value: t('fmt.min', { value: f.max1080Min }) }) : t('browse.off');
  const bodyText = (v: string) => t(`body.${v}` as MessageKey);

  const panel = (
    <div className="bf-body">
      <div className="bf-switches">
        {sw(f.canadaOnly, t('browse.f.market', { market: COVERAGE.market }), () => setF({ canadaOnly: !f.canadaOnly }))}
        {sw(f.measuredOnly, t('browse.f.measured'), () => setF({ measuredOnly: !f.measuredOnly }), t('browse.f.measuredHelp'))}
      </div>
      {section('years', t('browse.f.years'), !same(f.years, d.years), years.filter((y) => f.years.includes(y)).map(String),
        checks(t('browse.f.years'), years.map(String), f.years.map(String), (v, on) => setF({ years: on ? [...f.years, Number(v)] : f.years.filter((x) => x !== Number(v)) }), (v) => v), { years: d.years })}
      {section('range', t('browse.f.minRange'), f.minRangeKm > 0, f.minRangeKm > 0 ? [rangeWords] : [],
        slider('bf-range', t('browse.f.minRange'), f.minRangeKm, RANGE_MAX, 50, (n) => setF({ minRangeKm: n }), rangeWords), { minRangeKm: 0 })}
      {section('dc', t('browse.f.minDc'), f.minDcKw > 0, f.minDcKw > 0 ? [dcWords] : [],
        slider('bf-dc', t('browse.f.minDc'), f.minDcKw, DC_MAX, 25, (n) => setF({ minDcKw: n }), dcWords), { minDcKw: 0 })}
      {section('time', t('browse.f.max1080'), f.max1080Min > 0, f.max1080Min > 0 ? [timeWords] : [],
        slider('bf-time', t('browse.f.max1080'), f.max1080Min === 0 ? TIME_MAX : f.max1080Min, TIME_MAX, 5, (n) => setF({ max1080Min: n >= TIME_MAX ? 0 : Math.max(5, n) }), timeWords), { max1080Min: 0 })}
      {listSection('make', t('browse.f.make'), optionsFor(index, (e) => e.make), f.makes, 'makes', (v) => v)}
      {listSection('body', t('browse.f.body'), optionsFor(index, (e) => e.body_type), f.bodies, 'bodies', bodyText)}
      {listSection('drivetrain', t('browse.f.drivetrain'), optionsFor(index, (e) => e.drivetrain === 'unknown' ? null : e.drivetrain), f.drivetrains, 'drivetrains')}
      {listSection('port', t('browse.f.port'), optionsFor(index, (e) => e.charge_port), f.ports, 'ports')}
      {listSection('voltage', t('browse.f.voltage'), optionsFor(index, (e) => e.voltage_class), f.voltages, 'voltages')}
      {section('heatPump', t('browse.f.heatPump'), f.heatPump !== 'any', f.heatPump !== 'any' ? [t(`browse.hp.${f.heatPump}`)] : [],
        checks(t('browse.f.heatPump'), ['any', 'standard', 'available'], [f.heatPump], (v) => setF({ heatPump: v as BrowseFilters['heatPump'] }), (v) => t(`browse.hp.${v}` as MessageKey), 'radio', 'bf-hp'), { heatPump: 'any' })}
      {listSection('chemistry', t('browse.f.chemistry'), optionsFor(index, (e) => e.chemistry), f.chemistries, 'chemistries')}
    </div>
  );

  const count = results.length === 1 ? t('browse.results1') : t('browse.results', { count: formatNumber(results.length) });
  const dirLabel = (dir: 'asc' | 'desc') => (state.sort === 'name' ? t(dir === 'asc' ? 'browse.dir.nameAsc' : 'browse.dir.nameDesc') : t(`browse.dir.${dir}`));

  const th = (key: SortKey | null, label: string) => {
    if (!key) return <th scope="col">{label}</th>;
    const on = state.sort === key;
    return (
      <th scope="col" aria-sort={on ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button type="button" className="th-sort" onClick={() => (on ? setState((s) => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' })) : setSort(key))} aria-label={t('browse.sortBy', { label })}>
          {label} <span aria-hidden="true">{on ? (state.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
        </button>
      </th>
    );
  };
  const figure = (label: string, value: ReactNode) => (
    <div className="readout"><dt className="readout-label">{label}</dt><dd className="readout-value">{value}</dd></div>
  );

  return (
    <div className="browse">
      <div className="browse-bar">
        <label className="browse-search">
          <span className="sr-only">{t('browse.search')}</span>
          <input type="search" value={query} placeholder={t('browse.searchPlaceholder')} onChange={(ev) => setQuery(ev.target.value)} />
        </label>
        <button type="button" ref={sheetBtn} className="btn bf-open" aria-expanded={sheetOpen} aria-controls="browse-filters" onClick={() => setSheetOpen(true)}>
          {active ? t('browse.filtersCount', { count: active }) : t('browse.filters')}
        </button>
        <label className="browse-sort">
          <span>{t('browse.sort')}</span>
          <select value={state.sort} onChange={(ev) => setSort(ev.target.value as SortKey)}>
            {SORTS.map((k) => <option key={k} value={k}>{t(`browse.sort.${k}` as MessageKey)}</option>)}
          </select>
        </label>
        <label className="browse-sort">
          <span className="sr-only">{t('browse.sortDir')}</span>
          <select value={state.dir} onChange={(ev) => setState((s) => ({ ...s, dir: ev.target.value as 'asc' | 'desc' }))}>
            <option value="asc">{dirLabel('asc')}</option>
            <option value="desc">{dirLabel('desc')}</option>
          </select>
        </label>
        <div className="seg" role="group" aria-label={t('browse.view')}>
          {(['cards', 'table'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={state.view === v} onClick={() => setState((s) => ({ ...s, view: v, ...(v === 'table' && s.view !== 'table' && s.sort === 'name' ? { sort: 'km10', dir: 'desc' } : {}) }))}>
              {t(`browse.${v}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="browse-main">
        <aside id="browse-filters" ref={sheetRef} className={`browse-filters card${sheetOpen ? ' open' : ''}`} aria-label={t('browse.filters')} role={sheetOpen ? 'dialog' : undefined} aria-modal={sheetOpen || undefined}>
          <div className="bf-head">
            <h2 className="bf-title">{t('browse.filters')}</h2>
            <button type="button" className="btn small" onClick={() => setState((s) => ({ ...s, filters: defaultFilters(index) }))} disabled={active === 0}>{t('browse.clear')}</button>
            <button type="button" className="icon-btn bf-close" aria-label={t('browse.close')} onClick={() => { setSheetOpen(false); sheetBtn.current?.focus(); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
          {panel}
        </aside>
        {sheetOpen && <div className="bf-backdrop" onClick={() => { setSheetOpen(false); sheetBtn.current?.focus(); }} aria-hidden="true" />}

        <section className="browse-results" aria-busy={!ready}>
          {/* Only the status line is live (the final count, once); the big number beside it ticks. */}
          <p className="browse-count">
            <span className="count-num" aria-hidden="true">
              <Ticker value={results.length} render={(n) => (n === 1 ? t('browse.results1') : t('browse.results', { count: formatNumber(n) }))} />
            </span>
            <span className="sr-only" role="status">{count}</span>
            <span className="small muted">{t('browse.estimatedHelp')}</span>
          </p>
          {notice && <p className="banner small" role="status">{notice}</p>}
          {results.length === 0 && <p className="muted">{t('browse.noResults')}</p>}

          {state.view === 'cards' && (
            <div className="cards-stage">
              <ul ref={cardsEl} className="car-cards">
                {results.map((e) => (
                  <li key={e.id} data-flip={e.id} className="car-card card">
                    <p className="small muted cc-body">{t(`body.${e.body_type}` as MessageKey)} · {e.year}</p>
                    <h3 className="cc-name"><a href={carHref(e.id)} aria-label={t('browse.open', { car: carName(e) })}><Mark text={`${e.make} ${e.model}`} terms={terms} /></a></h3>
                    <p className="cc-variant">{terms.length ? <Mark text={e.name} terms={terms} /> : <VariantName name={e.name} />}</p>
                    <dl className="readouts cc-figs">
                      {figure(t('tile.range'), show(rangeText(e)))}
                      {figure(t('tile.time1080'), show(timeText(e)))}
                      {figure(t('tile.kmPer10'), show(km10Text(e)))}
                      {figure(t('browse.col.port'), e.charge_port ? valueLabel(e.charge_port) : unknown)}
                    </dl>
                    <div className="cc-foot">{curveBadge(e)}{compareBtn(e)}</div>
                  </li>
                ))}
              </ul>
              <div ref={ghostEl} className="flip-ghosts" aria-hidden="true" />
            </div>
          )}

          {state.view === 'table' && results.length > 0 && (
            <div className="table-scroll" role="region" aria-label={t('browse.tableRegion')} tabIndex={0}>
            <table className="stack-table browse-table">
              <thead>
                <tr>
                  {th('name', t('browse.col.car'))}
                  {th('range', t('browse.sort.range'))}
                  {th('efficiency', t('browse.sort.efficiency'))}
                  {th('dc', t('browse.sort.dc'))}
                  {th('time1080', t('browse.sort.time1080'))}
                  {th('km10', t('browse.sort.km10'))}
                  {th(null, t('browse.col.port'))}
                  {th(null, t('browse.col.curve'))}
                  <th scope="col"><span className="sr-only">{t('browse.compare')}</span></th>
                </tr>
              </thead>
              <tbody ref={rowsEl}>
                {results.map((e) => (
                  <tr key={e.id} data-flip={e.id}>
                    <td data-label={t('browse.col.car')}><a href={carHref(e.id)}><Mark text={`${e.make} ${e.model}`} terms={terms} /> {terms.length ? <Mark text={e.name} terms={terms} /> : <VariantName name={e.name} />}</a> <span className="muted small">{e.year}</span></td>
                    <td data-label={t('browse.sort.range')}>{show(rangeText(e))}</td>
                    <td data-label={t('browse.sort.efficiency')}>{show(effText(e))}</td>
                    <td data-label={t('browse.sort.dc')}>{show(dcText(e))}</td>
                    <td data-label={t('browse.sort.time1080')}>{show(timeText(e))}</td>
                    <td data-label={t('browse.sort.km10')}>{show(km10Text(e))}</td>
                    <td data-label={t('browse.col.port')}>{e.charge_port ? valueLabel(e.charge_port) : unknown}</td>
                    <td data-label={t('browse.col.curve')}>{curveBadge(e)}</td>
                    <td>{compareBtn(e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
