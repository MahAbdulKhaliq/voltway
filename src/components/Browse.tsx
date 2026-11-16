// Cars tab (database-ui.md §4, B39): search, filters (side panel; bottom sheet on phones),
// cards or a sortable table. Each car opens in the Charging tab. Choices are remembered.

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
import { addToCompare, getCompare, type AddResult } from '../lib/my-car.ts';
import { getItem, getJSON, setJSON, KEYS } from '../lib/storage.ts';
import { formatNumber, kmTo, whPerKmToDisplay, type DistanceUnit } from '../lib/units.ts';
import type { IndexEntry } from '../lib/types.ts';

interface Props { index: IndexEntry[] }

const RANGE_MAX = 700;  // km
const DC_MAX = 350;     // kW
const TIME_MAX = 60;    // min; the slider's top means "off"

const carHref = (id: string) => `/charging?car=${id.split('/').map(encodeURIComponent).join('/')}`;
const carName = (e: IndexEntry) => `${e.year} ${e.make} ${e.model} ${e.name}`;

export default function Browse({ index }: Props) {
  const [state, setState] = useState<BrowseState>(() => readState(null, index));
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [compare, setCompareList] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetBtn = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const search = useMemo(() => makeCarSearch(index), [index]);

  // Remembered choices, units and the comparison list (browser only, after hydration).
  useEffect(() => {
    setState(readState(getJSON<unknown>(KEYS.browse, null), index));
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

  // Escape closes the phone sheet and returns focus to its button.
  useEffect(() => {
    if (!sheetOpen) return;
    // The phone sheet is modal: focus moves in, Tab stays inside, Escape closes.
    sheetRef.current?.querySelector<HTMLElement>('.bf-close')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSheetOpen(false); sheetBtn.current?.focus(); return; }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const els = [...sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]')];
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

  const active = activeCount(f, index);
  const onCompare = (e: IndexEntry) => {
    const r: AddResult = addToCompare(e.id);
    setNotice(r === 'full' ? t('browse.compareFull') : null);
  };

  // Figures as shown, with "~" for estimates.
  const rangeText = (e: IndexEntry) => (e.range_km === null ? null : t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(e.range_km, unit)) }));
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
    const v = formatNumber(kmTo(k, unit));
    const text = t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: v });
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
  const checks = (label: string, all: string[], chosen: string[], key: 'makes' | 'bodies' | 'drivetrains' | 'ports' | 'voltages' | 'chemistries', text: (v: string) => string = valueLabel) => (
    <fieldset className="bf-group">
      <legend>{label}</legend>
      {all.map((v) => (
        <label key={v} className="check">
          <input type="checkbox" checked={chosen.includes(v)} onChange={(ev) => setF({ [key]: ev.target.checked ? [...chosen, v] : chosen.filter((x) => x !== v) })} />
          {text(v)}
        </label>
      ))}
    </fieldset>
  );
  const slider = (id: string, label: string, value: number, max: number, step: number, onChange: (n: number) => void, words: string): ReactNode => (
    <div className="bf-group">
      <label htmlFor={id} className="bf-label">{label}: <strong>{words}</strong></label>
      <input id={id} type="range" min={0} max={max} step={step} value={value} aria-valuetext={words} onChange={(ev) => onChange(Number(ev.target.value))} />
    </div>
  );
  const years = [...new Set(index.map((e) => e.year))].sort((a, b) => b - a);
  const rangeWords = f.minRangeKm > 0 ? t('browse.atLeast', { value: t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(f.minRangeKm, unit)) }) }) : t('browse.off');
  const dcWords = f.minDcKw > 0 ? t('browse.atLeast', { value: t('fmt.kw', { value: f.minDcKw }) }) : t('browse.off');
  const timeWords = f.max1080Min > 0 ? t('browse.atMost', { value: t('fmt.min', { value: f.max1080Min }) }) : t('browse.off');

  const panel = (
    <div className="bf-body">
      <label className="check">
        <input type="checkbox" checked={f.canadaOnly} onChange={(ev) => setF({ canadaOnly: ev.target.checked })} />
        {t('browse.f.market', { market: COVERAGE.market })}
      </label>
      <fieldset className="bf-group">
        <legend>{t('browse.f.years')}</legend>
        {years.map((y) => (
          <label key={y} className="check">
            <input type="checkbox" checked={f.years.includes(y)} onChange={(ev) => setF({ years: ev.target.checked ? [...f.years, y] : f.years.filter((x) => x !== y) })} />
            {y}
          </label>
        ))}
      </fieldset>
      {slider('bf-range', t('browse.f.minRange'), f.minRangeKm, RANGE_MAX, 50, (n) => setF({ minRangeKm: n }), rangeWords)}
      {slider('bf-dc', t('browse.f.minDc'), f.minDcKw, DC_MAX, 25, (n) => setF({ minDcKw: n }), dcWords)}
      {slider('bf-time', t('browse.f.max1080'), f.max1080Min === 0 ? TIME_MAX : f.max1080Min, TIME_MAX, 5, (n) => setF({ max1080Min: n >= TIME_MAX ? 0 : Math.max(5, n) }), timeWords)}
      <label className="check">
        <input type="checkbox" checked={f.measuredOnly} onChange={(ev) => setF({ measuredOnly: ev.target.checked })} />
        <span>{t('browse.f.measured')}<span className="muted small bf-help">{t('browse.f.measuredHelp')}</span></span>
      </label>
      {checks(t('browse.f.make'), optionsFor(index, (e) => e.make), f.makes, 'makes', (v) => v)}
      {checks(t('browse.f.body'), optionsFor(index, (e) => e.body_type), f.bodies, 'bodies', (v) => t(`body.${v}` as MessageKey))}
      {checks(t('browse.f.drivetrain'), optionsFor(index, (e) => e.drivetrain === 'unknown' ? null : e.drivetrain), f.drivetrains, 'drivetrains')}
      {checks(t('browse.f.port'), optionsFor(index, (e) => e.charge_port), f.ports, 'ports')}
      {checks(t('browse.f.voltage'), optionsFor(index, (e) => e.voltage_class), f.voltages, 'voltages')}
      <fieldset className="bf-group">
        <legend>{t('browse.f.heatPump')}</legend>
        {(['any', 'standard', 'available'] as const).map((v) => (
          <label key={v} className="check">
            <input type="radio" name="bf-hp" checked={f.heatPump === v} onChange={() => setF({ heatPump: v })} />
            {t(`browse.hp.${v}`)}
          </label>
        ))}
      </fieldset>
      {checks(t('browse.f.chemistry'), optionsFor(index, (e) => e.chemistry), f.chemistries, 'chemistries')}
    </div>
  );

  const count = results.length === 1 ? t('browse.results1') : t('browse.results', { count: formatNumber(results.length) });
  const dirLabel = (d: 'asc' | 'desc') => (state.sort === 'name' ? t(d === 'asc' ? 'browse.dir.nameAsc' : 'browse.dir.nameDesc') : t(`browse.dir.${d}`));

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
        {sheetOpen && <div className="bf-backdrop" onClick={() => setSheetOpen(false)} aria-hidden="true" />}

        <section className="browse-results" aria-busy={!ready}>
          {/* Only the count is live, so a filter change reads one line, not every card. */}
          <p className="small muted browse-count" role="status"><strong>{count}</strong> · {t('browse.estimatedHelp')}</p>
          {notice && <p className="banner small" role="status">{notice}</p>}
          {results.length === 0 && <p className="muted">{t('browse.noResults')}</p>}

          {state.view === 'cards' && results.length > 0 && (
            <ul className="car-cards">
              {results.map((e) => (
                <li key={e.id} className="car-card card">
                  <p className="small muted cc-body">{t(`body.${e.body_type}` as MessageKey)} · {e.year}</p>
                  <h3 className="cc-name"><a href={carHref(e.id)} aria-label={t('browse.open', { car: carName(e) })}>{e.make} {e.model}</a></h3>
                  <p className="cc-variant">{e.name}</p>
                  <dl className="cc-figs">
                    <div><dt>{t('tile.range')}</dt><dd>{show(rangeText(e))}</dd></div>
                    <div><dt>{t('tile.time1080')}</dt><dd>{show(timeText(e))}</dd></div>
                    <div><dt>{t('tile.kmPer10')}</dt><dd>{show(km10Text(e))}</dd></div>
                    <div><dt>{t('browse.col.port')}</dt><dd>{e.charge_port ? valueLabel(e.charge_port) : unknown}</dd></div>
                  </dl>
                  <div className="cc-foot">{curveBadge(e)}{compareBtn(e)}</div>
                </li>
              ))}
            </ul>
          )}

          {state.view === 'table' && results.length > 0 && (
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
              <tbody>
                {results.map((e) => (
                  <tr key={e.id}>
                    <td data-label={t('browse.col.car')}><a href={carHref(e.id)}>{e.make} {e.model} {e.name}</a> <span className="muted small">{e.year}</span></td>
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
          )}
        </section>
      </div>
    </div>
  );
}
