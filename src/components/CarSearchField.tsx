// The compact car picker on the map (DESIGN-4 4.7): one search box with instant suggestions.
// Cars the trip planner can't use yet are marked and listed last. The page-sized picker
// (CarPicker.tsx) stays on the Charging tab.

import { useEffect, useId, useMemo, useState } from 'react';
import { t } from '../i18n/t.ts';
import { makeCarSearch, tripReadyFirst } from '../lib/car-search.ts';
import type { IndexEntry } from '../lib/types.ts';

interface Props {
  cars: IndexEntry[];
  label: string;
  onPick: (carId: string) => void;
  /** Shown when there is a car to go back to. */
  onCancel?: () => void;
  autoFocus?: boolean;
}

const MAX_SUGGESTIONS = 8;
const optionLabel = (e: IndexEntry) => `${e.year} ${e.make} ${e.model} · ${e.name}`;
/** The short name shown for a chosen car ("IONIQ 5 Long Range"). */
export const carLabel = (e: IndexEntry) => `${e.model} ${e.name}`;

export default function CarSearchField({ cars, label, onPick, onCancel, autoFocus }: Props) {
  const id = useId();
  const search = useMemo(() => makeCarSearch(cars), [cars]);
  const byId = useMemo(() => new Map(cars.map((c) => [c.id, c])), [cars]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const suggestions = useMemo(
    () => tripReadyFirst(search(query).map((x) => byId.get(x)!).filter(Boolean)).slice(0, MAX_SUGGESTIONS),
    [query, search, byId],
  );
  useEffect(() => setActive(-1), [query]);

  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-opt-${i}`;
  const open = query.trim() !== '';
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (query) setQuery('');
      else onCancel?.();
      return;
    }
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); onPick(suggestions[Math.max(0, active)].id); }
  };

  return (
    <div className="car-search">
      <label htmlFor={`${id}-q`} className="tp-label">{label}</label>
      <div className="tp-input-row">
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
          autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
        />
        {onCancel && <button type="button" className="btn small" onClick={onCancel}>{t('picker.cancel')}</button>}
      </div>
      {open && (
        <ul id={listId} role="listbox" className="cp-suggest" aria-label={t('picker.suggestions')}>
          {suggestions.map((s, i) => (
            <li key={s.id} id={optionId(i)} role="option" aria-selected={i === active} className={`car-search-opt${i === active ? ' on' : ''}`}
              onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(s.id)}>
              <span>{optionLabel(s)}</span>
              {!s.trip_ready && <span className="car-search-tag small muted">{t('car.search.noTrip')}</span>}
            </li>
          ))}
          {suggestions.length === 0 && <li className="muted cp-none" role="presentation">{t('picker.noMatch')}</li>}
        </ul>
      )}
    </div>
  );
}
