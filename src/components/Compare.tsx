// The Compare screen (database-ui.md §6, charging-curve-viewer.md §6, DESIGN-1b 6.1): up to four
// cars, each with one colour across its card, curve line and race lane. One SoC window and charger
// power for every car; the spec table with the best value per row (icon + bold) and an "Only show
// differences" switch. The list comes from ?cars= (shareable), else from the saved Compare list;
// changes are saved and the URL follows.
//
// B85 (owner, 2026-11-18): the content-page design language (design-language.md) and a "Charge
// race": one road lane per car, a bar sized to the chosen figure, best first. Bars grow and the lanes
// slide to their new order (FLIP, Web Animations) when the window, charger or figure changes; with
// Animations off (html[data-motion="off"]) every change is instant.

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { t, type MessageKey } from '../i18n/t.ts';
import { calculateCharge, displayMinutes, powerAt, type ChargeResult } from '../lib/charging.ts';
import { BETTER, bestIndices, compareHref, firstDir, rankValue, readCarsParam, replaceAt, rowDiffers, sortBy } from '../lib/compare.ts';
import { reducedMotion } from '../lib/motion.ts';
import { getCompare, setCompare } from '../lib/my-car.ts';
import { GROUPS } from '../lib/spec-groups.ts';
import { getItem, getJSON, KEYS, setJSON } from '../lib/storage.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import { chargeCost, chargePrice, costPer100, costPer10Min, money, PRICE_EVENT, setChargePrice } from '../lib/price.ts';
import { setUnit as switchUnit } from '../scripts/units-client.ts';
import { COST } from '../config.ts';
import type { CarDetail, CurveOut, Field, IndexEntry } from '../lib/types.ts';
import VariantName from './VariantName.tsx';
import CarPicker from './CarPicker.tsx';
import { Value } from './react/Badge.tsx';
import { Accordion } from './react/Accordion.tsx';

echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

interface Props { index: IndexEntry[] }

/** Saved charger setting, shared with the curve viewer (KEYS.curveSettings). */
type Preset = 'none' | '50' | '100' | '150' | '250' | '350' | 'custom';
const PRESETS: Preset[] = ['none', '50', '100', '150', '250', '350', 'custom'];
type Col = 'per10' | 'minutes' | 'km' | 'avgKw';
/** Range basis (B119), as on the Charging page: combined by default (B117). */
type Basis = 'highway' | 'combined' | 'city';
const BASES: Basis[] = ['highway', 'combined', 'city'];
const COLS: Col[] = ['per10', 'minutes', 'km', 'avgKw'];
/** Charger power in 50 kW steps, then Max (design-language.md §4), as on the Charging page. */
const CHARGER_STOPS = [50, 100, 150, 200, 250, 300, 350, Number.POSITIVE_INFINITY];
const stopPct = (i: number) => `${(i / (CHARGER_STOPS.length - 1)) * 100}%`;
/** Lane-line dashes for the curve outside the charging window (design-language.md §6). */
const ROAD_DASH = [16, 12];
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // --ease-out
const SLIDE_MS = 460;
/** Car colours (CSS tokens --car-1 … --car-4, contrast-checked in tests/contrast.test.ts). */
const carVar = (i: number) => `var(--car-${i + 1})`;
const cssVar = (name: string, fallback: string) =>
  typeof window === 'undefined' ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

interface Row {
  id: string;
  slot: number;
  car: CarDetail;
  curve: CurveOut | null;
  result: ChargeResult | null;
  estimated: boolean;
  /** The consumption used for distances and the cost per 100 km (B119); null when unknown. */
  whPerKm: number | null;
}

/** A drawn finish flag for the leading lane (no glyphs for icons). */
function Flag() {
  return (
    <svg className="race-flag" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 1.5v13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3.8 2.2h9.4l-2.1 3.3 2.1 3.3H3.8Z" fill="currentColor" />
    </svg>
  );
}
/** The best-value mark in the spec table. */
function Star() {
  return (
    <svg className="best-star" width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <path d="m8 1.2 2 4.4 4.8.5-3.6 3.2 1 4.7L8 11.6 3.8 14l1-4.7L1.2 6.1 6 5.6Z" fill="currentColor" />
    </svg>
  );
}

export default function Compare({ index }: Props) {
  const byId = useMemo(() => new Map(index.map((e) => [e.id, e])), [index]);
  const [ids, setIds] = useState<string[] | null>(null);
  const [notice, setNotice] = useState<{ unknown: string[]; dropped: number } | null>(null);
  const [cars, setCars] = useState<Record<string, CarDetail | 'error'>>({});
  const [start, setStart] = useState(10);
  const [end, setEnd] = useState(80);
  const [preset, setPreset] = useState<Preset>('none');
  const [customKw, setCustomKw] = useState(120);
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [basis, setBasis] = useState<Basis>('combined');
  const [price, setPrice] = useState(0);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [figure, setFigure] = useState<Col>('per10');
  const [themeTick, setThemeTick] = useState(0);
  // The race bars grow in once, on the first view with figures.
  const [grown, setGrown] = useState(false);
  // Opened from a shared link whose list differs from the visitor's saved one: say so until they edit it.
  const [shared, setShared] = useState(false);
  const uid = useId();
  const chartEl = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  const raceEl = useRef<HTMLOListElement>(null);
  const lanePos = useRef(new Map<string, number>());
  // "Add a car" (B87): the header's car picker in a modal dialog, opened from the ghost card.
  const addDialog = useRef<HTMLDialogElement>(null);
  const addOpener = useRef<HTMLElement | null>(null);
  const [adding, setAdding] = useState(false);
  const openAdd = (from: HTMLElement) => {
    addOpener.current = from;
    setAdding(true);
    addDialog.current?.showModal();
    requestAnimationFrame(() => addDialog.current && (addDialog.current.scrollTop = 0)); // start at the title
  };
  const closeAdd = () => addDialog.current?.close();
  useEffect(() => {
    if (adding) addDialog.current?.querySelector<HTMLInputElement>('input[type=search]')?.focus();
  }, [adding]);

  // The list: the link first, else the saved list. Shared settings start from the curve viewer's.
  useEffect(() => {
    const link = readCarsParam(location.search, (id) => byId.has(id));
    if (link) {
      setIds(link.ids);
      const own = getCompare();
      if (link.ids.length && (own.length !== link.ids.length || own.some((id, i) => id !== link.ids[i]))) setShared(true);
      if (link.unknown.length || link.dropped) setNotice({ unknown: link.unknown, dropped: link.dropped });
    } else setIds(getCompare().filter((id) => byId.has(id)));
    const saved = getJSON<Partial<{ start: number; end: number; preset: Preset; customKw: number }>>(KEYS.curveSettings, {});
    if (typeof saved.start === 'number' && typeof saved.end === 'number' && saved.start <= saved.end) {
      setStart(saved.start);
      setEnd(saved.end);
    }
    if (saved.preset && PRESETS.includes(saved.preset)) setPreset(saved.preset);
    if (typeof saved.customKw === 'number' && saved.customKw > 0) setCustomKw(saved.customKw);
    setUnit(getItem(KEYS.units) === 'mi' ? 'mi' : 'km');
    // The price is the site-wide setting (B66), shared with Settings, the Charging page and trips.
    setPrice(chargePrice());
    const onPrice = (e: Event) => setPrice((e as CustomEvent<number>).detail);
    window.addEventListener(PRICE_EVENT, onPrice);
    const onUnits = (e: Event) => setUnit((e as CustomEvent<DistanceUnit>).detail);
    const onTheme = () => setThemeTick((n) => n + 1);
    const media = matchMedia('(prefers-color-scheme: dark)');
    window.addEventListener('voltway:units', onUnits);
    window.addEventListener('voltway:theme', onTheme);
    media.addEventListener('change', onTheme);
    return () => {
      window.removeEventListener('voltway:units', onUnits);
      window.removeEventListener('voltway:theme', onTheme);
      window.removeEventListener(PRICE_EVENT, onPrice);
      media.removeEventListener('change', onTheme);
    };
  }, [byId]);

  // The window and charger are the curve viewer's settings too (one set, database-ui.md §6).
  const save = (patch: Partial<{ start: number; end: number; preset: Preset; customKw: number }>) =>
    setJSON(KEYS.curveSettings, { ...getJSON<Record<string, unknown>>(KEYS.curveSettings, {}), start, end, preset, customKw, ...patch });
  const setWindow = (s: number, e: number) => { setStart(s); setEnd(e); save({ start: s, end: e }); };

  // The URL follows the list, so the link reproduces the view.
  useEffect(() => {
    if (ids) history.replaceState(null, '', compareHref(ids));
  }, [ids]);
  const change = (next: string[]) => {
    setIds(next);
    setCompare(next);
    setShared(false);
  };

  // Car files, each fetched once.
  useEffect(() => {
    for (const id of ids ?? []) {
      if (cars[id]) continue;
      fetch(`/data/cars/${id}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<CarDetail>) : Promise.reject(r.status)))
        .then((c) => setCars((s) => ({ ...s, [id]: c })), () => setCars((s) => ({ ...s, [id]: 'error' })));
    }
  }, [ids, cars]);

  const chargerKw = preset === 'none' ? null : preset === 'custom' ? Math.max(1, customKw || 1) : Number(preset);
  const chargerIndex = chargerKw == null
    ? CHARGER_STOPS.length - 1
    : CHARGER_STOPS.reduce((best, kw, i) => (Number.isFinite(kw) && Math.abs(kw - chargerKw) < Math.abs(CHARGER_STOPS[best] - chargerKw) ? i : best), 0);
  const chargerLabel = chargerKw == null ? t('viewer.noLimit') : t('fmt.kw', { value: formatNumber(chargerKw, Number.isInteger(chargerKw) ? 0 : 1) });

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    (ids ?? []).forEach((id, slot) => {
      const car = cars[id];
      if (!car || car === 'error') return;
      const curve = car.curves.find((c) => c.is_display_default) ?? car.curves[0] ?? null;
      const usable = car.fields.capacity_usable_kwh?.value.value;
      const gross = car.fields.capacity_gross_kwh?.value.value;
      const kwh = typeof usable === 'number' ? usable : typeof gross === 'number' ? gross : null;
      // The picked basis, else combined, else highway (B117's fallback, as on the Charging page).
      const whOf = (b: Basis) => {
        const v = car.fields[`consumption_${b}_wh_per_km`]?.value.value;
        return typeof v === 'number' && v > 0 ? v : null;
      };
      const whPerKm = whOf(basis) ?? whOf('combined') ?? whOf('highway');
      let result: ChargeResult | null = null;
      if (curve && kwh) {
        try {
          result = calculateCharge({ points: curve.points, usableKwh: kwh, startSoc: start, endSoc: end, chargerKw, whPerKm: whPerKm ?? undefined });
        } catch {
          result = null;
        }
      }
      const estimated = curve?.kind === 'estimated' || typeof usable !== 'number' || Boolean(result?.extrapolated);
      out.push({ id, slot, car, curve, result, estimated, whPerKm });
    });
    return out;
  }, [ids, cars, start, end, chargerKw, basis]);

  const name = (id: string) => {
    const e = byId.get(id);
    return e ? `${e.make} ${e.model} ${e.year}` : id;
  };
  const siblings = (id: string) => {
    const e = byId.get(id);
    return e ? index.filter((x) => x.make === e.make && x.model === e.model && x.year === e.year) : [];
  };

  // Curve overlay: each car in its colour, solid inside the window, lane dashes outside it.
  useEffect(() => {
    if (!chartEl.current || !rows.length) return;
    if (!chart.current) chart.current = echarts.init(chartEl.current, undefined, { renderer: 'canvas' });
    const muted = cssVar('--muted', '#55544E');
    const text = cssVar('--text', '#1A1B1E');
    const border = cssVar('--border', '#D5D3CB');
    const warn = cssVar('--warn', '#9A3F00');
    const axis = { axisLine: { lineStyle: { color: border } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: border } }, nameTextStyle: { color: muted } };
    const drawn = rows.filter((r) => r.curve);
    const cap = chargerKw ?? Number.POSITIVE_INFINITY;
    const kwAt = (r: Row, soc: number) => Math.min(powerAt(r.curve!.points, soc), cap);
    const span = (r: Row, a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => [a + i, kwAt(r, a + i)]);
    const series = drawn.flatMap((r, n) => {
      const color = cssVar(`--car-${r.slot + 1}`, '#1D4ED8');
      const base = { type: 'line' as const, showSymbol: false, silent: true, itemStyle: { color }, z: 3 };
      const out: Record<string, unknown>[] = [
        { ...base, name: r.id, data: span(r, start, end), lineStyle: { color, width: 3, type: 'solid' } },
      ];
      if (start > 0) out.push({ ...base, data: span(r, 0, start), lineStyle: { color, width: 2, type: ROAD_DASH, cap: 'butt', opacity: 0.8 } });
      if (end < 100) out.push({ ...base, data: span(r, end, 100), lineStyle: { color, width: 2, type: ROAD_DASH, cap: 'butt', opacity: 0.8 } });
      if (n === 0) {
        out[0].markLine = {
          silent: true,
          symbol: 'none',
          data: [
            { xAxis: start, lineStyle: { color: text, type: 'solid', width: 2 }, label: { show: false } },
            { xAxis: end, lineStyle: { color: text, type: 'solid', width: 2 }, label: { show: false } },
            ...(chargerKw
              ? [{ yAxis: chargerKw, lineStyle: { color: warn, type: 'dashed' }, label: { position: 'insideEndTop', formatter: t('viewer.chargerLimitValue', { kw: formatNumber(chargerKw) }), color: warn } }]
              : []),
          ],
        };
      }
      return out;
    });
    chart.current.setOption(
      {
        animation: false,
        grid: { left: 48, right: 16, top: 24, bottom: 44 },
        tooltip: {
          trigger: 'axis',
          // One line per car at the hovered charge level, whatever piece of its line is under the cursor.
          formatter: (p: unknown) => {
            const list = Array.isArray(p) ? (p as { axisValue: number }[]) : [p as { axisValue: number }];
            const soc = Math.round(Number(list[0]?.axisValue ?? 0));
            const lines = drawn.map((r) =>
              `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:${cssVar(`--car-${r.slot + 1}`, '#1D4ED8')}"></span>${name(r.id)} ${r.car.name}: <b>${t('fmt.kw', { value: formatNumber(kwAt(r, soc)) })}</b>`);
            return [`${soc}%`, ...lines].join('<br>');
          },
        },
        xAxis: { type: 'value', min: 0, max: 100, name: t('viewer.socLabel'), nameLocation: 'middle', nameGap: 28, ...axis },
        yAxis: { type: 'value', min: 0, name: t('viewer.powerLabel'), ...axis },
        series,
      },
      true,
    );
    const onResize = () => chart.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [rows, start, end, chargerKw, themeTick]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { chart.current?.dispose(); chart.current = null; }, []);
  useEffect(() => {
    if (!rows.length && chart.current) { chart.current.dispose(); chart.current = null; }
  }, [rows.length]);

  // The race: figures per car, best first (lower is better for time; unknown last).
  const colValue = (r: Row, c: Col): number | null =>
    !r.result ? null : c === 'minutes' ? displayMinutes(r.result.minutes, r.estimated) : c === 'km' ? r.result.kmAdded : c === 'per10' ? r.result.kmPer10Min : r.result.averageKw;
  const race = sortBy(rows, (r) => colValue(r, figure), firstDir(figure));
  const raceValues = race.map((r) => colValue(r, figure));
  const raceMax = Math.max(0, ...raceValues.map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)));
  const leaders = bestIndices(raceValues, figure === 'minutes' ? 'lower' : 'higher');
  const order = race.map((r) => r.id).join('|');

  // The bars grow in once there are figures to show.
  const hasFigures = raceMax > 0;
  useEffect(() => {
    if (!hasFigures || grown) return;
    if (reducedMotion()) { setGrown(true); return; }
    const f = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
    return () => cancelAnimationFrame(f);
  }, [hasFigures, grown]);

  // FLIP: lanes that changed place slide from where they were to where they are now.
  useLayoutEffect(() => {
    const list = raceEl.current;
    if (!list) return;
    const now = new Map<string, number>();
    const lanes = [...list.querySelectorAll<HTMLElement>(':scope > li[data-id]')];
    for (const li of lanes) now.set(li.dataset.id!, li.offsetTop);
    if (!reducedMotion()) {
      for (const li of lanes) {
        const before = lanePos.current.get(li.dataset.id!);
        const after = now.get(li.dataset.id!)!;
        if (before === undefined || before === after || typeof li.animate !== 'function') continue;
        li.getAnimations().forEach((a) => a.cancel());
        li.animate([{ transform: `translateY(${before - after}px)` }, { transform: 'none' }], { duration: SLIDE_MS, easing: EASE });
      }
    }
    lanePos.current = now;
  }, [order]);

  if (ids === null) return <p className="muted">{t('compare.loading')}</p>;

  const approx = (r: Row) => (r.estimated ? '~' : '');
  const distance = (km: number, a: string) => `${a}${t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(km, unit)) })}`;
  const figureText = (r: Row, c: Col): string | null => {
    const v = colValue(r, c);
    if (v == null) return null;
    if (c === 'minutes') return t(r.estimated ? 'fmt.approxMin' : 'fmt.min', { value: displayMinutes(v, r.estimated) });
    if (c === 'avgKw') return t('fmt.kw', { value: formatNumber(v) });
    return distance(v, approx(r));
  };
  // Cost estimates beside the figures (B119): the whole charge, 10 minutes of it, and 100 km of driving.
  const costText = (r: Row, c: Col): string | null => {
    const res = r.result;
    if (!res || c === 'avgKw') return null;
    if (c === 'minutes') return t('compare.cost', { cost: money.format(chargeCost(res.energyKwh, price)) });
    if (c === 'per10') {
      const v = costPer10Min(res.energyKwh, res.minutes, price);
      return v == null ? null : t('compare.cost', { cost: money.format(v) });
    }
    return r.whPerKm == null ? null : t(unit === 'km' ? 'compare.cost.per100km' : 'compare.cost.per100mi', { cost: money.format(costPer100(r.whPerKm, price, unit)) });
  };
  const withCost = (r: Row, c: Col) => {
    const f = figureText(r, c) ?? t('badge.unknown');
    const cost = costText(r, c);
    return cost ? t('compare.withCost', { figure: f, cost }) : f;
  };
  const colLabel: Record<Col, MessageKey> = { minutes: 'compare.col.minutes', km: 'compare.col.km', per10: 'compare.col.per10', avgKw: 'compare.col.avgKw' };
  const figureName = (c: Col) => t(colLabel[c], { start, end });
  const mixed = rows.some((r) => r.estimated) && rows.some((r) => !r.estimated && r.curve);
  const startOnTop = start >= end - 1 && start > 50;

  // Spec rows: each car's figure (variant level; heat pump from its first trim).
  const fieldOf = (r: Row, k: string): Field =>
    k === 'heat_pump' ? r.car.trims[0]?.heat_pump ?? null : k === 'ac_max_kw' ? r.car.fields.ac_max_kw ?? r.car.trims[0]?.ac_max_kw ?? null : r.car.fields[k] ?? null;
  const groups = GROUPS.map((g) => ({ ...g, fields: g.title === 'group.ports' ? [...g.fields, 'heat_pump'] : g.fields }));
  // Ready once every car has loaded or failed; a failed car keeps its column, shown as unknown.
  const ready = ids.every((id) => cars[id]);
  const slotRows = ids.map((id) => rows.find((r) => r.id === id) ?? null);
  const failed = ids.filter((id) => cars[id] === 'error');
  // B119: one source list for the page, in car order with repeats removed, so a "[n]" means the same
  // source under every car and opens the Sources section below (openSource, as on the Charging page).
  const sources = slotRows.flatMap((r) => r?.car.sources ?? []).filter((s, i, all) => all.findIndex((x) => x.id === s.id) === i);

  // The empty card after the cars (B87): the next car's colour, dashed, opens "Add a car".
  const ghost = (slot: number) => (
    <li className="cmp-ghost" style={{ ['--lane' as string]: carVar(slot) }}>
      <button type="button" aria-haspopup="dialog" onClick={(e) => openAdd(e.currentTarget)}>
        <span className="cmp-ghost-plus" aria-hidden="true">+</span>
        <span className="cmp-ghost-text">{t('compare.addCar')}</span>
        <span className="cmp-ghost-count small muted">{t('compare.slots', { count: slot + 1, max: 4 })}</span>
      </button>
    </li>
  );

  return (
    <>
    <div className="compare">
      {notice && (
        <p className="banner small" role="status">
          {notice.unknown.length > 0 && t('compare.unknownIds', { ids: notice.unknown.join(', ') })}
          {notice.unknown.length > 0 && notice.dropped > 0 && ' '}
          {notice.dropped > 0 && t('compare.dropped', { count: notice.dropped })}
        </p>
      )}
      {shared && <p className="banner small" role="note">{t('compare.sharedView')}</p>}
      {failed.length > 0 && <p className="banner small" role="alert">{t('compare.loadError')}</p>}

      {ids.length === 0 ? (
        <div className="cmp-empty">
          <p>{t('compare.empty')}</p>
          <ul className="cmp-cars" aria-label={t('compare.cars')}>{ghost(0)}</ul>
          <p className="small"><a href="/cars">{t('compare.browseAll')}</a></p>
        </div>
      ) : (
        <>
          <ul className="cmp-cars" aria-label={t('compare.cars')}>
            {ids.map((id, slot) => {
              const sibs = siblings(id);
              const label = name(id);
              return (
                <li key={id} className="card cmp-car" style={{ ['--lane' as string]: carVar(slot) }}>
                  <span className="car-name">{label}</span>
                  {sibs.length > 1 ? (
                    <select aria-label={t('compare.variantFor', { car: label })} value={id} onChange={(e) => change(replaceAt(ids, slot, e.target.value))}>
                      {sibs.map((s) => (
                        <option key={s.id} value={s.id} disabled={s.id !== id && ids.includes(s.id)}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="variant"><VariantName name={byId.get(id)?.name ?? ''} /></span>
                  )}
                  {cars[id] === 'error' && <span className="small unknown">{t('compare.notLoaded')}</span>}
                  <span className="car-actions">
                    <a className="small" href={`/charging?car=${id}`}>{t('compare.open')}</a>
                    <button type="button" className="btn small" onClick={() => { change(ids.filter((x) => x !== id)); requestAnimationFrame(() => document.querySelector<HTMLElement>('.cmp-ghost button')?.focus()); }} aria-label={t('compare.removeFor', { car: `${label} ${byId.get(id)?.name ?? ''}` })}>
                      {t('compare.remove')}
                    </button>
                  </span>
                </li>
              );
            })}
            {ids.length < 4 && ghost(ids.length)}
          </ul>

          <section aria-labelledby={`${uid}-race`} className="card cmp-race">
            <div className="race-head">
              <h2 id={`${uid}-race`}>{t('compare.race')}</h2>
              <div className="seg-field">
                <span id={`${uid}-by`} className="seg-label">{t('compare.raceBy')}</span>
                <div className="seg" role="group" aria-labelledby={`${uid}-by`}>
                  {COLS.map((c) => (
                    <button key={c} type="button" aria-pressed={figure === c} onClick={() => setFigure(c)}>{figureName(c)}</button>
                  ))}
                </div>
              </div>
            </div>
            <p className="small muted race-note">{t(figure === 'minutes' ? 'compare.race.lower' : 'compare.race.higher')} {t('compare.shared')} {t('compare.costNote', { loss: Math.round((1 - COST.dcEfficiency) * 100) })}</p>
            {mixed && <p className="banner small estimated" role="note">{t('compare.mixed')}</p>}

            <ol ref={raceEl} className={`race${grown ? ' grown' : ''}`} aria-label={t('compare.raceLabel', { figure: figureName(figure) })}>
              {race.map((r, i) => {
                const v = raceValues[i];
                const lead = leaders.includes(i);
                const pct = typeof v === 'number' && raceMax > 0 ? Math.max(2, (v / raceMax) * 100) : 0;
                const main = figureText(r, figure);
                const mainCost = main ? costText(r, figure) : null;
                return (
                  <li key={r.id} data-id={r.id} className={`lane${lead ? ' lead' : ''}`} style={{ ['--lane' as string]: carVar(r.slot) }}>
                    <span className="lane-car">
                      <span className="lane-dot" aria-hidden="true" />
                      <span className="lane-name">{name(r.id)} <span className="muted"><VariantName name={r.car.name} /></span></span>
                    </span>
                    <span className="lane-road" aria-hidden="true">
                      {main && <span className="lane-fill" style={{ width: grown ? `${pct}%` : '0%' }} />}
                    </span>
                    <span className="lane-value">
                      {lead && <><Flag /><span className="sr-only">{t('compare.best')} </span></>}
                      {main ?? <span className="unknown">{r.curve ? t('badge.unknown') : t('compare.noCurve')}</span>}
                      {mainCost && <span className="lane-cost">{mainCost}</span>}
                    </span>
                    <dl className="lane-meta small">
                      {COLS.filter((c) => c !== figure).map((c) => (
                        <div key={c}><dt>{figureName(c)}</dt><dd>{withCost(r, c)}</dd></div>
                      ))}
                      {r.curve && (
                        <div>
                          <dt className="sr-only">{t('viewer.curve')}</dt>
                          <dd><span className={`kind-tag ${r.curve.kind === 'estimated' ? 'estimated' : 'measured'}`}>
                            {r.curve.based_on ? t('viewer.option.borrowed') : t(`viewer.option.${r.curve.kind}` as MessageKey)}
                          </span></dd>
                        </div>
                      )}
                    </dl>
                  </li>
                );
              })}
            </ol>

            <div className="plot panel">
              <div ref={chartEl} className="chart" role="img" aria-label={(() => { const n = rows.filter((r) => r.curve).length; return n === 1 ? t('compare.chartAlt.one') : t('compare.chartAlt', { count: n }); })()} />
              <div className="window">
                <div className="window-labels" aria-hidden="true">
                  <span>{t('viewer.start')}: {start}%</span>
                  <span>{t('viewer.end')}: {end}%</span>
                </div>
                <div className="power-track">
                  <div className="power-rail" aria-hidden="true" />
                  <div className="power-fill" aria-hidden="true" style={{ left: `${start}%`, width: `${end - start}%` }} />
                  <input
                    type="range" min={0} max={100} step={1} value={start} aria-label={t('viewer.start')} aria-valuetext={`${start}%`}
                    style={{ zIndex: startOnTop ? 3 : 2 }}
                    onChange={(e) => setWindow(Math.min(Number(e.target.value), end), end)}
                  />
                  <input
                    type="range" min={0} max={100} step={1} value={end} aria-label={t('viewer.end')} aria-valuetext={`${end}%`}
                    onChange={(e) => setWindow(start, Math.max(Number(e.target.value), start))}
                  />
                </div>
              </div>
            </div>

            <div className="cmp-controls">
            <div className="charger-pick">
              <label htmlFor={`${uid}-charger`} className="charger-words">
                {t('viewer.charger')}: <strong>{chargerLabel}</strong>
              </label>
              <div className="power-track">
                <div className="power-rail" aria-hidden="true" />
                <div className="power-fill" aria-hidden="true" style={{ left: 0, width: stopPct(chargerIndex) }} />
                <input
                  id={`${uid}-charger`} type="range" min={0} max={CHARGER_STOPS.length - 1} step={1}
                  value={chargerIndex} aria-valuetext={chargerLabel}
                  onChange={(e) => {
                    const kw = CHARGER_STOPS[Number(e.target.value)];
                    if (Number.isFinite(kw)) { setPreset('custom'); setCustomKw(kw); save({ preset: 'custom', customKw: kw }); }
                    else { setPreset('none'); save({ preset: 'none' }); }
                  }}
                />
              </div>
              <ol className="power-ticks" aria-hidden="true">
                {CHARGER_STOPS.map((kw, i) => (
                  <li key={i} style={{ left: stopPct(i) }}>{Number.isFinite(kw) ? formatNumber(kw) : t('map.power.maxStop')}</li>
                ))}
              </ol>
            </div>
            {/* B119: the Charging page's Range basis, Distance and Price per kWh, for every car at once. */}
            <label className="cmp-field">
              <span>{t('viewer.rangeBasis')}</span>
              <select value={basis} onChange={(e) => setBasis(e.target.value as Basis)}>
                {BASES.map((b) => <option key={b} value={b}>{t(`viewer.basis.${b}` as MessageKey)}</option>)}
              </select>
            </label>
            <div className="cmp-field">
              <span id={`${uid}-units`}>{t('viewer.units')}</span>
              <div className="seg" role="group" aria-labelledby={`${uid}-units`}>
                {(['km', 'mi'] as const).map((u) => (
                  <button key={u} type="button" aria-pressed={unit === u} onClick={() => switchUnit(u)}>{t(`units.${u}` as MessageKey)}</button>
                ))}
              </div>
            </div>
            <label className="cmp-field" title={t('viewer.priceHelp')}>
              <span>{t('viewer.price')}</span>
              <input
                type="number" inputMode="decimal" min={0} max={5} step={0.01} value={price}
                aria-describedby={`${uid}-price-help`}
                onChange={(e) => { const p = Math.max(0, Number(e.target.value) || 0); setPrice(p); setChargePrice(p); }}
              />
            </label>
            <p id={`${uid}-price-help`} className="small muted cmp-price-help">{t('viewer.priceHelp')}</p>
            </div>
          </section>

          <Accordion headingId="cmp-specs" title={t('compare.specs')} open className="cmp-specs">
            <div className="specs-tools">
              <p className="small muted">{t('compare.bestHelp')}</p>
              <button type="button" role="switch" aria-checked={onlyDiff} className="diff-switch" onClick={() => setOnlyDiff((v) => !v)}>
                <span>{t('compare.onlyDiff')}</span>
                <span className="switch" aria-hidden="true" />
              </button>
            </div>
            <div className="table-scroll snap" tabIndex={0} aria-label={t('compare.scrollLabel')}>
              {/* B141: phones restyle the table with display grid/flex, which drops table semantics in some
                  browsers, so the roles are explicit and each value names its car for screen readers. */}
              <table role="table" className="cmp-table" style={{ ['--cols' as string]: ids.length }}>
                <thead role="rowgroup">
                  <tr role="row">
                    <td role="cell" className="corner" />
                    {ids.map((id, slot) => (
                      <th key={id} role="columnheader" scope="col" className="car-head" style={{ ['--lane' as string]: carVar(slot) }}>
                        <span className="car-name">{name(id)}</span>
                        <span className="variant"><VariantName name={byId.get(id)?.name ?? ''} /></span>
                      </th>
                    ))}
                  </tr>
                </thead>
                {ready &&
                  groups.map((g) => {
                    const fieldRows = g.fields
                      .map((k) => {
                        const fields = slotRows.map((r) => (r ? fieldOf(r, k) : null));
                        const values = fields.map((f) => f?.value.value ?? null);
                        return { k, fields, values };
                      })
                      .filter((x) => !onlyDiff || rowDiffers(x.values));
                    if (!fieldRows.length) return null;
                    return (
                      <tbody key={g.title} role="rowgroup">
                        <tr role="row" className="group-row"><th role="rowheader" scope="colgroup" colSpan={ids.length + 1}>{t(g.title)}</th></tr>
                        {fieldRows.map(({ k, fields, values }) => {
                          const label = t(`field.${k}` as MessageKey);
                          const best = bestIndices(values.map((v) => rankValue(k, v)), BETTER[k]);
                          return (
                            <tr key={k} role="row">
                              <th role="rowheader" scope="row">{label}</th>
                              {slotRows.map((r, i) => (
                                <td key={ids[i]} role="cell" className={best.includes(i) ? 'best' : undefined} style={{ ['--lane' as string]: carVar(i) }}>
                                  <span className="sr-only cmp-cell-car">{name(ids[i])}: </span>
                                  {best.includes(i) && (
                                    <span className="best-mark"><Star /><span className="sr-only">{t('compare.best')} </span></span>
                                  )}
                                  {r ? <Value field={fields[i]} sources={sources} label={label} unit={unit} /> : <span className="unknown">{t('badge.unknown')}</span>}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    );
                  })}
              </table>
            </div>
            {onlyDiff && ready && groups.every((g) => g.fields.every((k) => !rowDiffers(slotRows.map((r) => (r ? fieldOf(r, k)?.value.value ?? null : null))))) && (
              <p className="muted">{t('compare.noDiff')}</p>
            )}
            {ids.length < 4 && <p className="small add-more"><button type="button" className="link-btn" aria-haspopup="dialog" onClick={(e) => openAdd(e.currentTarget)}>{t('compare.addMore')}</button></p>}
          </Accordion>

          {ready && sources.length > 0 && (
            <Accordion id="sources-acc" headingId="cmp-sources" title={t('car.sources')} preview={t(sources.length === 1 ? 'car.sourceCount.one' : 'car.sourceCount.other', { count: sources.length })}>
              <p className="muted small">{t('car.sourcesIntro')}</p>
              <ol className="sources panel">
                {sources.map((s, i) => (
                  <li key={s.id} id={`source-${i + 1}`}>
                    <a href={s.url} rel="noopener" target="_blank">{s.title}</a>
                    <span className="source-meta muted small">{t('badge.accessed', { date: s.accessed_on })}{s.license && <> · {t('car.licence', { licence: s.license })}</>}</span>
                  </li>
                ))}
              </ol>
            </Accordion>
          )}
        </>
      )}


      <style>{`
        .compare { display: grid; gap: 20px; }
        .compare > *, .cmp-race > *, .cmp-specs > * { min-width: 0; }
        .compare h2 { margin: 0; font-family: var(--display); font-size: 1.15rem; letter-spacing: -0.01em; }
        .cmp-empty { display: grid; gap: 12px; }
        .cmp-empty > p { margin: 0; }

        /* Ghost card (B87): an empty slot outlined in the next car's colour. */
        .cmp-ghost { display: grid; min-height: 132px; }
        .cmp-ghost button { position: relative; overflow: hidden; display: grid; place-content: center; justify-items: center; gap: 4px; width: 100%; padding: 16px 14px; border: 2px dashed color-mix(in srgb, var(--lane) 55%, var(--field-border)); border-radius: var(--radius); background: transparent; color: var(--text); font: inherit; cursor: pointer; transition: background-color 0.15s var(--ease-out), border-color 0.15s var(--ease-out); }
        .cmp-ghost button:hover { background: var(--surface); border-color: var(--lane); }
        .cmp-ghost button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
        .cmp-ghost-plus { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--surface-2); font-size: 1.4rem; line-height: 1; }
        .cmp-ghost-text { font-family: var(--display); font-weight: 700; }
        html[data-motion="off"] .cmp-ghost button { transition: none; }
        .compare .link-btn { padding: 0; border: 0; background: none; color: var(--accent); font: inherit; text-decoration: underline; text-underline-offset: 0.18em; cursor: pointer; }

        /* Car cards: the car's colour runs along the top like its lane (design-language.md §9, B85). */
        .cmp-cars { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
        .cmp-car { position: relative; overflow: hidden; padding: 16px 14px 12px; display: grid; gap: 8px; align-content: start; }
        .cmp-car::before { content: ""; position: absolute; inset: 0 0 auto; height: 4px; background: var(--lane); }
        .cmp-car .car-name { font-family: var(--display); font-weight: 700; font-size: 1.02rem; letter-spacing: -0.01em; }
        .cmp-car .variant { color: var(--muted); }
        .cmp-car .car-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }

        /* The race (B85): one road lane per car, best first. */
        .cmp-race { display: grid; gap: 14px; }
        .race-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px; }
        .compare .seg-field { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .compare .seg-label { font-size: 0.875rem; color: var(--muted); }
        .race-note { margin: -6px 0 0; }
        .race { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; position: relative; }
        .lane {
          display: grid; grid-template-columns: minmax(150px, 230px) minmax(0, 1fr) minmax(96px, auto);
          grid-template-areas: "car road value" "car meta meta"; column-gap: 16px; row-gap: 4px; align-items: center;
          padding: 10px 14px; border-radius: 10px; background: var(--surface-2);
        }
        .lane-car { grid-area: car; display: flex; align-items: center; gap: 10px; min-width: 0; align-self: start; padding-top: 3px; }
        .lane-dot { flex: none; width: 12px; height: 12px; border-radius: 50%; background: var(--lane); }
        .lane-name { font-family: var(--display); font-weight: 700; font-size: 0.95rem; line-height: 1.25; min-width: 0; }
        .lane-name .muted { font-family: var(--font); font-weight: 400; }
        /* The road: a lane with its centre dashes; the bar is the car's paint over it. */
        .lane-road {
          grid-area: road; position: relative; height: 14px; border-radius: 999px;
          background: linear-gradient(90deg, var(--field-border) 0 16px, transparent 16px 28px) 0 50% / 28px 2px repeat-x, var(--surface);
        }
        .lane-fill { position: absolute; inset: 0 auto 0 0; border-radius: 999px; background: var(--lane); transition: width 0.62s var(--ease-out); }
        .lane-fill::after { content: ""; position: absolute; right: -2px; top: 50%; width: 18px; height: 18px; margin-top: -9px; border-radius: 50%; background: var(--lane); box-shadow: 0 0 0 3px var(--surface-2); }
        .lane-value { grid-area: value; display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px; font-family: var(--display); font-weight: 700; font-size: 1.15rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .lane-value .unknown { font-family: var(--font); font-weight: 400; font-size: 0.9rem; }
        .lane.lead .lane-value { color: var(--text); }
        .race-flag { color: var(--accent); flex: none; }
        .lane-meta { grid-area: meta; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 14px; margin: 0; color: var(--muted); }
        .lane-meta > div { display: inline-flex; gap: 5px; align-items: baseline; }
        .lane-meta dt { margin: 0; }
        .lane-meta dd { margin: 0; color: var(--text); font-variant-numeric: tabular-nums; font-weight: 600; }

        /* The chart on its panel, the window slider under it lined up with the 0-100 % axis. */
        .cmp-race .plot { display: grid; gap: 4px; padding: 12px 12px 10px; }
        .cmp-race .chart { width: 100%; height: 300px; }
        .cmp-race .power-rail { background: var(--field-border); }
        .cmp-race .window { padding: 0 16px 0 48px; }
        .cmp-race .window .power-track { margin: 0; }
        .cmp-race .window-labels { display: flex; justify-content: space-between; font-size: 0.875rem; font-weight: 600; font-variant-numeric: tabular-nums; margin-bottom: 2px; }
        .cmp-race .charger-pick { display: grid; gap: 2px; padding-right: 8px; min-width: 0; }
        /* B119: charger, range basis, distance and price in one row of controls (two on phones). */
        .cmp-controls { display: grid; grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr)); gap: 12px 16px; align-items: start; }
        .cmp-controls > * { min-width: 0; }
        .cmp-field { display: grid; gap: 4px; font-size: 0.875rem; color: var(--muted); min-width: 0; }
        .cmp-field select, .cmp-field input[type=number] { font: inherit; color: var(--text); background: var(--surface); border: 1px solid var(--field-border); border-radius: 8px; padding: 6px 8px; width: 100%; min-width: 0; }
        .cmp-price-help { grid-column: 1 / -1; margin: 0; }
        /* The km | mi switch fills its cell, like the fields beside it. */
        .cmp-field .seg { display: flex; width: 100%; }
        .cmp-field .seg button { flex: 1 1 0; padding-top: 7px; padding-bottom: 7px; }

        /* Sources (B119), as on the Charging page: numbered, the one a "[n]" opened flashes. */
        .compare .sources { list-style: none; counter-reset: src; margin: 0; padding: 4px 16px; }
        .compare .sources li { counter-increment: src; display: grid; grid-template-columns: 2.2em 1fr; column-gap: 8px; padding: 10px 6px; border-bottom: 1px solid color-mix(in srgb, var(--field-border) 35%, transparent); border-radius: 6px; scroll-margin: 96px; }
        .compare .sources li:last-child { border-bottom: 0; }
        .compare .sources li::before { content: counter(src); grid-row: span 2; font-family: var(--display); font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }
        .compare .sources .source-meta { display: block; margin-top: 2px; }
        .compare .sources li.flash { animation: cmp-src-flash 2s ease-out; }
        @keyframes cmp-src-flash { from { background: var(--accent-soft); } to { background: transparent; } }
        html[data-motion="off"] .compare .sources li.flash { animation: none; background: var(--accent-soft); }
        .lane-cost { font-family: var(--font); font-weight: 600; font-size: 0.9rem; color: var(--muted); }
        .cmp-race .charger-words { display: block; font-size: 0.875rem; color: var(--muted); }
        .cmp-race .charger-words strong { color: var(--text); font-weight: 650; font-variant-numeric: tabular-nums; }
        .cmp-race .charger-pick .power-ticks li { transform: translateX(-50%); }

        /* Specs: in a section that unrolls; group rows raised. */
        .specs-tools { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; margin-bottom: 10px; }
        .specs-tools p { margin: 0; }
        .diff-switch { display: inline-flex; align-items: center; gap: 10px; padding: 6px 2px; border: 0; background: none; color: var(--text); font: inherit; font-size: 0.9rem; cursor: pointer; border-radius: 6px; }
        .diff-switch:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
        .diff-switch .switch { flex: none; position: relative; width: 30px; height: 18px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--field-border); transition: background-color 0.15s, border-color 0.15s; }
        .diff-switch .switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--muted); transition: transform 0.15s var(--ease-out); }
        .diff-switch:hover .switch { border-color: var(--text); }
        .diff-switch[aria-checked=true] .switch { background: var(--paint); border-color: var(--paint-edge); }
        .diff-switch[aria-checked=true] .switch::after { transform: translateX(12px); background: var(--paint-ink); }
        .table-scroll { overflow-x: auto; }
        .table-scroll:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
        .cmp-table { border-collapse: separate; border-spacing: 0; width: 100%; table-layout: fixed; min-width: calc(160px + var(--cols) * 180px); }
        .cmp-table th, .cmp-table td { padding: 9px 10px; text-align: left; vertical-align: top; border-bottom: 1px solid color-mix(in srgb, var(--field-border) 45%, transparent); background: var(--surface); overflow-wrap: break-word; }
        .cmp-table tbody th[scope="row"], .cmp-table .corner { position: sticky; left: 0; z-index: 1; width: 160px; font-weight: 600; font-size: 0.9rem; color: var(--muted); hyphens: auto; }
        .cmp-table .car-head { vertical-align: bottom; box-shadow: inset 0 4px 0 var(--lane); padding-top: 14px; }
        .cmp-table .car-name { display: block; font-family: var(--display); font-weight: 700; }
        .cmp-table .variant { display: block; margin: 4px 0; color: var(--muted); font-weight: 400; }
        .cmp-table .group-row th { background: var(--surface-2); color: var(--text); font-family: var(--display); font-weight: 700; font-size: 0.95rem; position: sticky; left: 0; border-bottom: 0; border-radius: 0 0 8px 8px; } /* square top: meets the line above (owner 2026-11-20) */
        .cmp-table td .v { font-family: var(--display); font-weight: 600; font-variant-numeric: tabular-nums; }
        .cmp-table td.best, .cmp-table td.best .v { font-weight: 800; }
        .cmp-table .best-mark { color: var(--accent); position: relative; margin-right: 4px; } /* keeps its sr-only text inside the scroller */
        .best-star { vertical-align: -1px; }
        .add-more { margin: 12px 0 0; }

        html[data-motion="off"] .lane-fill, html[data-motion="off"] .diff-switch .switch, html[data-motion="off"] .diff-switch .switch::after { transition: none; }

        @media (max-width: 640px) {
          .lane { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "car value" "road road" "meta meta"; padding: 10px 12px; column-gap: 10px; }
          .lane-car { align-self: center; padding-top: 0; }
          .cmp-race .chart { height: 240px; }
          .cmp-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cmp-controls .charger-pick { grid-column: 1 / -1; }
          .cmp-race .plot { padding: 8px 6px; }
          .race-head .seg-field { width: 100%; }
          .race-head .seg { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
          .race-head .seg button { border-radius: 0; border-left: 1px solid var(--field-border); }
          .race-head .seg button:nth-child(1) { border-radius: 8px 0 0 0; }
          .race-head .seg button:nth-child(2) { border-radius: 0 8px 0 0; border-left: 0; }
          .race-head .seg button:nth-child(3) { border-radius: 0 0 0 8px; border-top: 0; }
          .race-head .seg button:nth-child(4) { border-radius: 0 0 8px 0; border-top: 0; border-left: 0; }
          /* B141: phones stack the specs, no sideways scroll: each spec's name across the top, then one
             line per car with its value beside a bar in the car's colour; the car names stay pinned as the key. */
          .cmp-specs .table-scroll { overflow: visible; }
          .cmp-table { display: block; min-width: 0; table-layout: auto; }
          .cmp-table thead, .cmp-table tbody { display: block; }
          .cmp-table thead tr { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); column-gap: 8px; }
          .cmp-table tbody tr { display: grid; grid-template-columns: minmax(0, 1fr); row-gap: 4px; }
          .cmp-table thead { position: sticky; top: var(--cmp-pin, 66px); z-index: 2; background: var(--surface); margin: 0 -14px; padding: 0 14px; box-shadow: 0 1px 0 color-mix(in srgb, var(--field-border) 45%, transparent); }
          .cmp-table .corner { display: none; }
          .cmp-table .car-head { padding: 10px 0 6px; box-shadow: inset 0 3px 0 var(--lane); border-bottom: 0; background: none; }
          .cmp-table .car-head .car-name { font-size: 0.8rem; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .cmp-table .car-head .variant { display: none; }
          .cmp-table tbody tr { border-bottom: 1px solid color-mix(in srgb, var(--field-border) 35%, transparent); padding-bottom: 8px; }
          .cmp-table tbody th[scope="row"] { grid-column: 1 / -1; position: static; width: auto; padding: 10px 0 4px; border-bottom: 0; background: none; font-size: 0.85rem; }
          .cmp-table tbody td { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; min-height: 30px; padding: 2px 0 2px 10px; border-bottom: 0; border-left: 4px solid var(--lane); border-radius: 2px; background: none; font-size: 0.9rem; min-width: 0; }
          .cmp-table tbody td .best-mark { margin-right: 0; }
          .cmp-table tr.group-row { display: block; margin-top: 12px; border-bottom: 0; padding: 0; }
          .cmp-table .group-row th { display: block; position: static; padding: 7px 10px; border-radius: 8px; }
          .cmp-cars { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .cmp-car { padding: 14px 10px 10px; }
        }
      `}</style>
    </div>
    {/* Outside .compare so the page's select styles don't reach the picker (B87). */}
      <dialog
        ref={addDialog}
        className="picker-dialog"
        aria-label={t('compare.addTitle')}
        onClose={() => { setAdding(false); // Back to what opened it; after an add, to the ghost card (to add another) or the last car.
          const back = addOpener.current?.isConnected ? addOpener.current : document.querySelector<HTMLElement>('.cmp-ghost button') ?? [...document.querySelectorAll<HTMLElement>('.cmp-car button')].pop(); back?.focus(); }}
        onClick={(e) => { if (e.target === e.currentTarget) closeAdd(); }}
      >
        <button type="button" className="icon-btn picker-close" aria-label={t('picker.close')} onClick={closeAdd}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        {adding && (
          <CarPicker cars={index} level={2} purpose="compare" exclude={ids}
            onCancel={closeAdd}
            onPick={(carId) => {
              if (!ids.includes(carId) && ids.length < 4) change([...ids, carId]);
              addOpener.current = null;
              closeAdd();
            }} />
        )}
      </dialog>
    </>
  );
}
