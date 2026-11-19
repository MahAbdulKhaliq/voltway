// The Charging tab (database-ui.md §2, §5; decision B11): Make → Model → Year → Variant → Trim
// dropdowns, then key figures, the curve viewer, specs, trims and sources for that car,
// all on one screen. The URL follows the choice (/charging?car=…) so it can be shared.

import { useEffect, useMemo, useState } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import { COVERAGE } from '../config.ts';
import { displayMinutes } from '../lib/charging.ts';
import { getItem, KEYS } from '../lib/storage.ts';
import { formatNumber, kmTo, type DistanceUnit } from '../lib/units.ts';
import type { CarDetail, Field, IndexEntry } from '../lib/types.ts';
import { applyWheelEffect, ratedOnItsOwn, ratedWheelFor, standardWheel, type WheelEffect } from '../lib/wheel-effect.ts';
import { display } from '../lib/format.ts';
import CurveViewer from './CurveViewer.tsx';
import { carMapInfo, linkPlugs } from '../lib/map-filter.ts';
import { GROUPS } from '../lib/spec-groups.ts';
import { carLabel } from '../lib/car-label.ts';
import { addToCompare, getCompare, getMyCar, setMyCar, type AddResult, type MyCar } from '../lib/my-car.ts';
import { Badge, Value, sourceNumber } from './react/Badge.tsx';
import { Accordion } from './react/Accordion.tsx';
import VariantName from './VariantName.tsx';
import { splitVariantName } from '../lib/variant-name.ts';
import { linkWindowFrom } from '../lib/trip-link.ts';

interface Props { index: IndexEntry[]; wheelEffect: WheelEffect | null }

const uniq = <T,>(xs: T[]) => [...new Set(xs)];
const byName = (a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' });

/** Trim names repeat the variant ("eDrive40 Gran Coupe (18″ Wheels)"); the dropdown shows only what differs. */
export function trimLabel(trim: string, variant: string): string {
  if (trim === variant) return trim;
  const rest = trim.startsWith(variant) ? trim.slice(variant.length).trim().replace(/^\((.*)\)$/, '$1') : '';
  return rest || trim;
}

export default function CarExplorer({ index, wheelEffect }: Props) {
  const cars = useMemo(() => index.filter((e) => e.sold_in_canada), [index]);
  const [carId, setCarId] = useState<string | null>(null);
  const [trimId, setTrimId] = useState<string | null>(null);
  const [car, setCar] = useState<CarDetail | null>(null);
  const [error, setError] = useState(false);
  const [unit, setUnit] = useState<DistanceUnit>('km');
  const [wheelIn, setWheelIn] = useState<number | null>(null); // null = the trim's rated wheels
  const [pickerOpen, setPickerOpen] = useState(false); // B18: closed once a car is chosen
  const [linkMissing, setLinkMissing] = useState(false); // a ?car= link that matches no car
  const [myCar, setMyCarState] = useState<MyCar | null>(null);
  const [compare, setCompareList] = useState<string[]>([]);
  const [compareNote, setCompareNote] = useState<AddResult | null>(null);
  // B31: "How fast would my car charge here?" links carry the station's top DC kW (?kw=) for this car only.
  const [linkKw, setLinkKw] = useState<{ carId: string; kw: number } | null>(null);
  const [linkWindow, setLinkWindow] = useState<{ carId: string; start: number; end: number } | null>(null);
  useEffect(() => setWheelIn(null), [carId, trimId]);

  // First car: the link (?car=), else My car, else the first car in the list (B58: no first-load
  // picker; cars are chosen in the header's car dialog). An empty ?car= counts as no link (TD-P4).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const linked = params.get('car') || null;
    const mine = getMyCar();
    const known = (id: string | null | undefined) => Boolean(id && cars.some((c) => c.id === id));
    setMyCarState(mine);
    setCompareList(getCompare());
    setLinkMissing(known(linked) ? false : Boolean(linked));
    if (known(linked)) {
      setCarId(linked);
      setTrimId(params.get('trim'));
      const kw = Number(params.get('kw'));
      if (params.has('kw') && Number.isFinite(kw) && kw >= 1 && kw <= 1000) setLinkKw({ carId: linked!, kw: Math.round(kw) });
      // A trip stop's window (3.12): ?from=<arrival %>&to=<charge-to %>.
      const win = linkWindowFrom(params);
      if (win) setLinkWindow({ carId: linked!, ...win });
    } else if (known(mine?.carId)) {
      setCarId(mine!.carId);
      setTrimId(mine!.trimId);
    } else {
      setCarId(cars[0]?.id ?? null);
      setTrimId(null);
    }
    setUnit(getItem(KEYS.units) === 'mi' ? 'mi' : 'km');
    const onUnits = (e: Event) => setUnit((e as CustomEvent<DistanceUnit>).detail);
    const onMine = (e: Event) => {
      const mine = (e as CustomEvent<MyCar | null>).detail;
      setMyCarState(mine);
      // "Forget my car" (QP5, B58): back to the first car in the list.
      if (mine === null) {
        setCarId(cars[0]?.id ?? null);
        setTrimId(null);
        history.replaceState(null, '', '/charging');
      } else if (known(mine.carId)) {
        // Picked in the header's car dialog (B54): show that car here too.
        setCarId(mine.carId);
        setTrimId(mine.trimId);
      }
    };
    const onCompare = (e: Event) => setCompareList((e as CustomEvent<string[]>).detail);
    window.addEventListener('voltway:units', onUnits);
    window.addEventListener('voltway:mycar', onMine);
    window.addEventListener('voltway:compare', onCompare);
    return () => {
      window.removeEventListener('voltway:units', onUnits);
      window.removeEventListener('voltway:mycar', onMine);
      window.removeEventListener('voltway:compare', onCompare);
    };
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
    if (sorted[0]) { setCarId(sorted[0].id); setTrimId(null); setLinkMissing(false); }
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
  // Wheel size (B13): the wheels the shown rating belongs to are the baseline (the trim's own when it
  // is rated on its own, else the variant's); the trim's wheels or a picked size give a rough estimate.
  const baseWheel = trim?.wheels.find((w) => w.is_standard) ?? trim?.wheels[0];
  const baseIn = car && trim ? ratedWheelFor(car.trims, trim) : null;
  const chosenIn = wheelIn ?? baseWheel?.diameter_in ?? baseIn;
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
  // B24: when the 10–80 % window reaches past the measured points, the tiles' figures are estimated.
  const extended = Boolean(car?.derived.extrapolated) && defaultCurve?.kind !== 'estimated';
  const extendedNote = extended && defaultCurve
    ? t('tile.extendedNote', { from: formatNumber(defaultCurve.points[0].soc_percent), to: formatNumber(defaultCurve.points.at(-1)!.soc_percent) })
    : '';
  const curveField: Field = defaultCurve
    ? { value: { value: 0, kind: extended ? 'estimated' : defaultCurve.kind, source_id: defaultCurve.source_id, notes: extended ? extendedNote : defaultCurve.basis ?? defaultCurve.notes }, others: [], conflict: false }
    : null;
  // Wheel size (B13), shown with the curve controls since it changes range and km added (B20).
  const wheelControl = (
    <label className="wheel-pick">
      <span>{t('wheel.label')}</span>
      {baseIn !== null && wheelEffect ? (
        <>
          <select value={chosenIn ?? ''} onChange={(e) => setWheelIn(Number(e.target.value))}>
            {sizes.map((n) => (
              <option key={n} value={n}>
                {n === baseIn ? t('wheel.rated', { size: n }) : factorySizes.has(n) ? t('wheel.factory', { size: n }) : t('wheel.option', { size: n })}
              </option>
            ))}
          </select>
          {adjusting
            ? <span className="control-note">{t('wheel.change', { pct: (factor >= 1 ? '+' : '') + pct(factor - 1) })}</span>
            : baseWheel?.tire_size && <span className="control-note">{t('wheel.tire', { tire: baseWheel.tire_size })}</span>}
          {officialTrim && (
            <button type="button" className="control-note linkish" onClick={() => setTrimId(officialTrim.id)}>{t('wheel.useOfficial', { trim: trimLabel(officialTrim.name, car?.name ?? '') })}</button>
          )}
        </>
      ) : (
        <span className="unknown" title={t('wheel.unknownHelp')}>{t('badge.unknown')}</span>
      )}
    </label>
  );
  // Trims table (4.3): a trim with no rating of its own but other wheels than the variant's rating
  // gets the wheel estimate instead of "Same as variant".
  const variantWheel = car ? standardWheel(car.trims[0]) : null;
  const trimRange = (x: NonNullable<typeof trim>): { field: Field; approx: boolean } | null => {
    if (x.range_km) return { field: x.range_km, approx: false };
    const own = standardWheel(x);
    const r = f.range_km;
    if (ratedOnItsOwn(x) || !wheelEffect || own === null || variantWheel === null || own === variantWheel || !r || typeof r.value.value !== 'number') return null;
    const est = applyWheelEffect(variantWheel, own, wheelEffect, { rangeKm: r.value.value });
    const notes = t('wheel.basis', { size: own, base: variantWheel, pct: pct(wheelEffect.pct_per_inch), low: pct(wheelEffect.low), high: pct(wheelEffect.high), pairs: wheelEffect.pairs });
    return {
      field: { value: { value: Math.round(est.rangeKm! * 10) / 10, unit: r.value.unit, kind: 'estimated', source_id: wheelEffect.source_ids[0] ?? r.value.source_id, notes }, others: [r.value, ...r.others], conflict: false },
      approx: true,
    };
  };
  const d = car?.derived;
  // Added per 10 min (QA 9.1): uses the shown trim's highway consumption (and wheel estimate), like the viewer.
  const hwWh = shown.consumption_highway_wh_per_km?.value.value as number | undefined;
  const mathsKwh = battery?.value.value as number | undefined;
  const per10 = d && d.minutes_10_80 && hwWh && mathsKwh ? ((mathsKwh * 0.7 * 1000) / hwWh / d.minutes_10_80) * 10 : null;
  const distance = (km: number) => t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(km, unit)) });
  const sources = car?.sources ?? [];
  // Closed "Car figures" section still shows the headline numbers.
  const detailsPreview = [battery, range, f.dc_max_kw ?? null]
    .filter((x): x is NonNullable<Field> => Boolean(x))
    .map((x) => display(x.value, unit).text)
    .join(' · ');

  // The My car label leaves out the regulator's code (4.16, carLabel).
  const labelFor = (id: string) => {
    const e = cars.find((c) => c.id === id);
    return e ? carLabel(e) : id;
  };
  // Trims matter only when the variant has several; "no trim" means its first (standard) trim.
  const firstTrim = car?.trims[0]?.id ?? null;
  const carRule = useMemo(() => (car ? carMapInfo(car).rule : null), [car]);
  const mapPlugs = carRule ? linkPlugs(carRule) : null;
  const isMine = Boolean(myCar && car && myCar.carId === car.id && (car.trims.length < 2 || (myCar.trimId ?? firstTrim) === (trimId ?? firstTrim)));
  const inCompare = Boolean(carId && compare.includes(carId));


  return (
    <div className="explorer">
      <Accordion
        className="picker"
        headingId="pick"
        title={t('charging.selectVehicle')}
        preview={current ? t('charging.pickedCar', { year: current.year, make: current.make, model: current.model, variant: splitVariantName(current.name).plain }) : null}
        open={pickerOpen}
        onToggle={setPickerOpen}
      >
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
            <select value={carId ?? ''} onChange={(e) => { setCarId(e.target.value); setTrimId(null); setLinkMissing(false); }}>
              {variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
          <label><span>{t('charging.trim')}</span>
            <select value={trim?.id ?? ''} disabled={!car || car.trims.length < 2} onChange={(e) => setTrimId(e.target.value)}>
              {(car?.trims ?? []).map((x) => <option key={x.id} value={x.id}>{trimLabel(x.name, car?.name ?? "")}</option>)}
            </select>
          </label>
        </div>
      </Accordion>

      {linkMissing && <p className="banner" role="status">{t('charging.linkNotFound')}</p>}
      {error && <p className="banner">{t('charging.loadError')}</p>}
      {!error && loading && <p className="muted">{t('charging.loading')}</p>}

      {!error && !loading && car && (
        <>
          <header className="car-head">
            <p className="muted eyebrow">{car.year} · {car.make.name} · {t(`body.${car.model.body_type}` as MessageKey)} · {t(`value.${car.drivetrain}` as MessageKey)}</p>
            <h1>{car.model.name} <span className="variant"><VariantName name={car.name} /></span></h1>
            <div className="car-actions">
              <button type="button" className={`btn small${isMine ? ' primary' : ''}`} aria-pressed={isMine} onClick={() => !isMine && setMyCar({ carId: car.id, trimId: car.trims.length > 1 ? trimId : null, label: labelFor(car.id), model: cars.find((c) => c.id === car.id)?.model })}>
                {isMine ? t('mycar.isMine') : t('mycar.set')}
              </button>
              <button type="button" className="btn small" disabled={inCompare} onClick={() => setCompareNote(addToCompare(car.id))}>
                {inCompare ? t('browse.compareAdded') : t('browse.compare')}
              </button>
            </div>
            {compareNote === 'full' && <p className="banner small" role="status">{t('browse.compareFull')}</p>}
          </header>
          {!car.sold_in_canada && <p className="banner">{t('car.notInMarket', { market: COVERAGE.market, regulator: COVERAGE.regulatorShort })}</p>}

          <section aria-labelledby="curve">
            <h2 id="curve">{t('car.curve')}</h2>
            {car.curves.length ? (
              <CurveViewer
                extraControls={wheelControl}
                key={car.id}
                initialChargerKw={linkKw?.carId === car.id ? linkKw.kw : null}
                initialWindow={linkWindow?.carId === car.id ? { start: linkWindow.start, end: linkWindow.end } : null}
                mapPlugs={mapPlugs}
                curves={car.curves}
                usableKwh={(battery?.value.value as number) ?? null}
                batteryIsGross={!usable && Boolean(f.capacity_gross_kwh)}
                consumption={{
                  highway: (shown.consumption_highway_wh_per_km?.value.value as number) ?? null,
                  combined: (shown.consumption_combined_wh_per_km?.value.value as number) ?? null,
                  city: (shown.consumption_city_wh_per_km?.value.value as number) ?? null,
                }}
                sources={sources.map((s) => ({ id: s.id, title: s.title, url: s.url, n: sourceNumber(sources, s.id) }))}
              />
            ) : <p className="card muted">{t('car.noCurve')}</p>}
          </section>

          <Accordion headingId="key" title={t('car.details')} preview={detailsPreview}>
            <p className="muted small acc-help">{t('car.detailsHelp')}</p>
            <div className="readouts tiles">
              <div className="readout"><p className="readout-label">{t('tile.range')}</p><div className="readout-value"><Value field={range} sources={sources} label={t('tile.range')} unit={unit} approx={adjusting} />{ratedLine('range_km')}</div></div>
              <div className="readout"><p className="readout-label">{t('tile.efficiency')}</p><div className="readout-value"><Value field={shown.consumption_combined_wh_per_km} sources={sources} label={t('tile.efficiency')} unit={unit} approx={adjusting} />{ratedLine('consumption_combined_wh_per_km')}</div></div>
              <div className="readout"><p className="readout-label">{usable ? t('tile.battery') : t('tile.batteryGross')}</p><div className="readout-value"><Value field={battery} sources={sources} label={t('tile.battery')} unit={unit} /></div></div>
              <div className="readout"><p className="readout-label">{t('tile.dcPeak')}</p><div className="readout-value"><Value field={f.dc_max_kw ?? null} sources={sources} label={t('tile.dcPeak')} unit={unit} /></div></div>
              <div className="readout"><p className="readout-label">{t('tile.time1080')}</p><div className="readout-value">
                {d && d.minutes_10_80 !== null ? (
                  <span className="fv">{d.estimated ? t('fmt.approxMin', { value: displayMinutes(d.minutes_10_80, true) }) : t('fmt.min', { value: displayMinutes(d.minutes_10_80, false) })} <Badge field={curveField} sources={sources} label={t('tile.time1080')} unit={unit} /></span>
                ) : <span className="unknown">{t('badge.unknown')}</span>}
              </div></div>
              <div className="readout"><p className="readout-label">{t('tile.kmPer10')}</p><div className="readout-value">
                {per10 !== null ? (
                  <span className="fv">{d!.estimated || adjusting ? '~' : ''}{distance(per10)} <Badge field={curveField} sources={sources} label={t('tile.kmPer10')} unit={unit} /></span>
                ) : <span className="unknown">{t('badge.unknown')}</span>}
              </div></div>
            </div>
          </Accordion>

          <Accordion headingId="specs" title={t('car.specs')}>
            <div className="spec-grid">
              {GROUPS.map((g) => (
                <div className="panel" key={g.title}>
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
                      {g.title === 'group.efficiency' && (
                        // B47: the route planner's mass; a missing one shows as Estimated with its basis.
                        <tr><th scope="row">{label('curb_weight_kg')}</th><td data-label={label('curb_weight_kg')}><Value field={f.curb_weight_kg ?? null} sources={sources} label={label('curb_weight_kg')} unit={unit} /></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </Accordion>

          <Accordion headingId="trims" title={t('car.trims')} preview={t(car.trims.length === 1 ? 'car.trimCount.one' : 'car.trimCount.other', { count: car.trims.length })}>
            <div className="panel trims">
              <table className="stack-table">
                <thead><tr><th>{t('car.trimName')}</th><th>{t('field.heat_pump')}</th><th>{t('car.wheels')}</th><th>{t('car.trimRange')}</th></tr></thead>
                <tbody>
                  {car.trims.map((x) => { const tr = trimRange(x); return (
                    <tr key={x.id} className={x.id === trim?.id ? 'current' : ''}>
                      <td data-label={t('car.trimName')}>{x.name}</td>
                      <td data-label={t('field.heat_pump')}><Value field={x.heat_pump} sources={sources} label={t('field.heat_pump')} unit={unit} /></td>
                      <td data-label={t('car.wheels')}>{x.wheels.length ? x.wheels.map((w) => t(w.is_standard ? 'car.wheelStandard' : 'car.wheelSize', { size: w.diameter_in })).join(', ') : <span className="unknown">{t('badge.unknown')}</span>}</td>
                      <td data-label={t('car.trimRange')}>{tr ? <Value field={tr.field} sources={sources} label={t('car.trimRange')} unit={unit} approx={tr.approx} /> : <span className="muted">{t('car.sameAsVariant')}</span>}</td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
          </Accordion>

          <Accordion id="sources-acc" headingId="sources" title={t('car.sources')} preview={t(sources.length === 1 ? 'car.sourceCount.one' : 'car.sourceCount.other', { count: sources.length })}>
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
          <p className="small report"><a href="https://github.com/MahAbdulKhaliq/voltway/issues" rel="noopener" target="_blank">{t('car.reportProblem')}</a></p>
        </>
      )}

      <style>{`
        .explorer { display: grid; gap: 24px; }
        .explorer .car-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .explorer .selects { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
        .explorer .selects label { display: grid; gap: 4px; font-size: 0.875rem; color: var(--muted); min-width: 0; }
        .explorer .eyebrow { margin: 0 0 4px; font-size: 0.9rem; }
        .explorer .variant { color: var(--muted); font-weight: 500; }
        .explorer .tiles { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
        .explorer .tiles .readout { padding: 12px 14px; }
        .explorer .tiles .readout-label { margin-bottom: 4px; }
        .explorer .trims { padding: 6px 16px; }
        .explorer .trims tr.current td { background: color-mix(in srgb, var(--accent-soft) 70%, transparent); }
        .explorer .acc-help { margin: 0 0 12px; }
        .explorer .report { margin: -12px 0 0; }
        .explorer .linkish { display: block; margin-top: 6px; padding: 0; border: 0; background: none; color: var(--accent); font: inherit; font-size: 0.8rem; font-weight: 600; text-align: left; cursor: pointer; text-decoration: underline; }
        .explorer .rated { display: block; font-size: 0.8rem; font-weight: 400; color: var(--muted); margin-top: 4px; }
        .explorer .spec-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 12px; }
        .explorer .spec-grid th { width: 46%; }
        .explorer tr.current td:first-child { font-weight: 650; }
        .explorer .sources { list-style: none; counter-reset: src; margin: 0; padding: 4px 16px; }
        .explorer .sources li { counter-increment: src; display: grid; grid-template-columns: 2.2em 1fr; column-gap: 8px; padding: 10px 6px; border-bottom: 1px solid color-mix(in srgb, var(--field-border) 35%, transparent); border-radius: 6px; scroll-margin: 96px; }
        .explorer .sources li:last-child { border-bottom: 0; }
        .explorer .sources li::before { content: counter(src); grid-row: span 2; font-family: var(--display); font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }
        .explorer .sources .source-meta { display: block; margin-top: 2px; }
        .explorer .sources li.flash { animation: src-flash 2s ease-out; }
        @keyframes src-flash { from { background: var(--accent-soft); } to { background: transparent; } }
        @media (max-width: 640px) { .explorer { gap: 16px; } .explorer .tiles .readout-value { font-size: 1.05rem; } }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      `}</style>
    </div>
  );
}
