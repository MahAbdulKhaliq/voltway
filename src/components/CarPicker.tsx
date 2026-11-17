// First-load picker (database-ui.md §3, N6, B37): "Which EV do you drive, or want to?"
// A search box with instant suggestions, plus step-by-step Make → Model → Year → Variant
// selects and an optional trim. "Just browsing" goes to the Cars tab. Shown on the Charging
// tab when no My car is set and no car link was opened.

import { useEffect, useId, useMemo, useState } from 'react';
import { t } from '../i18n/t.ts';
import { makeCarSearch } from '../lib/car-search.ts';
import type { CarDetail, IndexEntry } from '../lib/types.ts';

interface Props {
  cars: IndexEntry[];
  onPick: (carId: string, trimId: string | null) => void;
  /** Shown when the visitor came to change an existing My car. */
  onCancel?: () => void;
  /** Heading level: 1 on its own page (default), 2 when placed inside another page. */
  level?: 1 | 2;
}

const MAX_SUGGESTIONS = 8;
const uniq = <T,>(xs: T[]) => [...new Set(xs)];
const byName = (a: string, b: string) => a.localeCompare(b, 'en', { sensitivity: 'base' });
const label = (e: IndexEntry) => `${e.year} ${e.make} ${e.model} · ${e.name}`;

/** Trim names repeat the variant ("eDrive40 Gran Coupe (18″ Wheels)"); show only what differs. */
function trimText(trim: string, variant: string): string {
  if (trim === variant) return trim;
  const rest = trim.startsWith(variant) ? trim.slice(variant.length).trim().replace(/^\((.*)\)$/, '$1') : '';
  return rest || trim;
}

export default function CarPicker({ cars, onPick, onCancel, level = 1 }: Props) {
  const Heading = level === 1 ? "h1" : "h2";
  const id = useId();
  const search = useMemo(() => makeCarSearch(cars), [cars]);
  const byId = useMemo(() => new Map(cars.map((c) => [c.id, c])), [cars]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [variant, setVariant] = useState('');
  const [trim, setTrim] = useState('');
  const [trims, setTrims] = useState<CarDetail['trims']>([]);

  const suggestions = useMemo(() => search(query).slice(0, MAX_SUGGESTIONS).map((x) => byId.get(x)!).filter(Boolean), [query, search, byId]);
  useEffect(() => setActive(-1), [query]);

  const makes = uniq(cars.map((c) => c.make)).sort(byName);
  const models = uniq(cars.filter((c) => c.make === make).map((c) => c.model)).sort(byName);
  const years = uniq(cars.filter((c) => c.make === make && c.model === model).map((c) => c.year)).sort((a, b) => b - a);
  const variants = cars.filter((c) => c.make === make && c.model === model && String(c.year) === year).sort((a, b) => byName(a.name, b.name));

  // Each step narrows the next; a single choice is filled in for the visitor.
  useEffect(() => { setModel(models.length === 1 ? models[0] : ''); }, [make]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setYear(years.length === 1 ? String(years[0]) : ''); }, [make, model]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setVariant(variants.length === 1 ? variants[0].id : ''); }, [make, model, year]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trims for the chosen variant (optional step).
  useEffect(() => {
    setTrim('');
    setTrims([]);
    if (!variant) return;
    let alive = true;
    fetch(`/data/cars/${variant}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((c: CarDetail) => alive && setTrims(c.trims))
      .catch(() => { /* trims stay optional */ });
    return () => { alive = false; };
  }, [variant]);

  const listId = `${id}-suggest`;
  const optionId = (i: number) => `${id}-opt-${i}`;
  const open = query.trim() !== '';
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); onPick(suggestions[Math.max(0, active)].id, null); }
    else if (e.key === 'Escape') setQuery('');
  };
  const variantName = byId.get(variant)?.name ?? '';

  return (
    <section className="car-picker card" aria-labelledby={`${id}-title`}>
      <Heading id={`${id}-title`} className="cp-title">{t('picker.title')}</Heading>
      <p className="muted cp-intro">{t('picker.intro')}</p>

      <div className="cp-search">
        <label htmlFor={`${id}-q`} className="cp-label">{t('picker.search')}</label>
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
        {open && (
          <ul id={listId} role="listbox" className="cp-suggest" aria-label={t('picker.suggestions')}>
            {suggestions.map((s, i) => (
              <li key={s.id} id={optionId(i)} role="option" aria-selected={i === active} className={i === active ? 'on' : undefined}
                onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(s.id, null)}>
                {label(s)}
              </li>
            ))}
            {suggestions.length === 0 && <li className="muted cp-none" role="presentation">{t('picker.noMatch')}</li>}
          </ul>
        )}
      </div>

      <p className="cp-or muted small">{t('picker.or')}</p>

      <div className="cp-steps">
        <label><span>{t('charging.make')}</span>
          <select className="field-input" value={make} onChange={(e) => setMake(e.target.value)}>
            <option value="">{t('picker.choose')}</option>
            {makes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label><span>{t('charging.model')}</span>
          <select className="field-input" value={model} disabled={!make} onChange={(e) => setModel(e.target.value)}>
            <option value="">{t('picker.choose')}</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label><span>{t('charging.year')}</span>
          <select className="field-input" value={year} disabled={!model} onChange={(e) => setYear(e.target.value)}>
            <option value="">{t('picker.choose')}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label><span>{t('charging.variant')}</span>
          <select className="field-input" value={variant} disabled={!year} onChange={(e) => setVariant(e.target.value)}>
            <option value="">{t('picker.choose')}</option>
            {variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </label>
        <label><span>{t('picker.trimOptional')}</span>
          <select className="field-input" value={trim} disabled={!variant || trims.length < 2} onChange={(e) => setTrim(e.target.value)}>
            <option value="">{t('picker.trimNotSure')}</option>
            {trims.map((x) => <option key={x.id} value={x.id}>{trimText(x.name, variantName)}</option>)}
          </select>
        </label>
      </div>
      <p className="muted small cp-trim-note">{t('picker.trimNote')}</p>

      <div className="cp-actions">
        <button type="button" className="btn primary" disabled={!variant} onClick={() => onPick(variant, trim || null)}>{t('picker.go')}</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>{t('picker.cancel')}</button>}
        <a href="/cars" className="cp-browse">{t('picker.browse')}</a>
      </div>
    </section>
  );
}
