// Charging curve viewer (charging-curve-viewer.md §2–§7): a React island on the car page.
// Inputs → calculateCharge() → results panel + ECharts chart. Settings are remembered
// in the browser; km/mi follows the header switch ("voltway:units" event).

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, MarkAreaComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { t, type MessageKey } from '../i18n/t.ts';
import { calculateCharge, displayMinutes, powerAt } from '../lib/charging.ts';
import { getItem, getJSON, setJSON, KEYS } from '../lib/storage.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import type { CurveOut } from '../lib/types.ts';
import { SourceRef } from './react/Badge.tsx';
import { COST, COVERAGE } from '../config.ts';
import { setUnit as switchUnit } from '../scripts/units-client.ts';

const money = new Intl.NumberFormat(COVERAGE.moneyLocale, { style: 'currency', currency: COVERAGE.currency });

echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, MarkAreaComponent, CanvasRenderer]);

interface Props {
  /** Extra controls from the car section (B20: the wheel-size picker), shown with the others. */
  extraControls?: ReactNode;
  curves: CurveOut[];
  usableKwh: number | null;
  batteryIsGross: boolean;
  consumption: { highway: number | null; combined: number | null; city: number | null };
  sources: { id: string; title: string; url: string; n: number }[];
}

type Basis = 'highway' | 'combined' | 'city';
type Preset = 'none' | '50' | '100' | '150' | '250' | '350' | 'custom';
interface Settings { start: number; end: number; preset: Preset; customKw: number; price: number }

const PRESETS: Preset[] = ['none', '50', '100', '150', '250', '350', 'custom'];
const DEFAULTS: Settings = { start: 10, end: 80, preset: 'none', customKw: 120, price: COST.defaultPricePerKwh };

const cssVar = (name: string, fallback: string) =>
  typeof window === 'undefined' ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export default function CurveViewer({ extraControls, curves, usableKwh, batteryIsGross, consumption, sources }: Props) {
  const initial = curves.find((c) => c.is_display_default) ?? curves[0];
  const [curveId, setCurveId] = useState(initial.id);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [basis, setBasis] = useState<Basis>('highway');
  const [xAxis, setXAxis] = useState<'soc' | 'time'>('soc');
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [themeTick, setThemeTick] = useState(0);
  const chartEl = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  // Remembered settings and units (browser only, after hydration).
  useEffect(() => {
    setSettings({ ...DEFAULTS, ...getJSON<Partial<Settings>>(KEYS.curveSettings, {}) });
    setUnit(getItem(KEYS.units) === 'mi' ? 'mi' : 'km');
    const onUnits = (e: Event) => setUnit((e as CustomEvent<DistanceUnit>).detail);
    window.addEventListener('voltway:units', onUnits);
    // Theme change (B20): the chart is a canvas, so redraw it with the new colours.
    const onTheme = () => setThemeTick((n) => n + 1);
    const media = matchMedia('(prefers-color-scheme: dark)');
    window.addEventListener('voltway:theme', onTheme);
    media.addEventListener('change', onTheme);
    return () => {
      window.removeEventListener('voltway:units', onUnits);
      window.removeEventListener('voltway:theme', onTheme);
      media.removeEventListener('change', onTheme);
    };
  }, []);
  const update = (patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      if (next.start > next.end) next.start = next.end;
      setJSON(KEYS.curveSettings, next);
      return next;
    });
  };

  const curve = curves.find((c) => c.id === curveId) ?? initial;
  const estimated = curve.kind === 'estimated' || batteryIsGross;
  const chargerKw = settings.preset === 'none' ? null : settings.preset === 'custom' ? Math.max(1, settings.customKw || 1) : Number(settings.preset);
  const whPerKm = consumption[basis] ?? consumption.highway ?? consumption.combined ?? undefined;
  const source = sources.find((s) => s.id === curve.source_id);

  const result = useMemo(() => {
    if (!usableKwh) return null;
    try {
      return calculateCharge({ points: curve.points, usableKwh, startSoc: settings.start, endSoc: settings.end, chargerKw, whPerKm });
    } catch {
      return null;
    }
  }, [curve, usableKwh, settings.start, settings.end, chargerKw, whPerKm]);

  // B19: billed energy is what the charger delivers, so add the assumed charging losses.
  const drawnKwh = result ? result.energyKwh / COST.dcEfficiency : 0;
  const minutes = (m: number) => (estimated ? t('fmt.approxMin', { value: displayMinutes(m, true) }) : t('fmt.min', { value: displayMinutes(m, false) }));
  const distance = (km: number) => t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(km, unit)) });

  // Chart.
  useEffect(() => {
    if (!chartEl.current) return;
    chart.current ??= echarts.init(chartEl.current, undefined, { renderer: 'canvas' });
    const accent = cssVar('--accent', '#0b7a53');
    const est = cssVar('--estimated', '#6b4fa0');
    const muted = cssVar('--muted', '#5b665f');
    const border = cssVar('--border', '#d9dfd8');
    const warn = cssVar('--warn', '#9a5b00');
    const lineColor = curve.kind === 'estimated' ? est : accent;
    const axisCommon = { axisLine: { lineStyle: { color: border } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: border } }, nameTextStyle: { color: muted } };

    const steps = result?.steps ?? [];
    const elapsedAt = (soc: number) => {
      const s = steps.find((x) => x.soc >= soc - 1e-9);
      return s ? s.elapsedMin : soc <= settings.start ? 0 : steps.at(-1)?.elapsedMin ?? 0;
    };
    const carData: [number, number][] = [];
    for (let s = 0; s <= 100; s += 1) carData.push([s, powerAt(curve.points, s)]);
    const delivered: [number, number][] = [];
    for (let s = settings.start; s <= settings.end; s += 0.5) delivered.push([s, Math.min(powerAt(curve.points, s), chargerKw ?? Infinity)]);

    const limitLine = chargerKw
      ? { silent: true, symbol: 'none', lineStyle: { color: warn, type: 'dashed' as const }, label: { formatter: `${t('viewer.chargerLimit')} ${chargerKw} kW`, color: warn }, data: [{ yAxis: chargerKw }] }
      : undefined;

    const option: echarts.EChartsCoreOption =
      xAxis === 'soc'
        ? {
            animation: false,
            grid: { left: 48, right: 16, top: 24, bottom: 44 },
            tooltip: {
              trigger: 'axis',
              formatter: (p: { value: [number, number] }[]) => {
                const [soc, kw] = p[0].value;
                return t('viewer.tooltip', { soc: formatNumber(soc), kw: formatNumber(kw), min: formatNumber(elapsedAt(soc)) });
              },
            },
            xAxis: { type: 'value', min: 0, max: 100, name: t('viewer.socLabel'), nameLocation: 'middle', nameGap: 28, ...axisCommon },
            yAxis: { type: 'value', min: 0, name: t('viewer.powerLabel'), ...axisCommon },
            series: [
              {
                name: t('viewer.delivered'), type: 'line', data: delivered, showSymbol: false, lineStyle: { width: 0 },
                areaStyle: { color: lineColor, opacity: 0.18 }, z: 1,
                markLine: { silent: true, symbol: 'none', lineStyle: { color: muted, type: 'solid' }, label: { formatter: '{c}%', color: muted }, data: [{ xAxis: settings.start }, { xAxis: settings.end }] },
              },
              {
                name: t('viewer.carCurve'), type: 'line', data: carData, showSymbol: false, z: 2,
                lineStyle: { color: lineColor, width: 2.5, type: curve.kind === 'estimated' ? 'dashed' : 'solid' },
                ...(limitLine ? { markLine: limitLine } : {}),
              },
            ],
          }
        : {
            animation: false,
            grid: { left: 48, right: 16, top: 24, bottom: 44 },
            tooltip: {
              trigger: 'axis',
              formatter: (p: { dataIndex: number }[]) => {
                const s = steps[p[0].dataIndex];
                return s ? t('viewer.tooltip', { soc: formatNumber(s.soc), kw: formatNumber(s.deliveredKw), min: formatNumber(s.elapsedMin) }) : '';
              },
            },
            xAxis: { type: 'value', min: 0, name: t('viewer.timeLabel'), nameLocation: 'middle', nameGap: 28, ...axisCommon },
            yAxis: { type: 'value', min: 0, name: t('viewer.powerLabel'), ...axisCommon },
            series: [
              {
                name: t('viewer.delivered'), type: 'line', step: 'end', showSymbol: false,
                data: steps.map((s) => [s.elapsedMin, s.deliveredKw]),
                lineStyle: { color: lineColor, width: 2.5, type: curve.kind === 'estimated' ? 'dashed' : 'solid' },
                areaStyle: { color: lineColor, opacity: 0.18 },
                ...(limitLine ? { markLine: limitLine } : {}),
              },
            ],
          };
    chart.current.setOption(option, true);
    const onResize = () => chart.current?.resize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [curve, settings, chargerKw, xAxis, result, themeTick]);

  useEffect(() => () => { chart.current?.dispose(); chart.current = null; }, []);

  const kindLabel = (k: CurveOut['kind']) => t(`viewer.option.${k}` as MessageKey);

  return (
    <div className="viewer card">
      {curve.kind === 'estimated' && (
        <div className="banner estimated">
          <p style={{ margin: 0 }}>{t('viewer.estimatedBanner')}</p>
          <details>
            <summary>{t('viewer.estimatedWhy')}</summary>
            <p className="small" style={{ margin: '6px 0 0' }}>{curve.basis}</p>
          </details>
        </div>
      )}
      {batteryIsGross && <p className="banner small">{t('viewer.grossNote')}</p>}

      <div className="controls">
        {curves.length > 1 && (
          <label className="curve-pick">
            <span>{t('viewer.curve')}</span>
            <select value={curve.id} onChange={(e) => setCurveId(e.target.value)}>
              {curves.map((c) => (
                <option key={c.id} value={c.id}>{c.based_on ? t('viewer.option.borrowed') : kindLabel(c.kind)}{c.id.startsWith('chargeprice') ? ` (${c.id.split('-')[1]})` : ''}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span>{t('viewer.start')}: {settings.start}%</span>
          <input type="range" min={0} max={100} step={1} value={settings.start} onChange={(e) => update({ start: Number(e.target.value) })} />
        </label>
        <label>
          <span>{t('viewer.end')}: {settings.end}%</span>
          <input type="range" min={0} max={100} step={1} value={settings.end} onChange={(e) => update({ end: Math.max(Number(e.target.value), settings.start) })} />
        </label>
        <label>
          <span>{t('viewer.charger')}</span>
          <select value={settings.preset} onChange={(e) => update({ preset: e.target.value as Preset })}>
            {PRESETS.map((p) => (
              <option key={p} value={p}>{p === 'none' ? t('viewer.noLimit') : p === 'custom' ? t('viewer.custom') : t('fmt.kw', { value: p })}</option>
            ))}
          </select>
        </label>
        {settings.preset === 'custom' && (
          <label>
            <span>{t('viewer.customKw')}</span>
            <input type="number" min={1} max={1000} value={settings.customKw} onChange={(e) => update({ customKw: Number(e.target.value) })} />
          </label>
        )}
        <label>
          <span>{t('viewer.rangeBasis')}</span>
          <select value={basis} onChange={(e) => setBasis(e.target.value as Basis)}>
            {(['highway', 'combined', 'city'] as Basis[]).map((b) => <option key={b} value={b}>{t(`viewer.basis.${b}` as MessageKey)}</option>)}
          </select>
        </label>
        {extraControls}
        <fieldset className="toggle axis-toggle">
          <legend>{t('viewer.xAxis')}</legend>
          {(['soc', 'time'] as const).map((x) => (
            <button key={x} type="button" aria-pressed={xAxis === x} onClick={() => setXAxis(x)}>{t(`viewer.axis.${x}` as MessageKey)}</button>
          ))}
        </fieldset>
        <fieldset className="toggle">
          <legend>{t('viewer.units')}</legend>
          {(['km', 'mi'] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => switchUnit(u)}>{t(`units.${u}` as MessageKey)}</button>
          ))}
        </fieldset>
        <label title={t('viewer.priceHelp')}>
          <span>{t('viewer.price', { currency: COVERAGE.currency })}</span>
          <input
            type="number" inputMode="decimal" min={0} max={5} step={0.01}
            value={settings.price}
            aria-describedby="price-help"
            onChange={(e) => update({ price: Math.max(0, Number(e.target.value) || 0) })}
          />
        </label>
      </div>

      <div className="results" aria-live="polite">
        {result ? (
          <>
            <div className="r"><p className="rl">{t('viewer.result.time', { start: settings.start, end: settings.end })}</p><p className="rv">{minutes(result.minutes)}</p></div>
            <div className="r"><p className="rl">{t('viewer.result.km', { basis: t(`viewer.basis.${basis}` as MessageKey) })}</p><p className="rv">{result.kmAdded !== null ? `${estimated ? '~' : ''}${distance(result.kmAdded)}` : <span className="unknown small">{t('viewer.result.noConsumption')}</span>}</p></div>
            <div className="r"><p className="rl">{t('viewer.result.per10')}</p><p className="rv">{result.kmPer10Min !== null ? `${estimated ? '~' : ''}${distance(result.kmPer10Min)}` : <span className="unknown small">{t('badge.unknown')}</span>}</p></div>
            <div className="r"><p className="rl">{t('viewer.result.avg')}</p><p className="rv">{t('fmt.kw', { value: formatNumber(result.averageKw) })}</p></div>
            <div className="r" title={t('viewer.result.costNote', { kwh: formatNumber(drawnKwh, 1), loss: Math.round((1 - COST.dcEfficiency) * 100) })}>
              <p className="rl">{t('viewer.result.cost', { start: settings.start, end: settings.end })}</p>
              <p className="rv">~{money.format(drawnKwh * settings.price)}</p>
            </div>
            {chargerKw !== null && result.lostToChargerMinutes > 0.05 && (
              <div className="r"><p className="rl">{t('viewer.result.lost')}</p><p className="rv">{t('viewer.result.lostValue', { value: formatNumber(result.lostToChargerMinutes), kw: chargerKw })}</p></div>
            )}
          </>
        ) : (
          <p className="unknown">{t('badge.unknown')}</p>
        )}
      </div>

      <div ref={chartEl} className="chart" role="img" aria-label={t('viewer.title')} />
      <p className="small muted curve-note">
        {t('viewer.curveFrom', { kind: curve.based_on ? t('viewer.option.borrowed') : kindLabel(curve.kind) })}
        {source && <> <a href={source.url} target="_blank" rel="noopener">{source.title}</a> <SourceRef n={source.n} /></>}
        {' · '}{t('viewer.warm')}
        {result && <> {t('viewer.result.costNote', { kwh: formatNumber(drawnKwh, 1), loss: Math.round((1 - COST.dcEfficiency) * 100) })}. </>}
        <span id="price-help">{t('viewer.priceHelp')}</span>
      </p>

      <details className="more">
        <summary>{t('viewer.moreDetail')}</summary>
        {result && (
          <ul>
            <li>{t('viewer.peak', { kw: formatNumber(result.peakKw), soc: formatNumber(result.peakAtSoc) })}</li>
            {([100, 150, 200] as const).map((k) => <li key={k}>{t('viewer.above', { kw: k })}: {t('fmt.min', { value: formatNumber(result.minutesAbove[k], 1) })}</li>)}
          </ul>
        )}
        {(curve.notes || curve.basis) && <p className="small"><strong>{t('viewer.notes')}:</strong> {curve.basis ?? curve.notes}</p>}
        {curve.conditions && <p className="small"><strong>{t('viewer.conditions')}:</strong> {Object.entries(curve.conditions).map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>}
        <table className="points">
          <caption className="small muted">{t('viewer.points')} · {t('viewer.chartTable')}</caption>
          <thead><tr><th>{t('viewer.pointSoc')}</th><th>{t('viewer.pointKw')}</th></tr></thead>
          <tbody>{curve.points.map((p) => <tr key={p.soc_percent}><td>{formatNumber(p.soc_percent)}</td><td>{formatNumber(p.power_kw, 1)}</td></tr>)}</tbody>
        </table>
      </details>

      <style>{`
        .viewer { display: grid; gap: 16px; }
        .viewer .controls { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px 16px; align-items: end; }
        .viewer .controls > * { min-width: 0; }
        .viewer .curve-pick { grid-column: span 2; }
        .viewer .control-note { display: block; font-size: 0.8rem; color: var(--muted); }
        .viewer .control-note.linkish { padding: 0; border: 0; background: none; color: var(--accent); font: inherit; font-size: 0.8rem; font-weight: 600; text-align: left; cursor: pointer; text-decoration: underline; }
        .viewer .axis-toggle { grid-column: span 2; }
        .viewer label { display: grid; gap: 4px; font-size: 0.875rem; color: var(--muted); min-width: 0; }
        .viewer select, .viewer input[type=number] { font: inherit; color: var(--text); background: var(--surface); border: 1px solid var(--field-border); border-radius: 8px; padding: 6px 8px; width: 100%; min-width: 0; text-overflow: ellipsis; }
        .viewer input[type=range] { accent-color: var(--accent); width: 100%; margin: 6px 0; }
        .viewer .toggle { border: 0; padding: 0; margin: 0; min-width: 0; min-inline-size: 0; display: flex; gap: 0; flex-wrap: nowrap; }
        .viewer .toggle legend { font-size: 0.875rem; color: var(--muted); margin-bottom: 4px; padding: 0; }
        .viewer .toggle button { flex: 1 1 0; white-space: nowrap; font: inherit; font-size: 0.875rem; border: 1px solid var(--field-border); background: var(--surface); color: var(--text); padding: 6px 10px; cursor: pointer; }
        .viewer .toggle button:first-of-type { border-radius: 8px 0 0 8px; }
        .viewer .toggle button:last-of-type { border-radius: 0 8px 8px 0; border-left: 0; }
        .viewer .toggle button[aria-pressed=true] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
        .viewer .results { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
        .viewer .r { background: var(--surface-2); border-radius: 10px; padding: 8px 12px; min-width: 0; }
        .viewer .rl { margin: 0; color: var(--muted); font-size: 0.8rem; }
        .viewer .rv { margin: 2px 0 0; font-weight: 650; font-size: 1.15rem; overflow-wrap: anywhere; }
        .viewer .chart { width: 100%; height: 320px; }
        .viewer .curve-note { margin: -8px 0 0; }
        @media (max-width: 640px) {
          .viewer { gap: 12px; padding: 14px; }
          .viewer .rv { font-size: 1.05rem; }
          .viewer .chart { height: 260px; }
        }
        .viewer .more summary { cursor: pointer; font-weight: 600; }
        .viewer .points { max-width: 320px; margin-top: 8px; }
        .viewer .points caption { text-align: left; }
      `}</style>
    </div>
  );
}
