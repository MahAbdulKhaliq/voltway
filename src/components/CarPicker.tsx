// First-load picker (database-ui.md §3, N6, B37): "Which EV do you drive, or want to?"
// A search box with instant suggestions, plus step-by-step Make → Model → Year → Variant
// selects and an optional trim. "Just browsing" goes to the Cars tab. Shown in the header's car
// dialog (B54). B58: a suggestion selects the car (fills the steps) without saving; with a car
// selected, its NACS / CCS1 / CHAdeMO switches show (its own plug on) before "Select car" saves.

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import { DC_PLUGS, carMapInfo, defaultDcPlugs, type DcPlug } from '../lib/map-filter.ts';
import { makeCarSearch, tripReadyFirst } from '../lib/car-search.ts';
import VariantName from './VariantName.tsx';
import PlugIcon from './PlugIcon.tsx';
import { CarSettingsFields } from './CarSettings.tsx';
import { trimSettingsInfo, trimText } from '../lib/car-settings.ts';
import { settingsFields, type CarSettings, type MyCar } from '../lib/my-car.ts';
import type { CarDetail, IndexEntry } from '../lib/types.ts';

interface Props {
  cars: IndexEntry[];
  /** plugs: the DC plug switches when the visitor changed them or they were saved for this car, else null. */
  /** extra (B120): wheels and heat pump, only where they differ from the car's defaults. */
  onPick: (carId: string, trimId: string | null, plugs: DcPlug[] | null, extra?: Pick<MyCar, 'wheelIn' | 'heatPump'>) => void;
  /** Shown when the visitor came to change an existing My car. */
  onCancel?: () => void;
  /** Heading level: 1 on its own page (default), 2 when placed inside another page. */
  level?: 1 | 2;
  /** In the header's picker dialog (QA 4.20): mark cars the trip planner can't use yet and list them last. */
  tripTags?: boolean;
  /** My car's saved plug switches (B58): shown again when the same car is selected. */
  savedPlugs?: { carId: string; plugs: DcPlug[] } | null;
  /** B120: My car, so its trim, wheels and heat pump show again when the same car is selected. */
  saved?: MyCar | null;
  /** The car to start on (My car), so "Change car" opens with it selected. */
  initialCar?: string | null;
  /** B87: 'compare' is Compare's "Add a car" dialog: its own title and button, no trim or plug steps. */
  purpose?: 'mycar' | 'compare';
  /** Cars that can't be picked (already compared): marked in the suggestions and the variant step. */
  exclude?: readonly string[];
}

const MAX_SUGGESTIONS = 8;
const uniq = <T,>(xs: T[]) => [...new Set(xs)];
const byName = (a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' });
const Label = ({ e }: { e: IndexEntry }) => <>{`${e.year} ${e.make} ${e.model} · `}<VariantName name={e.name} /></>;

export default function CarPicker({ cars, onPick, onCancel, level = 1, tripTags = false, savedPlugs = null, saved = null, initialCar = null, purpose = 'mycar', exclude = [] }: Props) {
  const forCompare = purpose === 'compare';
  const taken = (carId: string) => exclude.includes(carId);
  const Heading = level === 1 ? "h1" : "h2";
  const Sub = level === 1 ? 'h2' : 'h3';
  const id = useId();
  const search = useMemo(() => makeCarSearch(cars), [cars]);
  const byId = useMemo(() => new Map(cars.map((c) => [c.id, c])), [cars]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const start = initialCar ? byId.get(initialCar) : undefined;
  const [make, setMake] = useState(start?.make ?? '');
  const [model, setModel] = useState(start?.model ?? '');
  const [year, setYear] = useState(start ? String(start.year) : '');
  const [variant, setVariant] = useState(start?.id ?? '');
  // The selected car's own plug (from its file) and any switches the visitor changed here.
  const [port, setPort] = useState<{ id: string; port: string | null; adapter?: string | null } | null>(null);
  const [changed, setChanged] = useState<{ id: string; plugs: DcPlug[] } | null>(null);
  const goRef = useRef<HTMLButtonElement>(null);
  const focusGo = useRef(false);
  const [trim, setTrim] = useState('');
  const [trims, setTrims] = useState<CarDetail['trims']>([]);
  // B120: wheels and heat pump for the selected car and trim (My car's own when they match).
  const [settings, setSettings] = useState<CarSettings>({ wheelIn: null, heatPump: false });
  useEffect(() => {
    const same = saved && saved.carId === variant && (saved.trimId ?? '') === trim;
    setSettings(same ? { wheelIn: saved.wheelIn ?? null, heatPump: Boolean(saved.heatPump) } : { wheelIn: null, heatPump: false });
  }, [variant, trim]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = useMemo(() => {
    const found = search(query).map((x) => byId.get(x)!).filter(Boolean);
    return (tripTags ? tripReadyFirst(found) : found).slice(0, MAX_SUGGESTIONS);
  }, [query, search, byId, tripTags]);
  useEffect(() => setActive(-1), [query]);

  const makes = uniq(cars.map((c) => c.make)).sort(byName);
  const models = uniq(cars.filter((c) => c.make === make).map((c) => c.model)).sort(byName);
  const years = uniq(cars.filter((c) => c.make === make && c.model === model).map((c) => c.year)).sort((a, b) => b - a);
  const variants = cars.filter((c) => c.make === make && c.model === model && String(c.year) === year).sort((a, b) => byName(a.name, b.name));

  // Each step narrows the next; a single choice is filled in for the visitor. A choice that still
  // fits (a suggestion fills every step at once) is kept.
  useEffect(() => { setModel((m) => (models.includes(m) ? m : models.length === 1 ? models[0] : '')); }, [make]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setYear((y) => (years.some((x) => String(x) === y) ? y : years.length === 1 ? String(years[0]) : '')); }, [make, model]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setVariant((v) => (variants.some((x) => x.id === v) ? v : variants.length === 1 ? variants[0].id : '')); }, [make, model, year]); // eslint-disable-line react-hooks/exhaustive-deps

  // B58: a suggestion selects the car; the dialog stays open on "Select car" and the plug switches.
  const select = (e: IndexEntry) => {
    if (taken(e.id)) return;
    setMake(e.make);
    setModel(e.model);
    setYear(String(e.year));
    setVariant(e.id);
    setQuery('');
    focusGo.current = true;
  };
  useEffect(() => {
    if (focusGo.current && variant) { focusGo.current = false; goRef.current?.focus(); }
  }, [variant]);

  // Trims (optional step) and the car's own plug for the selected variant.
  useEffect(() => {
    setTrim('');
    setTrims([]);
    if (!variant) return;
    let alive = true;
    const id = variant;
    fetch(`/data/cars/${id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((c: CarDetail) => {
        if (!alive) return;
        setTrims(c.trims);
        // B120: Change car opens on My car's trim too.
        if (saved?.carId === id && saved.trimId && c.trims.some((x) => x.id === saved.trimId)) setTrim(saved.trimId);
        const info = carMapInfo(c);
        setPort({ id, port: info.port, adapter: info.adapter });
      })
      .catch(() => alive && setPort({ id, port: null }));
    return () => { alive = false; };
  }, [variant]);

  const listId = `${id}-suggest`;
  const optionId = (i: number) => `${id}-opt-${i}`;
  const open = query.trim() !== '';
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const pick = active >= 0 ? suggestions[active] : suggestions.find((x) => !taken(x.id)); if (pick) select(pick); }
    else if (e.key === 'Escape') setQuery('');
  };
  const variantName = byId.get(variant)?.name ?? '';
  // Switches: changed here, else saved for this car, else the car's own plug once its file is in.
  const plugsOn: DcPlug[] | null = !variant ? null
    : changed?.id === variant ? changed.plugs
    : savedPlugs?.carId === variant ? savedPlugs.plugs
    : port?.id === variant ? defaultDcPlugs(port.port, port.adapter)
    : null;
  const togglePlug = (p: DcPlug) => {
    if (!plugsOn) return;
    const next = plugsOn.includes(p) ? plugsOn.filter((x) => x !== p) : [...plugsOn, p];
    setChanged({ id: variant, plugs: DC_PLUGS.filter((x) => next.includes(x)) });
  };
  const keptPlugs = changed?.id === variant ? changed.plugs : savedPlugs?.carId === variant ? savedPlugs.plugs : null;

  return (
    <section className={`car-picker card${forCompare ? ' cp-compare' : ''}`} aria-labelledby={`${id}-title`}>
      <Heading id={`${id}-title`} className="cp-title">{t(forCompare ? 'compare.addTitle' : 'picker.title')}</Heading>
      <p className="muted cp-intro">{t(forCompare ? 'compare.addIntro' : 'picker.intro')}</p>

      <div className="cp-search">
        <label htmlFor={`${id}-q`} className="cp-label">{t('picker.search')}</label>
        <div className="cp-search-box">
        <svg className="cp-search-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id={`${id}-q`}
          type="search"
          className="field-input"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          placeholder={t('picker.searchPlaceholder')}
          value={query}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
        />
        </div>
        {open && (
          <ul id={listId} role="listbox" className="cp-suggest" aria-label={t('picker.suggestions')}>
            {suggestions.map((s, i) => (
              <li key={s.id} id={optionId(i)} role="option" aria-selected={i === active} aria-disabled={taken(s.id) || undefined}
                className={`car-search-opt${i === active ? ' on' : ''}${taken(s.id) ? ' taken' : ''}`}
                onMouseDown={(e) => e.preventDefault()} onClick={() => select(s)}>
                <span><Label e={s} /></span>
                {taken(s.id) && <span className="car-search-tag small muted">{t('compare.already')}</span>}
                {tripTags && !s.trip_ready && <span className="car-search-tag small muted">{t('car.search.noTrip')}</span>}
              </li>
            ))}
            {suggestions.length === 0 && <li className="muted cp-none" role="presentation">{t('picker.noMatch')}</li>}
          </ul>
        )}
      </div>

      {/* B89 round 3: the steps are one raised panel (design-language §3), numbered; a step's number
          fills in once it is chosen. The selects take the site's select menus (§4). */}
      <div className="panel cp-steps-panel">
      <Sub className="panel-title cp-or">{t('picker.or')}</Sub>
      <div className="cp-steps">
        <label className={make ? 'done' : undefined}><span><span className="cp-step-n" aria-hidden="true">1</span>{t('charging.make')}</span>
          <select className="field-input" value={make} onChange={(e) => setMake(e.target.value)}>
            <option value="">{t('picker.choose')}</option>
            {makes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className={model ? 'done' : undefined}><span><span className="cp-step-n" aria-hidden="true">2</span>{t('charging.model')}</span>
          <select className="field-input" value={model} disabled={!make} onChange={(e) => setModel(e.target.value)}>
            <option value="">{t('picker.choose')}</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className={year ? 'done' : undefined}><span><span className="cp-step-n" aria-hidden="true">3</span>{t('charging.year')}</span>
          <select className="field-input" value={year} disabled={!model} onChange={(e) => setYear(e.target.value)}>
            <option value="">{t('picker.choose')}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label className={variant ? 'done' : undefined}><span><span className="cp-step-n" aria-hidden="true">4</span>{t('charging.variant')}</span>
          <select className="field-input" value={variant} disabled={!year} onChange={(e) => setVariant(e.target.value)}>
            <option value="">{t('picker.choose')}</option>
            {variants.map((v) => <option key={v.id} value={v.id} disabled={taken(v.id)}>{taken(v.id) ? t('compare.alreadyOption', { name: v.name }) : v.name}</option>)}
          </select>
        </label>
        {!forCompare && <label className="cp-trim"><span>{t('picker.trimOptional')}</span>
          <select className="field-input" value={trim} disabled={!variant || trims.length < 2} onChange={(e) => setTrim(e.target.value)}>
            <option value="">{t('picker.trimNotSure')}</option>
            {trims.map((x) => <option key={x.id} value={x.id}>{trimText(x.name, variantName)}</option>)}
          </select>
        </label>}
      </div>
      {!forCompare && <p className="muted small cp-trim-note">{t('picker.trimNote')}</p>}
      </div>

      {tripTags && variant && trims.length > 0 && (
        <div className="panel cs-panel">
          <Sub className="panel-title">{t('mycar.rangeTitle')}</Sub>
          <CarSettingsFields trims={trims} trimId={trim || null} variantName={variantName} settings={settings} onChange={setSettings} />
          <p className="muted small cs-note">{t('mycar.rangeNote')}</p>
        </div>
      )}

      {tripTags && variant && (
        <div className="panel cp-plugs" role="group" aria-labelledby={`${id}-plugs`}>
          <Sub id={`${id}-plugs`} className="panel-title">{t('mycar.plugs')}</Sub>
          <div className="cp-plug-row">
            {DC_PLUGS.map((p) => (
              <button
                key={p}
                type="button"
                role="switch"
                aria-checked={plugsOn ? plugsOn.includes(p) : false}
                disabled={!plugsOn}
                className="chip-plug cp-plug"
                onClick={() => togglePlug(p)}
              >
                <PlugIcon plug={p} />
                <span className="cp-plug-name">{t(`value.${p}` as MessageKey)}</span>
                <span className="switch" aria-hidden="true" />
              </button>
            ))}
          </div>
          <p className="muted small cp-plugs-note">{t('mycar.plugsNote')}</p>
        </div>
      )}

      <div className="cp-actions">
        <button ref={goRef} type="button" className="btn primary" disabled={!variant || taken(variant)} onClick={() => onPick(variant, forCompare ? null : trim || null, forCompare ? null : keptPlugs, forCompare || !trims.length ? undefined : settingsFields(settings, trimSettingsInfo(trims, trim || null)))}>{t(forCompare ? 'compare.addGo' : 'picker.go')}</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>{t('picker.cancel')}</button>}
        <a href="/cars" className="cp-browse">{t(forCompare ? 'compare.browse' : 'picker.browse')}</a>
      </div>
    </section>
  );
}
