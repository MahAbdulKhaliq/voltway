// Charging curve viewer (charging-curve-viewer.md §2–§7): a React island on the car page.
// Inputs → calculateCharge() → results panel + ECharts chart. Settings are remembered
// in the browser; km/mi follows the header switch ("voltway:units" event).

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { t, type MessageKey } from '../i18n/t.ts';
import { calculateCharge, displayMinutes, measuredSpan, powerAt } from '../lib/charging.ts';
import { getItem, getJSON, setJSON, KEYS } from '../lib/storage.ts';
import { chargePrice, money, PRICE_EVENT, setChargePrice } from '../lib/price.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import type { CurveOut } from '../lib/types.ts';
import { SourceRef } from './react/Badge.tsx';
import { COST } from '../config.ts';
import { setUnit as switchUnit } from '../scripts/units-client.ts';
import { mapLink } from '../lib/map-filter.ts';
import type { Plug } from '../lib/power-bands.ts';
import { curveChoices, curveYear } from '../lib/curve-choice.ts';


echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, MarkPointComponent, MarkAreaComponent, CanvasRenderer]);

interface Props {
  /** Extra controls from the car section (B20: the wheel-size picker), shown with the others. */
  extraControls?: ReactNode;
  /** Outside temperature (B116), after the price so it fills the cells under Range basis / Wheels. */
  climateControls?: ReactNode;
  curves: CurveOut[];
  usableKwh: number | null;
  batteryIsGross: boolean;
  consumption: { highway: number | null; combined: number | null; city: number | null };
  sources: { id: string; title: string; url: string; n: number }[];
  /** A charger cap from a map link (B31): shown as the custom preset, never saved over the remembered settings. */
  initialChargerKw?: number | null;
  /** A charging window from a trip stop link (3.12): shown, never saved over the remembered settings. */
  initialWindow?: { start: number; end: number } | null;
  /** The car's plugs, for the "Find chargers this fast" map link (B31); null when its port is unknown. */
  mapPlugs?: Plug[] | null;
}

type Basis = 'highway' | 'combined' | 'city';
type Preset = 'none' | '50' | '100' | '150' | '250' | '350' | 'custom';
interface Settings { start: number; end: number; preset: Preset; customKw: number; price: number }

// Charger power slider (B83, owner): every 50 kW from 50 to 350 kW, then no
// limit, in the map's slider look. A kW from a map link or an older remembered setting that isn't a
// stop is shown as it is, with the handle at the nearest stop, until the visitor moves it.
const CHARGER_STOPS = [50, 100, 150, 200, 250, 300, 350, Number.POSITIVE_INFINITY];
// Lane-line dashes for the curve outside the charging window (B83): long paint, longer gap.
const ROAD_DASH = [16, 12];
const stopPct = (i: number) => `${(i / (CHARGER_STOPS.length - 1)) * 100}%`;
const GRAB_PX = 12; // how close (px) a pointer must be to grab a window guide
const DEFAULTS: Settings = { start: 10, end: 80, preset: 'none', customKw: 120, price: COST.defaultPricePerKwh };

const cssVar = (name: string, fallback: string) =>
  typeof window === 'undefined' ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export default function CurveViewer({
  extraControls,
  climateControls,
  curves,
  usableKwh,
  batteryIsGross,
  consumption,
  sources,
  initialChargerKw = null,
  initialWindow = null,
  mapPlugs = null,
}: Props) {
  const initial = curves.find((c) => c.is_display_default) ?? curves[0];
  const [curveId, setCurveId] = useState(initial.id);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [basis, setBasis] = useState<Basis>('highway');
  const [xAxis, setXAxis] = useState<'soc' | 'time'>('soc');
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [themeTick, setThemeTick] = useState(0);
  const uid = useId();
  const chartEl = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  // Draggable window guides (§5): pointer handlers are wired once and read the latest state here.
  const live = useRef({ start: settings.start, end: settings.end, xAxis });
  live.current = { start: settings.start, end: settings.end, xAxis };
  const dragging = useRef<'start' | 'end' | null>(null);
  // While a link's charger cap (B31) or charging window (trip stop) is shown, the remembered values
  // for those settings stay what they were, until the visitor changes that setting themselves.
  const kept = useRef<Partial<Settings>>({});

  // Remembered settings and units (browser only, after hydration).
  useEffect(() => {
    const saved = { ...DEFAULTS, ...getJSON<Partial<Settings>>(KEYS.curveSettings, {}) };
    const shown = { ...saved };
    if (initialChargerKw != null) {
      kept.current.preset = saved.preset;
      kept.current.customKw = saved.customKw;
      Object.assign(shown, { preset: 'custom', customKw: initialChargerKw });
    }
    if (initialWindow) {
      kept.current.start = saved.start;
      kept.current.end = saved.end;
      Object.assign(shown, initialWindow);
    }
    // The price is the site-wide setting (B66), shared with Settings and the trip planner.
    shown.price = chargePrice();
    setSettings(shown);
    const onPrice = (e: Event) => setSettings((s) => ({ ...s, price: (e as CustomEvent<number>).detail }));
    window.addEventListener(PRICE_EVENT, onPrice);
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
      window.removeEventListener(PRICE_EVENT, onPrice);
      media.removeEventListener('change', onTheme);
    };
  }, []);
  const update = (patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      if (next.start > next.end) next.start = next.end;
      if ('preset' in patch || 'customKw' in patch) { delete kept.current.preset; delete kept.current.customKw; }
      if ('start' in patch || 'end' in patch) { delete kept.current.start; delete kept.current.end; }
      setJSON(KEYS.curveSettings, { ...next, ...kept.current });
      return next;
    });
  };

  const curve = curves.find((c) => c.id === curveId) ?? initial;
  // B24: a measured curve is only measured between its first and last points.
  const span = measuredSpan(curve.points);
  const partial = curve.kind !== 'estimated' && (span.from > 0 || span.to < 100);
  const chargerKw = settings.preset === 'none' ? null : settings.preset === 'custom' ? Math.max(1, settings.customKw || 1) : Number(settings.preset);
  const chargerIndex = chargerKw == null
    ? CHARGER_STOPS.length - 1
    : CHARGER_STOPS.reduce((best, kw, i) => (Number.isFinite(kw) && Math.abs(kw - chargerKw) < Math.abs(CHARGER_STOPS[best] - chargerKw) ? i : best), 0);
  const chargerLabel = chargerKw == null ? t('viewer.noLimit') : t('fmt.kw', { value: formatNumber(chargerKw, Number.isInteger(chargerKw) ? 0 : 1) }); // a map link may carry 62.5 kW
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
  const estimated = curve.kind === 'estimated' || batteryIsGross || Boolean(result?.extrapolated);

  // B19: billed energy is what the charger delivers, so add the assumed charging losses.
  const drawnKwh = result ? result.energyKwh / COST.dcEfficiency : 0;
  const minutes = (m: number) => (estimated ? t('fmt.approxMin', { value: displayMinutes(m, true) }) : t('fmt.min', { value: displayMinutes(m, false) }));
  const distance = (km: number) => t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(km, unit)) });

  // Grab a start/end guide within a few pixels and drag it; it moves the sliders (same settings).
  const wireGuideDrag = (c: echarts.ECharts) => {
    const zr = c.getZr();
    const px = (soc: number) => (c.convertToPixel({ gridIndex: 0 }, [soc, 0]) as number[])[0];
    const near = (x: number): 'start' | 'end' | null => {
      const { start, end } = live.current;
      const ds = Math.abs(px(start) - x);
      const de = Math.abs(px(end) - x);
      if (Math.min(ds, de) > GRAB_PX) return null;
      if (ds === de) return x < px(start) ? 'start' : 'end'; // overlapping guides: pick by side
      return ds < de ? 'start' : 'end';
    };
    zr.on('mousedown', (e) => {
      if (live.current.xAxis === 'soc') dragging.current = near(e.offsetX);
    });
    zr.on('mousemove', (e) => {
      if (live.current.xAxis !== 'soc') return;
      if (!dragging.current) {
        zr.setCursorStyle(near(e.offsetX) ? 'ew-resize' : 'default');
        return;
      }
      const raw = (c.convertFromPixel({ gridIndex: 0 }, [e.offsetX, e.offsetY]) as number[])[0];
      const soc = Math.round(Math.min(100, Math.max(0, raw)));
      const { start, end } = live.current;
      if (dragging.current === 'start') update({ start: Math.min(soc, end) });
      else update({ end: Math.max(soc, start) });
    });
    const stop = () => { dragging.current = null; };
    zr.on('mouseup', stop);
    zr.on('globalout', stop);
  };

  // Chart.
  useEffect(() => {
    if (!chartEl.current) return;
    if (!chart.current) {
      chart.current = echarts.init(chartEl.current, undefined, { renderer: 'canvas' });
      wireGuideDrag(chart.current);
    }
    // B83: a non-estimated curve is road paint (yellow on the dark road band, like the trip line, in
    // both themes); estimated curves and unmeasured stretches stay violet and dashed.
    const paint = cssVar('--paint', '#FFD400');
    const band = cssVar('--band', '#2B2C30');
    const text = cssVar('--text', '#1A1B1E');
    const est = cssVar('--estimated', '#5B34C4');
    const muted = cssVar('--muted', '#55544E');
    const border = cssVar('--border', '#D5D3CB');
    const warn = cssVar('--warn', '#9A3F00');
    const dark = cssVar('--bg', '#EEEDE8').toUpperCase() === '#1A1B1E';
    const measured = curve.kind !== 'estimated';
    const lineColor = measured ? paint : est;
    const fill = { color: lineColor, opacity: measured ? (dark ? 0.16 : 0.32) : 0.18 };
    // The dark band under a solid painted line, drawn as its own series just beneath it.
    const roadBand = (data: unknown[], extra: Record<string, unknown> = {}) => ({
      type: 'line', data, showSymbol: false, silent: true, z: 2, tooltip: { show: false },
      lineStyle: { color: band, width: 10, cap: 'round' as const, join: 'round' as const }, ...extra,
    });
    const axisCommon = { axisLine: { lineStyle: { color: border } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: border } }, nameTextStyle: { color: muted } };

    const steps = result?.steps ?? [];
    const elapsedAt = (soc: number) => {
      const s = steps.find((x) => x.soc >= soc - 1e-9);
      return s ? s.elapsedMin : soc <= settings.start ? 0 : steps.at(-1)?.elapsedMin ?? 0;
    };
    // The curve in pieces, cut at the charging window and (B24) the measured span:
    // measured and charging → solid road paint; outside the window → long road-line dashes (B83, owner);
    // estimated or not measured → violet, short dashes inside the window, road-line dashes outside it.
    const cuts = [...new Set([0, 100, settings.start, settings.end, ...(partial ? [span.from, span.to] : [])])]
      .filter((x) => x >= 0 && x <= 100)
      .sort((a, b) => a - b);
    const pieceSeries: Record<string, unknown>[] = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      const [a, b] = [cuts[i], cuts[i + 1]];
      if (b - a < 1e-9) continue;
      const mid = (a + b) / 2;
      const charging = mid >= settings.start && mid <= settings.end;
      const known = measured && (!partial || (mid >= span.from && mid <= span.to));
      const data: [number, number][] = [[a, powerAt(curve.points, a)]];
      for (let s = Math.floor(a) + 1; s < b; s += 1) data.push([s, powerAt(curve.points, s)]);
      data.push([b, powerAt(curve.points, b)]);
      const base = { type: 'line', data, showSymbol: false, z: 3 };
      if (known && charging) {
        pieceSeries.push(roadBand(data), { ...base, lineStyle: { color: paint, width: 4, type: 'solid', cap: 'round' } });
      } else if (known) {
        // Road-line dashes (long paint, long gap) like a lane line; yellow on asphalt, road-band colour on concrete.
        pieceSeries.push({ ...base, lineStyle: { color: dark ? paint : band, width: 3, type: ROAD_DASH, cap: 'butt' } });
      } else {
        pieceSeries.push({ ...base, lineStyle: { color: est, width: charging ? 2.5 : 3, type: charging ? 'dashed' : ROAD_DASH, cap: 'butt' } });
      }
    }
    const tagAt = Math.min(Math.max(50, span.from), span.to);
    const estTag = curve.kind === 'estimated'
      ? { markPoint: { silent: true, symbol: 'circle', symbolSize: 0, label: { show: true, position: 'top' as const, distance: 10, formatter: t('viewer.estimatedTag'), color: est, fontStyle: 'italic' as const }, data: [{ coord: [tagAt, powerAt(curve.points, tagAt)] }] } }
      : {};
    const delivered: [number, number][] = [];
    for (let s = settings.start; s <= settings.end; s += 0.5) delivered.push([s, Math.min(powerAt(curve.points, s), chargerKw ?? Infinity)]);

    const limitLine = chargerKw
      ? { silent: true, symbol: 'none', lineStyle: { color: warn, type: 'dashed' as const }, label: { position: 'insideEndTop' as const, formatter: t('viewer.chargerLimitValue', { kw: formatNumber(chargerKw) }), color: warn }, data: [{ yAxis: chargerKw }] }
      : undefined;

    const option: echarts.EChartsCoreOption =
      xAxis === 'soc'
        ? {
            animation: false,
            grid: { left: 48, right: 16, top: 24, bottom: 44 },
            tooltip: {
              trigger: 'axis',
              formatter: (p: { axisValue: number }[]) => {
                const soc = Math.round(Number(p[0]?.axisValue ?? 0));
                const kw = Math.min(powerAt(curve.points, soc), chargerKw ?? Infinity);
                return t('viewer.tooltip', { soc: formatNumber(soc), kw: formatNumber(kw), min: formatNumber(elapsedAt(soc)) });
              },
            },
            xAxis: { type: 'value', min: 0, max: 100, name: t('viewer.socLabel'), nameLocation: 'middle', nameGap: 28, ...axisCommon },
            yAxis: { type: 'value', min: 0, name: t('viewer.powerLabel'), ...axisCommon },
            series: [
              {
                name: t('viewer.delivered'), type: 'line', data: delivered, showSymbol: false, lineStyle: { width: 0 },
                areaStyle: fill, z: 1,
                // The window guides are stop bars in the text colour; their values show on the slider below.
                markLine: { silent: true, symbol: 'none', lineStyle: { color: text, type: 'solid', width: 2 }, label: { show: false }, data: [{ xAxis: settings.start }, { xAxis: settings.end }] },
              },
              ...pieceSeries,
              // Carries the charger limit line and the "Estimated" tag; draws nothing itself.
              {
                name: t('viewer.carCurve'), type: 'line', data: [[0, null]], showSymbol: false, silent: true, z: 4, tooltip: { show: false },
                lineStyle: { width: 0 },
                ...(limitLine ? { markLine: limitLine } : {}),
                ...estTag,
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
              ...(measured && !result?.extrapolated ? [roadBand(steps.map((s) => [s.elapsedMin, s.deliveredKw]), { step: 'end' })] : []),
              {
                name: t('viewer.delivered'), type: 'line', step: 'end', showSymbol: false, z: 3,
                data: steps.map((s) => [s.elapsedMin, s.deliveredKw]),
                lineStyle: measured && !result?.extrapolated
                  ? { color: lineColor, width: 4, type: 'solid', cap: 'round' }
                  : { color: lineColor, width: 2.5, type: 'dashed' },
                areaStyle: fill,
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
  // B92: only measured curves are offered, named by their source and year.
  const choices = curveChoices(curves);
  const curveOptionLabel = (c: CurveOut) => {
    const src = sources.find((s) => s.id === c.source_id)?.title ?? kindLabel(c.kind);
    const year = curveYear(c);
    return year ? t('viewer.option.measuredYear', { source: src, year }) : src;
  };

  // Two overlapping range inputs make one start/end slider (B83). When the handles meet, the one that
  // can still move away from the other sits on top.
  const startOnTop = settings.start >= settings.end - 1 && settings.start > 50;
  const figure = (label: ReactNode, value: ReactNode, title?: string) => (
    <div className="readout" title={title}><dt className="readout-label">{label}</dt><dd className="readout-value">{value}</dd></div>
  );

  return (
    <div className="viewer card">
      <div className="answer" aria-live="polite">
        {result ? (
          <>
            <p className="answer-line">
              <span className="answer-label">{t('viewer.result.time', { start: settings.start, end: settings.end })}</span>{' '}
              <span className="answer-time">{minutes(result.minutes)}</span>
            </p>
            <dl className="readouts figures">
              {figure(t('viewer.result.km', { basis: t(`viewer.basis.${basis}` as MessageKey) }),
                result.kmAdded !== null ? `${estimated ? '~' : ''}${distance(result.kmAdded)}` : <span className="unknown small">{t('viewer.result.noConsumption')}</span>)}
              {figure(t('viewer.result.per10'),
                result.kmPer10Min !== null ? `${estimated ? '~' : ''}${distance(result.kmPer10Min)}` : <span className="unknown small">{t('badge.unknown')}</span>)}
              {figure(t('viewer.result.added'), `${batteryIsGross ? '~' : ''}${t('fmt.kwh', { value: formatNumber(result.energyKwh, 1) })}`)}
              {figure(t('viewer.result.avg'), t('fmt.kw', { value: formatNumber(result.averageKw) }))}
              {figure(t('viewer.result.cost', { start: settings.start, end: settings.end }), `~${money.format(drawnKwh * settings.price)}`,
                t('viewer.result.costNote', { kwh: formatNumber(drawnKwh, 1), loss: Math.round((1 - COST.dcEfficiency) * 100) }))}
              {chargerKw !== null && result.lostToChargerMinutes > 0.05 &&
                figure(t('viewer.result.lost'), t('viewer.result.lostValue', { value: formatNumber(result.lostToChargerMinutes), kw: chargerKw }))}
            </dl>
          </>
        ) : (
          <p className="unknown">{t('badge.unknown')}</p>
        )}
      </div>

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
      {partial && <p className="banner small estimated">{t('viewer.extendedNote', { from: formatNumber(span.from), to: formatNumber(span.to) })}</p>}

      <div className="plot panel">
        <div className="chart-head">
          <span id={`${uid}-axis`} className="seg-label">{t('viewer.xAxis')}</span>
          <div className="seg" role="group" aria-labelledby={`${uid}-axis`}>
            {(['soc', 'time'] as const).map((x) => (
              <button key={x} type="button" aria-pressed={xAxis === x} onClick={() => setXAxis(x)}>{t(`viewer.axis.${x}` as MessageKey)}</button>
            ))}
          </div>
        </div>
        <div ref={chartEl} className="chart" role="img" aria-label={t('viewer.chartAlt', { kw: formatNumber(Math.max(...curve.points.map((p) => p.power_kw))) })} />
        <div className="window">
          <div className="window-labels" aria-hidden="true">
            <span>{t('viewer.start')}: {settings.start}%</span>
            <span>{t('viewer.end')}: {settings.end}%</span>
          </div>
          <div className="power-track">
            <div className="power-rail" aria-hidden="true" />
            <div className="power-fill" aria-hidden="true" style={{ left: `${settings.start}%`, width: `${settings.end - settings.start}%` }} />
            <input
              type="range" min={0} max={100} step={1} value={settings.start} aria-label={t('viewer.start')} aria-valuetext={`${settings.start}%`}
              style={{ zIndex: startOnTop ? 3 : 2 }}
              onChange={(e) => update({ start: Math.min(Number(e.target.value), settings.end) })}
            />
            <input
              type="range" min={0} max={100} step={1} value={settings.end} aria-label={t('viewer.end')} aria-valuetext={`${settings.end}%`}
              onChange={(e) => update({ end: Math.max(Number(e.target.value), settings.start) })}
            />
          </div>
        </div>
      </div>

      <p className="small muted curve-note">
        {t('viewer.curveFrom', { kind: curve.based_on ? t('viewer.option.borrowed') : kindLabel(curve.kind) })}
        {source && <> <a href={source.url} target="_blank" rel="noopener">{source.title}</a> <SourceRef n={source.n} /></>}
        {' · '}{t('viewer.warm')}
        {result && <> {t('viewer.result.costNote', { kwh: formatNumber(drawnKwh, 1), loss: Math.round((1 - COST.dcEfficiency) * 100) })}. </>}
        <span id="price-help">{t('viewer.priceHelp')}</span>
      </p>

      <div className="controls">
        {choices.length > 1 && (
          <label className="curve-pick">
            <span>{t('viewer.curve')}</span>
            <select value={curve.id} onChange={(e) => setCurveId(e.target.value)}>
              {choices.map((c) => (
                <option key={c.id} value={c.id}>{curveOptionLabel(c)}</option>
              ))}
            </select>
          </label>
        )}
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
                update(Number.isFinite(kw) ? { preset: 'custom', customKw: kw } : { preset: 'none' });
              }}
            />
          </div>
          <ol className="power-ticks" aria-hidden="true">
            {CHARGER_STOPS.map((kw, i) => (
              <li key={i} style={{ left: stopPct(i) }}>{Number.isFinite(kw) ? formatNumber(kw) : t('map.power.maxStop')}</li>
            ))}
          </ol>
          {chargerKw != null && (
            <p className="find-chargers small">
              <a href={mapLink(chargerKw, mapPlugs)}>{t('viewer.findChargers')}</a>
            </p>
          )}
        </div>
        <label>
          <span>{t('viewer.rangeBasis')}</span>
          <select value={basis} onChange={(e) => setBasis(e.target.value as Basis)}>
            {(['highway', 'combined', 'city'] as Basis[]).map((b) => <option key={b} value={b}>{t(`viewer.basis.${b}` as MessageKey)}</option>)}
          </select>
        </label>
        {extraControls}
        <div className="seg-field">
          <span id={`${uid}-units`} className="seg-label">{t('viewer.units')}</span>
          <div className="seg" role="group" aria-labelledby={`${uid}-units`}>
            {(['km', 'mi'] as const).map((u) => (
              <button key={u} type="button" aria-pressed={unit === u} onClick={() => switchUnit(u)}>{t(`units.${u}` as MessageKey)}</button>
            ))}
          </div>
        </div>
        <label title={t('viewer.priceHelp')}>
          <span>{t('viewer.price')}</span>
          <input
            type="number" inputMode="decimal" min={0} max={5} step={0.01}
            value={settings.price}
            aria-describedby="price-help"
            onChange={(e) => { const price = Math.max(0, Number(e.target.value) || 0); update({ price }); setChargePrice(price); }}
          />
        </label>
        {climateControls}
      </div>

      <details className="more">
        <summary>{t('viewer.moreDetail')}</summary>
        {result && (
          <ul>
            <li>{t('viewer.peak', { kw: formatNumber(result.peakKw), soc: formatNumber(result.peakAtSoc) })}</li>
            {([100, 150, 200] as const).map((k) => <li key={k}>{t('viewer.above', { kw: k })}: {t('fmt.min', { value: formatNumber(result.minutesAbove[k], 1) })}</li>)}
          </ul>
        )}
        {(curve.notes || curve.basis) && <p className="small"><strong>{t('viewer.notes')}:</strong> {curve.basis ?? curve.notes}</p>}
        {curve.conditions && <p className="small"><strong>{t('viewer.conditions')}:</strong> {Object.entries(curve.conditions).map(([k, v]) => t(`condition.${k}` as MessageKey, { value: typeof v === 'number' ? formatNumber(v) : t(`condition.value.${String(v)}` as MessageKey) })).join(' · ')}</p>}
        <table className="points">
          <caption className="small muted">{t('viewer.points')} · {t('viewer.chartTable')}</caption>
          <thead><tr><th>{t('viewer.pointSoc')}</th><th>{t('viewer.pointKw')}</th></tr></thead>
          <tbody>{curve.points.map((p) => <tr key={p.soc_percent}><td>{formatNumber(p.soc_percent)}</td><td>{formatNumber(p.power_kw, 1)}</td></tr>)}</tbody>
        </table>
      </details>

      <style>{`
        .viewer { display: grid; gap: 16px; }

        /* B83: the answer leads, in the display face; the other results are one quiet row. */
        .viewer .answer-line { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 10px; row-gap: 2px; }
        .viewer .answer-label { font-family: var(--display); font-weight: 700; font-size: 1.1rem; color: var(--muted); letter-spacing: -0.01em; }
        .viewer .answer-time { font-family: var(--display); font-weight: 800; font-size: clamp(1.9rem, 5vw, 2.6rem); line-height: 1.05; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
        /* The chart sits on its own raised panel with its axis switch on top and the window slider under it. */
        .viewer .figures { margin-top: 12px; }
        .viewer .plot { display: grid; gap: 4px; padding: 12px 12px 10px; }
        .viewer .chart-head { display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
        .viewer .seg-label { font-size: 0.875rem; color: var(--muted); }
        .viewer .seg-field { display: grid; gap: 4px; min-width: 0; }
        .viewer .seg-field .seg button { flex: 1 1 0; }
        .viewer .power-rail { background: var(--field-border); }
        .viewer .chart { width: 100%; height: 320px; }
        .viewer .window { padding: 0 16px 0 48px; } /* = the chart grid's left/right, so 0-100 % lines up */
        .viewer .window .power-track { margin: 0; }
        .viewer .window-labels { display: flex; justify-content: space-between; font-size: 0.875rem; font-weight: 600; font-variant-numeric: tabular-nums; margin-bottom: 2px; }

        .viewer .charger-pick { grid-column: span 2; display: grid; gap: 2px; min-width: 0; padding-right: 8px; }
        .viewer .charger-words { display: block; font-size: 0.875rem; color: var(--muted); }
        /* Every tick sits centred on its handle (the map pins the end ticks to the rail ends); the track's 9 px margin and the padding make room. */
        .viewer .charger-pick .power-ticks li { transform: translateX(-50%); }
        .viewer .charger-pick strong { color: var(--text); font-weight: 650; font-variant-numeric: tabular-nums; }
        .viewer .charger-pick .find-chargers { margin: 4px 0 0; }

        .viewer .curve-note { margin: 0; }

        .viewer .controls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px 16px; align-items: start; padding-top: 16px; border-top: 1px solid var(--border); }
        .viewer .controls > * { min-width: 0; }
        .viewer .curve-pick { grid-column: span 2; }
        /* B116: outside temperature and its °C/°F switch share two columns; the notes run under both. */
        .viewer .temp-pick { grid-column: span 2; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 16px; align-items: start; min-width: 0; }
        .viewer .temp-input { display: flex; align-items: center; gap: 6px; }
        .viewer .temp-input input { flex: 1 1 auto; }
        .viewer .temp-unit { color: var(--text); font-weight: 600; }
        .viewer .temp-notes { grid-column: 1 / -1; margin: 0; display: grid; gap: 2px; }
        .viewer .temp-change { color: var(--text); font-weight: 600; }
        .viewer .control-note { display: block; font-size: 0.8rem; color: var(--muted); }
        .viewer .control-note.linkish { padding: 0; border: 0; background: none; color: var(--accent); font: inherit; font-size: 0.8rem; font-weight: 600; text-align: left; cursor: pointer; text-decoration: underline; }
        .viewer label { display: grid; gap: 4px; font-size: 0.875rem; color: var(--muted); min-width: 0; }
        .viewer input[type=number] { font: inherit; color: var(--text); background: var(--surface); border: 1px solid var(--field-border); border-radius: 8px; padding: 6px 8px; width: 100%; min-width: 0; text-overflow: ellipsis; }

        @media (max-width: 640px) {
          .viewer { gap: 12px; padding: 14px; }
          .viewer .chart { height: 240px; }
          .viewer .controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .viewer .figures { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
          .viewer .figures .readout { padding: 8px 10px; }
          .viewer .figures .readout-value { font-size: 1rem; }
          .viewer .plot { padding: 8px 6px 8px; }
        }
        @media (max-width: 400px) {
          .viewer .figures { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .viewer .more summary { cursor: pointer; font-weight: 600; }
        .viewer .points { max-width: 320px; margin-top: 8px; }
        .viewer .points caption { text-align: left; }
      `}</style>
    </div>
  );
}
