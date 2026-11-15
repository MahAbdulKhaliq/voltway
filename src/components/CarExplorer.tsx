// The Charging tab (database-ui.md §2, §5; decision B11): Make → Model → Year → Variant → Trim
// dropdowns, then key figures, the curve viewer, specs, trims and sources for that car,
// all on one screen. The URL follows the choice (/charging?car=…) so it can be shared.

import { useEffect, useMemo, useState } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import { COVERAGE } from '../config.ts';
import { displayMinutes } from '../lib/charging.ts';
import { getItem, setItem, KEYS } from '../lib/storage.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import type { CarDetail, Field, IndexEntry } from '../lib/types.ts';
import { applyWheelEffect, type WheelEffect } from '../lib/wheel-effect.ts';
import { display } from '../lib/format.ts';
import CurveViewer from './CurveViewer.tsx';
import { Badge, Value } from './react/Badge.tsx';

interface Props { index: IndexEntry[]; wheelEffect: WheelEffect | null }

const LAST_CAR = 'voltway.lastCar';
const uniq = <T,>(xs: T[]) => [...new Set(xs)];
const byName = (a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' });

/** Trim names repeat the variant ("eDrive40 Gran Coupe (18″ Wheels)"); the dropdown shows only what differs. */
export function trimLabel(trim: string, variant: string): string {
  if (trim === variant) return trim;
  const rest = trim.startsWith(variant) ? trim.slice(variant.length).trim().replace(/^\((.*)\)$/, '$1') : '';
  return rest || trim;
}

const GROUPS: { title: MessageKey; fields: string[] }[] = [
  { title: 'group.battery', fields: ['capacity_usable_kwh', 'capacity_gross_kwh', 'chemistry', 'nominal_voltage_class', 'preconditioning'] },
  { title: 'group.charging', fields: ['dc_max_kw', 'ac_max_kw', 'published_10_80_min', 'recharge_time_240v_h'] },
  { title: 'group.efficiency', fields: ['range_km', 'consumption_combined_wh_per_km', 'consumption_city_wh_per_km', 'consumption_highway_wh_per_km'] },
  { title: 'group.ports', fields: ['charge_port', 'supercharger_access'] },
];

export default function CarExplorer({ index, wheelEffect }: Props) {
  const cars = useMemo(() => index.filter((e) => e.sold_in_canada), [index]);
  const [carId, setCarId] = useState<string | null>(null);
  const [trimId, setTrimId] = useState<string | null>(null);
  const [car, setCar] = useState<CarDetail | null>(null);
  const [error, setError] = useState(false);
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [wheelIn, setWheelIn] = useState<number | null>(null); // null = the trim's rated wheels
  useEffect(() => setWheelIn(null), [carId, trimId]);

  // First car: the link (?car=), else the last one viewed, else the first in the list.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wanted = params.get('car') ?? getItem(LAST_CAR);
    const first = cars.find((c) => c.id === wanted) ?? [...cars].sort((a, b) => byName(a.make, b.make) || byName(a.model, b.model))[0];
    setCarId(first?.id ?? null);
    setTrimId(params.get('trim'));
    setUnit(getItem(KEYS.units) === 'mi' ? 'mi' : 'km');
    const onUnits = (e: Event) => setUnit((e as CustomEvent<DistanceUnit>).detail);
    window.addEventListener('voltway:units', onUnits);
    return () => window.removeEventListener('voltway:units', onUnits);
  }, [cars]);

  // Load the chosen car; keep the URL and "last car" in step.
  useEffect(() => {
    if (!carId) return;
    let alive = true;
    setError(false);
    fetch(`/data/cars/${carId}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((c: CarDetail) => {
        if (!alive) return;
        setCar(c);
        setTrimId((tr) => (c.trims.some((x) => x.id === tr) ? tr : c.trims[0]?.id ?? null));
      })
      .catch(() => alive && setError(true));
    setItem(LAST_CAR, carId);
    return () => { alive = false; };
  }, [carId]);

  useEffect(() => {
    if (!carId) return;
    // Built by hand so the car id keeps readable slashes (/charging?car=make/model/year/variant).
    const trimPart = trimId && car && car.trims.length > 1 ? `&trim=${encodeURIComponent(trimId)}` : '';
    history.replaceState(null, '', `/charging?car=${carId.split('/').map(encodeURIComponent).join('/')}${trimPart}`);
  }, [carId, trimId, car]);

  // Dropdown options, each level narrowed by the one above.
  const current = cars.find((c) => c.id === carId);
  const makes = uniq(cars.map((c) => c.make)).sort(byName);
  const models = current ? uniq(cars.filter((c) => c.make === current.make).map((c) => c.model)).sort(byName) : [];
  const years = current ? uniq(cars.filter((c) => c.make === current.make && c.model === current.model).map((c) => c.year)).sort((a, b) => b - a) : [];
  const variants = current ? cars.filter((c) => c.make === current.make && c.model === current.model && c.year === current.year).sort((a, b) => byName(a.name, b.name)) : [];

  const pick = (make: string, model?: string, year?: number) => {
    const pool = cars.filter((c) => c.make === make && (!model || c.model === model) && (!year || c.year === year));
    const sorted = [...pool].sort((a, b) => byName(a.model, b.model) || b.year - a.year || byName(a.name, b.name));
    if (sorted[0]) { setCarId(sorted[0].id); setTrimId(null); }
  };

  const loading = !car || car.id !== carId;
  const trim = car?.trims.find((x) => x.id === trimId) ?? car?.trims[0];
  const f = car?.fields ?? {};
  const label = (k: string) => t(`field.${k}` as MessageKey);
  const usable = f.capacity_usable_kwh ?? null;
  const battery = usable ?? f.capacity_gross_kwh ?? null;
  const ac: Field = trim?.ac_max_kw ?? f.ac_max_kw ?? null;
  // Figures rated for this trim when it has its own rating, else the variant's.
  const rated: Record<string, Field> = {
    range_km: trim?.range_km ?? f.range_km ?? null,
    consumption_combined_wh_per_km: trim?.consumption_combined_wh_per_km ?? f.consumption_combined_wh_per_km ?? null,
    consumption_city_wh_per_km: trim?.consumption_city_wh_per_km ?? f.consumption_city_wh_per_km ?? null,
    consumption_highway_wh_per_km: trim?.consumption_highway_wh_per_km ?? f.consumption_highway_wh_per_km ?? null,
  };
  // Wheel size (B13): the trim's rated wheels are the baseline; another size gives a rough estimate.
  const baseWheel = trim?.wheels.find((w) => w.is_standard) ?? trim?.wheels[0];
  const baseIn = baseWheel?.diameter_in ?? null;
  const chosenIn = wheelIn ?? baseIn;
  const adjusting = Boolean(wheelEffect && baseIn !== null && chosenIn !== null && chosenIn !== baseIn);
  const factor = adjusting ? applyWheelEffect(baseIn!, chosenIn!, wheelEffect!, {}).factor : 1;
  const pct = (x: number) => formatNumber(x * 100, 1);
  const basis = wheelEffect
    ? t('wheel.basis', { size: chosenIn ?? '', base: baseIn ?? '', pct: pct(wheelEffect.pct_per_inch), low: pct(wheelEffect.low), high: pct(wheelEffect.high), pairs: wheelEffect.pairs })
    : '';
  const estimate = (k: string): Field => {
    const r = rated[k];
    if (!adjusting || !r || typeof r.value.value !== 'number') return r;
    const v = k === 'range_km' ? r.value.value / factor : r.value.value * factor;
    return {
      value: { value: Math.round(v * 10) / 10, unit: r.value.unit, kind: 'estimated', source_id: wheelEffect!.source_ids[0] ?? r.value.source_id, notes: basis },
      others: [r.value, ...r.others],
      conflict: false,
    };
  };
  const shown: Record<string, Field> = Object.fromEntries(Object.keys(rated).map((k) => [k, estimate(k)]));
  const range = shown.range_km;
  const ratedLine = (k: string) =>
    adjusting && rated[k] ? <span className="rated">{t('tile.rated', { value: display(rated[k]!.value, unit).text })}</span> : null;
  const factorySizes = new Set((car?.trims ?? []).flatMap((x) => x.wheels.map((w) => w.diameter_in)));
  const officialTrim = adjusting ? car?.trims.find((x) => x.id !== trim?.id && x.wheels.some((w) => w.diameter_in === chosenIn) && (x.range_km || x.consumption_combined_wh_per_km)) : undefined;
  const sizes =
    baseIn !== null
      ? [...new Set([...Array.from({ length: 11 }, (_, i) => 14 + i), baseIn, ...factorySizes])].sort((a, b) => a - b)
      : [];
  const defaultCurve = car?.curves.find((c) => c.is_display_default);
  const curveField: Field = defaultCurve
    ? { value: { value: 0, kind: defaultCurve.kind, source_id: defaultCurve.source_id, notes: defaultCurve.basis ?? defaultCurve.notes }, others: [], conflict: false }
    : null;
  const d = car?.derived;
  const distance = (km: number) => t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(km, unit)) });
  const sources = car?.sources ?? [];

  return (
    <div className="explorer">
      <section className="card picker" aria-labelledby="pick">
        <h2 id="pick">{t('charging.selectVehicle')}</h2>
        <div className="selects">
          <label><span>{t('charging.make')}</span>
            <select value={current?.make ?? ''} onChange={(e) => pick(e.target.value)}>
              {makes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label><span>{t('charging.model')}</span>
            <select value={current?.model ?? ''} onChange={(e) => current && pick(current.make, e.target.value)}>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label><span>{t('charging.year')}</span>
            <select value={current?.year ?? ''} onChange={(e) => current && pick(current.make, current.model, Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label><span>{t('charging.variant')}</span>
            <select value={carId ?? ''} onChange={(e) => { setCarId(e.target.value); setTrimId(null); }}>
              {variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
          <label><span>{t('charging.trim')}</span>
            <select value={trim?.id ?? ''} disabled={!car || car.trims.length < 2} onChange={(e) => setTrimId(e.target.value)}>
              {(car?.trims ?? []).map((x) => <option key={x.id} value={x.id}>{trimLabel(x.name, car?.name ?? "")}</option>)}
            </select>
          </label>
        </div>
      </section>

      {error && <p className="banner">{t('charging.loadError')}</p>}
      {!error && loading && <p className="muted">{t('charging.loading')}</p>}

      {!error && !loading && car && (
        <>
          <header className="car-head">
            <p className="muted eyebrow">{car.year} · {car.make.name} · {t(`body.${car.model.body_type}` as MessageKey)} · {t(`value.${car.drivetrain}` as MessageKey)}</p>
            <h1>{car.model.name} <span className="variant">{car.name}</span></h1>
          </header>
          {!car.sold_in_canada && <p className="banner">{t('car.notInMarket', { market: COVERAGE.market, regulator: COVERAGE.regulatorShort })}</p>}

          <section aria-labelledby="key">
            <h2 id="key" className="sr-only">{t('car.keyFigures')}</h2>
            <div className="tiles">
              <div className="tile card"><p className="tl">{t('tile.range')}</p><p className="tv"><Value field={range} sources={sources} label={t('tile.range')} unit={unit} approx={adjusting} />{ratedLine('range_km')}</p></div>
              <div className="tile card"><p className="tl">{t('tile.efficiency')}</p><p className="tv"><Value field={shown.consumption_combined_wh_per_km} sources={sources} label={t('tile.efficiency')} unit={unit} approx={adjusting} />{ratedLine('consumption_combined_wh_per_km')}</p></div>
              <div className="tile card wheels"><p className="tl">{t('wheel.label')}</p><div className="tv">
                {baseIn !== null && wheelEffect ? (
                  <>
                    <select value={chosenIn ?? ''} onChange={(e) => setWheelIn(Number(e.target.value))} aria-label={t('wheel.label')}>
                      {sizes.map((n) => (
                        <option key={n} value={n}>
                          {n === baseIn ? t('wheel.rated', { size: n }) : factorySizes.has(n) ? t('wheel.factory', { size: n }) : t('wheel.option', { size: n })}
                        </option>
                      ))}
                    </select>
                    {baseWheel?.tire_size && <span className="rated">{t('wheel.tire', { tire: baseWheel.tire_size })}</span>}
                    {adjusting && <span className="rated">{t('wheel.change', { pct: (factor >= 1 ? '+' : '') + pct(factor - 1) })}</span>}
                    {officialTrim && (
                      <button type="button" className="linkish" onClick={() => setTrimId(officialTrim.id)}>{t('wheel.useOfficial', { trim: trimLabel(officialTrim.name, car?.name ?? '') })}</button>
                    )}
                  </>
                ) : (
                  <><span className="unknown">{t('badge.unknown')}</span><span className="rated">{t('wheel.unknownHelp')}</span></>
                )}
              </div></div>
              <div className="tile card"><p className="tl">{usable ? t('tile.battery') : t('tile.batteryGross')}</p><p className="tv"><Value field={battery} sources={sources} label={t('tile.battery')} unit={unit} /></p></div>
              <div className="tile card"><p className="tl">{t('tile.dcPeak')}</p><p className="tv"><Value field={f.dc_max_kw ?? null} sources={sources} label={t('tile.dcPeak')} unit={unit} /></p></div>
              <div className="tile card"><p className="tl">{t('tile.time1080')}</p><p className="tv">
                {d && d.minutes_10_80 !== null ? (
                  <span className="fv">{d.estimated ? t('fmt.approxMin', { value: displayMinutes(d.minutes_10_80, true) }) : t('fmt.min', { value: displayMinutes(d.minutes_10_80, false) })} <Badge field={curveField} sources={sources} label={t('tile.time1080')} unit={unit} /></span>
                ) : <span className="unknown">{t('badge.unknown')}</span>}
              </p></div>
              <div className="tile card"><p className="tl">{t('tile.kmPer10')}</p><p className="tv">
                {d && d.km_per_10_min !== null ? (
                  <span className="fv">{d.estimated || adjusting ? '~' : ''}{distance(d.km_per_10_min / factor)} <Badge field={curveField} sources={sources} label={t('tile.kmPer10')} unit={unit} /></span>
                ) : <span className="unknown">{t('badge.unknown')}</span>}
              </p></div>
            </div>
          </section>

          <section aria-labelledby="curve">
            <h2 id="curve">{t('car.curve')}</h2>
            {car.curves.length ? (
              <CurveViewer
                key={car.id}
                curves={car.curves}
                usableKwh={(battery?.value.value as number) ?? null}
                batteryIsGross={!usable && Boolean(f.capacity_gross_kwh)}
                consumption={{
                  highway: (shown.consumption_highway_wh_per_km?.value.value as number) ?? null,
                  combined: (shown.consumption_combined_wh_per_km?.value.value as number) ?? null,
                  city: (shown.consumption_city_wh_per_km?.value.value as number) ?? null,
                }}
                sources={sources.map((s) => ({ id: s.id, title: s.title, url: s.url }))}
              />
            ) : <p className="card muted">{t('car.noCurve')}</p>}
          </section>

          <section aria-labelledby="specs">
            <h2 id="specs">{t('car.specs')}</h2>
            <div className="spec-grid">
              {GROUPS.map((g) => (
                <div className="card" key={g.title}>
                  <h3>{t(g.title)}</h3>
                  <table className="stack-table">
                    <tbody>
                      {g.fields.map((k) => {
                        const field: Field = k in shown ? shown[k] : k === 'ac_max_kw' ? ac : f[k] ?? null;
                        return <tr key={k}><th scope="row">{label(k)}</th><td data-label={label(k)}><Value field={field} sources={sources} label={label(k)} unit={unit} approx={adjusting && k in shown} />{k in shown && ratedLine(k)}</td></tr>;
                      })}
                      {g.title === 'group.ports' && (
                        <tr><th scope="row">{t('field.heat_pump')}</th><td data-label={t('field.heat_pump')}><Value field={trim?.heat_pump ?? null} sources={sources} label={t('field.heat_pump')} unit={unit} /></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="trims">
            <h2 id="trims">{t('car.trims')}</h2>
            <div className="card">
              <table className="stack-table">
                <thead><tr><th>{t('car.trimName')}</th><th>{t('field.heat_pump')}</th><th>{t('car.wheels')}</th><th>{t('car.trimRange')}</th></tr></thead>
                <tbody>
                  {car.trims.map((x) => (
                    <tr key={x.id} className={x.id === trim?.id ? 'current' : ''}>
                      <td data-label={t('car.trimName')}>{x.name}</td>
                      <td data-label={t('field.heat_pump')}><Value field={x.heat_pump} sources={sources} label={t('field.heat_pump')} unit={unit} /></td>
                      <td data-label={t('car.wheels')}>{x.wheels.length ? x.wheels.map((w) => t(w.is_standard ? 'car.wheelStandard' : 'car.wheelSize', { size: w.diameter_in })).join(', ') : <span className="unknown">{t('badge.unknown')}</span>}</td>
                      <td data-label={t('car.trimRange')}>{x.range_km ? <Value field={x.range_km} sources={sources} label={t('car.trimRange')} unit={unit} /> : <span className="muted">{t('car.sameAsVariant')}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="sources">
            <h2 id="sources">{t('car.sources')}</h2>
            <p className="muted">{t('car.sourcesIntro')}</p>
            <ul className="sources">
              {sources.map((s) => (
                <li key={s.id}>
                  <a href={s.url} rel="noopener" target="_blank">{s.title}</a>
                  <span className="muted small"> · {t('badge.accessed', { date: s.accessed_on })}{s.license && <> · {t('car.licence', { licence: s.license })}</>}</span>
                </li>
              ))}
            </ul>
            <p className="small"><a href="https://github.com/MahAbdulKhaliq/voltway/issues" rel="noopener" target="_blank">{t('car.reportProblem')}</a></p>
          </section>
        </>
      )}

      <style>{`
        .explorer { display: grid; gap: 24px; }
        .explorer .picker h2 { font-size: 1.05rem; }
        .explorer .selects { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
        .explorer .selects label { display: grid; gap: 4px; font-size: 0.875rem; color: var(--muted); min-width: 0; }
        .explorer .selects select { font: inherit; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; width: 100%; min-width: 0; text-overflow: ellipsis; }
        .explorer .selects select:disabled { opacity: 0.6; }
        .explorer .eyebrow { margin: 0 0 4px; font-size: 0.9rem; }
        .explorer .variant { color: var(--muted); font-weight: 500; }
        .explorer .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 12px; }
        .explorer .tile { padding: 14px 16px; }
        .explorer .tl { margin: 0 0 6px; color: var(--muted); font-size: 0.85rem; }
        .explorer .tv { margin: 0; font-size: 1.25rem; font-weight: 650; }
        .explorer .tv .badge { font-weight: 400; }
        .explorer .linkish { display: block; margin-top: 6px; padding: 0; border: 0; background: none; color: var(--accent); font: inherit; font-size: 0.8rem; font-weight: 600; text-align: left; cursor: pointer; text-decoration: underline; }
        .explorer .rated { display: block; font-size: 0.8rem; font-weight: 400; color: var(--muted); margin-top: 4px; }
        .explorer .wheels select { font: inherit; font-size: 1rem; color: var(--text); background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 4px 8px; width: 100%; }
        .explorer .spec-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
        .explorer .spec-grid th { width: 46%; }
        .explorer tr.current td:first-child { font-weight: 650; }
        .explorer .sources { padding-left: 18px; }
        .explorer .sources li { margin-bottom: 6px; }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      `}</style>
    </div>
  );
}
