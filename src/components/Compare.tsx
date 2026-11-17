// The Compare screen (database-ui.md §6, charging-curve-viewer.md §6, DESIGN-1b 6.1): up to four
// cars, each with one colour across its header, curve line and results row. One SoC window and
// charger power for every car; a sortable results table; the spec table with the best value per
// row (icon + bold) and an "Only show differences" toggle. The list comes from ?cars= (shareable),
// else from the saved Compare list; changes are saved and the URL follows.

import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { t, type MessageKey } from '../i18n/t.ts';
import { calculateCharge, displayMinutes, powerAt, type ChargeResult } from '../lib/charging.ts';
import { BETTER, bestIndices, compareHref, firstDir, readCarsParam, replaceAt, rowDiffers, sortBy, type SortDir } from '../lib/compare.ts';
import { getCompare, setCompare } from '../lib/my-car.ts';
import { GROUPS } from '../lib/spec-groups.ts';
import { getItem, getJSON, KEYS } from '../lib/storage.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import type { CarDetail, CurveOut, Field, IndexEntry } from '../lib/types.ts';
import { Value } from './react/Badge.tsx';

echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

interface Props { index: IndexEntry[] }

type Preset = 'none' | '50' | '100' | '150' | '250' | '350' | 'custom';
const PRESETS: Preset[] = ['none', '50', '100', '150', '250', '350', 'custom'];
type Col = 'minutes' | 'km' | 'per10' | 'avgKw';
const COLS: Col[] = ['minutes', 'km', 'per10', 'avgKw'];
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
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [sort, setSort] = useState<{ col: Col; dir: SortDir }>({ col: 'per10', dir: 'desc' });
  const [themeTick, setThemeTick] = useState(0);
  // Opened from a shared link whose list differs from the visitor's saved one: say so until they edit it.
  const [shared, setShared] = useState(false);
  const chartEl = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);

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
    const onUnits = (e: Event) => setUnit((e as CustomEvent<DistanceUnit>).detail);
    const onTheme = () => setThemeTick((n) => n + 1);
    const media = matchMedia('(prefers-color-scheme: dark)');
    window.addEventListener('voltway:units', onUnits);
    window.addEventListener('voltway:theme', onTheme);
    media.addEventListener('change', onTheme);
    return () => {
      window.removeEventListener('voltway:units', onUnits);
      window.removeEventListener('voltway:theme', onTheme);
      media.removeEventListener('change', onTheme);
    };
  }, [byId]);

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
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    (ids ?? []).forEach((id, slot) => {
      const car = cars[id];
      if (!car || car === 'error') return;
      const curve = car.curves.find((c) => c.is_display_default) ?? car.curves[0] ?? null;
      const usable = car.fields.capacity_usable_kwh?.value.value;
      const gross = car.fields.capacity_gross_kwh?.value.value;
      const kwh = typeof usable === 'number' ? usable : typeof gross === 'number' ? gross : null;
      const wh = car.fields.consumption_highway_wh_per_km?.value.value ?? car.fields.consumption_combined_wh_per_km?.value.value;
      let result: ChargeResult | null = null;
      if (curve && kwh) {
        try {
          result = calculateCharge({ points: curve.points, usableKwh: kwh, startSoc: start, endSoc: end, chargerKw, whPerKm: typeof wh === 'number' ? wh : undefined });
        } catch {
          result = null;
        }
      }
      const estimated = curve?.kind === 'estimated' || typeof usable !== 'number' || Boolean(result?.extrapolated);
      out.push({ id, slot, car, curve, result, estimated });
    });
    return out;
  }, [ids, cars, start, end, chargerKw]);

  const name = (id: string) => {
    const e = byId.get(id);
    return e ? `${e.make} ${e.model} ${e.year}` : id;
  };
  const siblings = (id: string) => {
    const e = byId.get(id);
    return e ? index.filter((x) => x.make === e.make && x.model === e.model && x.year === e.year) : [];
  };

  // Curve overlay.
  useEffect(() => {
    if (!chartEl.current || !rows.length) return;
    if (!chart.current) chart.current = echarts.init(chartEl.current, undefined, { renderer: 'canvas' });
    const muted = cssVar('--muted', '#55544E');
    const border = cssVar('--border', '#D5D3CB');
    const warn = cssVar('--warn', '#9A3F00');
    const axis = { axisLine: { lineStyle: { color: border } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: border } }, nameTextStyle: { color: muted } };
    const series = rows
      .filter((r) => r.curve)
      .map((r, n) => ({
        name: `${name(r.id)} ${r.car.name}`,
        type: 'line' as const,
        showSymbol: false,
        data: Array.from({ length: 101 }, (_, s) => [s, powerAt(r.curve!.points, s)]),
        lineStyle: { color: cssVar(`--car-${r.slot + 1}`, '#1D4ED8'), width: 2.5, type: r.curve!.kind === 'estimated' ? ('dashed' as const) : ('solid' as const) },
        itemStyle: { color: cssVar(`--car-${r.slot + 1}`, '#1D4ED8') },
        ...(n === 0
          ? {
              markLine: {
                silent: true,
                symbol: 'none',
                data: [
                  { xAxis: start, lineStyle: { color: muted, type: 'solid' as const }, label: { formatter: '{c}%', color: muted } },
                  { xAxis: end, lineStyle: { color: muted, type: 'solid' as const }, label: { formatter: '{c}%', color: muted } },
                  ...(chargerKw
                    ? [{ yAxis: chargerKw, lineStyle: { color: warn, type: 'dashed' as const }, label: { position: 'insideEndTop' as const, formatter: t('viewer.chargerLimitValue', { kw: formatNumber(chargerKw) }), color: warn } }]
                    : []),
                ],
              },
            }
          : {}),
      }));
    chart.current.setOption(
      {
        animation: false,
        grid: { left: 48, right: 16, top: 24, bottom: 44 },
        tooltip: {
          trigger: 'axis',
          valueFormatter: (v: unknown) => t('fmt.kw', { value: formatNumber(Number(v)) }),
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
  }, [rows, start, end, chargerKw, themeTick]);
  useEffect(() => () => { chart.current?.dispose(); chart.current = null; }, []);
  useEffect(() => {
    if (!rows.length && chart.current) { chart.current.dispose(); chart.current = null; }
  }, [rows.length]);

  if (ids === null) return <p className="muted">{t('compare.loading')}</p>;

  const minutes = (r: Row) => (r.result ? t(r.estimated ? 'fmt.approxMin' : 'fmt.min', { value: displayMinutes(r.result.minutes, r.estimated) }) : null);
  const distance = (km: number, approx: boolean) => `${approx ? '~' : ''}${t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(km, unit)) })}`;
  const colValue = (r: Row, c: Col): number | null =>
    !r.result ? null : c === 'minutes' ? r.result.minutes : c === 'km' ? r.result.kmAdded : c === 'per10' ? r.result.kmPer10Min : r.result.averageKw;
  const sorted = sortBy(rows, (r) => colValue(r, sort.col), sort.dir);
  const clickSort = (c: Col) => setSort((s) => (s.col === c ? { col: c, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col: c, dir: firstDir(c) }));
  const mixed = rows.some((r) => r.estimated) && rows.some((r) => !r.estimated && r.curve);
  const colLabel: Record<Col, MessageKey> = { minutes: 'compare.col.minutes', km: 'compare.col.km', per10: 'compare.col.per10', avgKw: 'compare.col.avgKw' };

  // Spec rows: each car's figure (variant level; heat pump from its first trim).
  const fieldOf = (r: Row, k: string): Field =>
    k === 'heat_pump' ? r.car.trims[0]?.heat_pump ?? null : k === 'ac_max_kw' ? r.car.fields.ac_max_kw ?? r.car.trims[0]?.ac_max_kw ?? null : r.car.fields[k] ?? null;
  const groups = GROUPS.map((g) => ({ ...g, fields: g.title === 'group.ports' ? [...g.fields, 'heat_pump'] : g.fields }));
  // Ready once every car has loaded or failed; a failed car keeps its column, shown as unknown.
  const ready = ids.every((id) => cars[id]);
  const slotRows = ids.map((id) => rows.find((r) => r.id === id) ?? null);
  const failed = ids.filter((id) => cars[id] === 'error');

  return (
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
        <div className="card empty">
          <p>{t('compare.empty')}</p>
          <p><a className="btn" href="/cars">{t('compare.browse')}</a></p>
        </div>
      ) : (
        <>
          <ul className="cmp-cars" aria-label={t('compare.cars')}>
            {ids.map((id, slot) => {
              const sibs = siblings(id);
              const label = name(id);
              return (
                <li key={id} className="card cmp-car" style={{ borderTopColor: carVar(slot) }}>
                  <span className="car-name">{label}</span>
                  {sibs.length > 1 ? (
                    <select aria-label={t('compare.variantFor', { car: label })} value={id} onChange={(e) => change(replaceAt(ids, slot, e.target.value))}>
                      {sibs.map((s) => (
                        <option key={s.id} value={s.id} disabled={s.id !== id && ids.includes(s.id)}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="variant">{byId.get(id)?.name}</span>
                  )}
                  {cars[id] === 'error' && <span className="small unknown">{t('compare.notLoaded')}</span>}
                  <span className="car-actions">
                    <a className="small" href={`/charging?car=${id}`}>{t('compare.open')}</a>
                    <button type="button" className="btn small" onClick={() => change(ids.filter((x) => x !== id))} aria-label={t('compare.removeFor', { car: `${label} ${byId.get(id)?.name ?? ''}` })}>
                      {t('compare.remove')}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>

          <section aria-labelledby="cmp-curves" className="card cmp-curves">
            <h2 id="cmp-curves">{t('compare.curves')}</h2>
            <div className="controls">
              <label>
                <span>{t('viewer.start')}: {start}%</span>
                <input type="range" min={0} max={100} step={1} value={start} onChange={(e) => setStart(Math.min(Number(e.target.value), end))} />
              </label>
              <label>
                <span>{t('viewer.end')}: {end}%</span>
                <input type="range" min={0} max={100} step={1} value={end} onChange={(e) => setEnd(Math.max(Number(e.target.value), start))} />
              </label>
              <label>
                <span>{t('viewer.charger')}</span>
                <select value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
                  {PRESETS.map((p) => (
                    <option key={p} value={p}>{p === 'none' ? t('viewer.noLimit') : p === 'custom' ? t('viewer.custom') : t('fmt.kw', { value: p })}</option>
                  ))}
                </select>
              </label>
              {preset === 'custom' && (
                <label>
                  <span>{t('viewer.customKw')}</span>
                  <input type="number" min={1} max={1000} value={customKw} onChange={(e) => setCustomKw(Number(e.target.value))} />
                </label>
              )}
            </div>
            <p className="small muted">{t('compare.shared')}</p>
            {mixed && <p className="banner small estimated" role="note">{t('compare.mixed')}</p>}
            <div ref={chartEl} className="chart" role="img" aria-label={t('compare.chartAlt', { count: rows.filter((r) => r.curve).length })} />
            <ul className="cmp-legend small" aria-hidden="true">
              {rows.filter((r) => r.curve).map((r) => (
                <li key={r.id}><span className={`swatch${r.curve!.kind === 'estimated' ? ' dashed' : ''}`} style={{ borderColor: carVar(r.slot) }} />{name(r.id)} {r.car.name}</li>
              ))}
            </ul>

            <div className="table-scroll">
              <table className="cmp-results">
                <caption className="sr-only">{t('compare.resultsCaption', { start, end })}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('compare.col.car')}</th>
                    {COLS.map((c) => (
                      <th key={c} scope="col" aria-sort={sort.col === c ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button type="button" className="sort" onClick={() => clickSort(c)}>
                          {t(colLabel[c], { start, end })}
                          <span aria-hidden="true">{sort.col === c ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</span>
                        </button>
                      </th>
                    ))}
                    <th scope="col">{t('compare.col.curve')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => (
                    <tr key={r.id}>
                      <th scope="row"><span className="dot" style={{ background: carVar(r.slot) }} aria-hidden="true" />{name(r.id)} <span className="muted">{r.car.name}</span></th>
                      <td>{minutes(r) ?? <span className="unknown">{t('badge.unknown')}</span>}</td>
                      <td>{r.result?.kmAdded != null ? distance(r.result.kmAdded, r.estimated) : <span className="unknown">{t('badge.unknown')}</span>}</td>
                      <td>{r.result?.kmPer10Min != null ? distance(r.result.kmPer10Min, r.estimated) : <span className="unknown">{t('badge.unknown')}</span>}</td>
                      <td>{r.result ? t('fmt.kw', { value: formatNumber(r.result.averageKw) }) : <span className="unknown">{t('badge.unknown')}</span>}</td>
                      <td>
                        {r.curve ? (
                          <span className={`kind-tag ${r.curve.kind === 'estimated' ? 'estimated' : 'measured'}`}>
                            {r.curve.based_on ? t('viewer.option.borrowed') : t(`viewer.option.${r.curve.kind}` as MessageKey)}
                          </span>
                        ) : <span className="unknown">{t('compare.noCurve')}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="cmp-specs" className="cmp-specs">
            <div className="cmp-specs-head">
              <h2 id="cmp-specs">{t('compare.specs')}</h2>
              <label className="check">
                <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
                <span>{t('compare.onlyDiff')}</span>
              </label>
            </div>
            <p className="small muted">{t('compare.bestHelp')}</p>
            <div className="table-scroll snap" tabIndex={0} aria-label={t('compare.scrollLabel')}>
              <table className="cmp-table" style={{ ['--cols' as string]: ids.length }}>
                <thead>
                  <tr>
                    <td className="corner" />
                    {ids.map((id, slot) => (
                      <th key={id} scope="col" className="car-head" style={{ borderTopColor: carVar(slot) }}>
                        <span className="car-name">{name(id)}</span>
                        <span className="variant">{byId.get(id)?.name}</span>
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
                      <tbody key={g.title}>
                        <tr className="group-row"><th scope="colgroup" colSpan={ids.length + 1}>{t(g.title)}</th></tr>
                        {fieldRows.map(({ k, fields, values }) => {
                          const label = t(`field.${k}` as MessageKey);
                          const best = bestIndices(values.map((v) => (typeof v === 'number' ? v : null)), BETTER[k]);
                          return (
                            <tr key={k}>
                              <th scope="row">{label}</th>
                              {slotRows.map((r, i) => (
                                <td key={ids[i]} className={best.includes(i) ? 'best' : undefined}>
                                  {best.includes(i) && (
                                    <span className="best-mark"><span aria-hidden="true">★ </span><span className="sr-only">{t('compare.best')} </span></span>
                                  )}
                                  {r ? <Value field={fields[i]} sources={r.car.sources} label={label} unit={unit} /> : <span className="unknown">{t('badge.unknown')}</span>}
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
            {ids.length < 4 && <p className="small"><a href="/cars">{t('compare.addMore')}</a></p>}
          </section>
        </>
      )}

      <style>{`
        .compare { display: grid; gap: 20px; }
        .compare > *, .cmp-curves > *, .cmp-specs > * { min-width: 0; }
        .compare h2 { margin: 0 0 8px; font-size: 1.15rem; }
        .compare .empty { text-align: center; }
        .cmp-curves { display: grid; gap: 12px; }
        .cmp-curves .controls { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px 16px; align-items: end; }
        .cmp-curves .controls label { display: grid; gap: 4px; }
        .cmp-curves .chart { width: 100%; height: 320px; }
        .cmp-curves > p { margin: 0; }
        .cmp-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 16px; }
        .cmp-legend li { display: inline-flex; align-items: center; gap: 6px; }
        .cmp-legend .swatch { display: inline-block; width: 22px; border-top: 3px solid; }
        .cmp-legend .swatch.dashed { border-top-style: dashed; }
        .table-scroll { overflow-x: auto; }
        .table-scroll:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .cmp-results { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
        .cmp-results th, .cmp-results td { padding: 8px; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; }
        .cmp-results thead th { font-size: 0.85rem; color: var(--muted); font-weight: 600; }
        .cmp-results .sort { background: none; border: 0; padding: 0; font: inherit; color: inherit; cursor: pointer; text-align: left; }
        .cmp-results .sort:hover { color: var(--text); text-decoration: underline; }
        .cmp-results .sort:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .cmp-results .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
        .cmp-specs-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
        .cmp-specs-head .check { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
        .cmp-specs-head .check input { width: 18px; height: 18px; accent-color: var(--accent); }
        .cmp-specs > p { margin: 4px 0 8px; }
        .cmp-table { border-collapse: separate; border-spacing: 0; width: 100%; table-layout: fixed; min-width: calc(160px + var(--cols) * 180px); }
        .cmp-table th, .cmp-table td { padding: 8px 10px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--border); background: var(--surface); overflow-wrap: break-word; }
        .cmp-table tbody th[scope="row"], .cmp-table .corner { position: sticky; left: 0; z-index: 1; width: 160px; font-weight: 600; font-size: 0.9rem; color: var(--muted); }
        .cmp-table .car-head { border-top: 5px solid; vertical-align: bottom; }
        .cmp-table .car-name { display: block; font-weight: 700; }
        .cmp-table .variant { display: block; margin: 4px 0; color: var(--muted); font-weight: 400; }
        .cmp-cars { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .cmp-car { border-top: 5px solid; padding: 12px 14px; display: grid; gap: 6px; align-content: start; }
        .cmp-car .car-name { font-weight: 700; }
        .cmp-car select { width: 100%; }
        .cmp-car .variant { color: var(--muted); }
        .cmp-car .car-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .cmp-table tbody th[scope="row"] { hyphens: auto; }
        .cmp-table .group-row th { background: var(--surface-2); color: var(--text); font-size: 0.9rem; position: sticky; left: 0; }
        .cmp-table td.best { font-weight: 700; }
        .cmp-table td.best .v { font-weight: 700; }
        .cmp-table .best-mark { color: var(--accent); position: relative; } /* keeps its sr-only text inside the scroller */
        @media (max-width: 640px) {
          .cmp-table { min-width: calc(110px + var(--cols) * ((100vw - 32px - 110px) / 2)); }
          .cmp-table tbody th[scope="row"], .cmp-table .corner { width: 110px; font-size: 0.8rem; }
          .table-scroll.snap { scroll-snap-type: x mandatory; scroll-padding-left: 110px; }
          .cmp-table .car-head { scroll-snap-align: start; }
          .cmp-cars { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .cmp-car { padding: 10px; }
          .cmp-results tbody th, .cmp-results thead th:first-child { white-space: normal; min-width: 120px; max-width: 140px; position: sticky; left: 0; z-index: 1; background: var(--surface); }
        }
      `}</style>
    </div>
  );
}
