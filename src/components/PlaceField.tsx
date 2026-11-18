// A place field (From, To, "Where to?"): instant suggestions from the GeoNames place list (B45),
// and the address service (/api/geocode) only when "Search full address" is pressed.

import { useEffect, useId, useMemo, useState } from 'react';
import { t } from '../i18n/t.ts';
import { makePlaceSearch, type PlaceRow, type PlaceSearch, type TripEnd } from '../lib/place-search.ts';

// The place list: one fetch per visit, shared by every field.
let placesPromise: Promise<PlaceSearch> | null = null;
export const loadPlaces = () =>
  (placesPromise ??= fetch('/data/places.json').then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((rows: PlaceRow[]) => makePlaceSearch(rows)));

interface FieldProps {
  label: string;
  value: TripEnd | null;
  onChange: (end: TripEnd | null) => void;
  search: PlaceSearch | null;
  extra?: React.ReactNode;
  /** Defaults to "City or town". */
  placeholder?: string;
  /** Keep the label for screen readers only (the "Where to?" box). */
  hideLabel?: boolean;
  autoFocus?: boolean;
  /** The typed text, on every keystroke (B62: the trip hint shows only for text not picked). */
  onText?: (text: string) => void;
}

export default function PlaceField({ label, value, onChange, search, extra, placeholder, hideLabel, autoFocus, onText }: FieldProps) {
  const id = useId();
  const [text, setText] = useState(value?.label ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [remote, setRemote] = useState<TripEnd[] | null>(null);
  const [remoteState, setRemoteState] = useState<'idle' | 'loading' | 'none' | 'busy' | 'offline'>('idle');

  // Show a picked end's label; clearing the pick (while typing) leaves the typed text alone.
  useEffect(() => { if (value) setText(value.label); }, [value]);
  const local = useMemo(() => (search && open ? search(text) : []), [search, text, open]);
  const options = remote ?? local;
  useEffect(() => setActive(-1), [text, remote]);

  const pick = (end: TripEnd) => {
    onChange(end);
    setText(end.label);
    setOpen(false);
    setRemote(null);
    setRemoteState('idle');
  };
  const searchAddress = async () => {
    const q = text.trim();
    if (q.length < 3) return;
    setOpen(true);
    setRemoteState('loading');
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error(String(r.status));
      const { places } = (await r.json()) as { places: { label: string; lat: number; lon: number }[] };
      setRemote(places);
      setRemoteState(places.length ? 'idle' : 'none');
    } catch {
      setRemote([]);
      setRemoteState(navigator.onLine === false ? 'offline' : 'busy');
    }
  };
  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;
  const showList = open && text.trim() !== '' && (value?.label !== text || remote !== null);
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { if (showList) e.preventDefault(); setOpen(false); setRemote(null); return; }
    if (!showList || !options.length) {
      if (e.key === 'Enter') { e.preventDefault(); searchAddress(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? options.length - 1 : a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(options[Math.max(0, active)]); }
  };

  return (
    <div className="tp-field">
      <label htmlFor={`${id}-in`} className={hideLabel ? 'sr-only' : 'tp-label'}>{label}</label>
      <div className="tp-input-row">
        <input
          id={`${id}-in`}
          type="search"
          className="field-input"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? optId(active) : undefined}
          placeholder={placeholder ?? t('trip.placePlaceholder')}
          autoFocus={autoFocus}
          autoComplete="off"
          value={text}
          onChange={(e) => { setText(e.target.value); onText?.(e.target.value); setOpen(true); setRemote(null); setRemoteState('idle'); if (value) onChange(null); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKey}
        />
        {extra}
      </div>
      {showList && (
        // The dropdown holds the listbox (options only, as ARIA requires) and, below it, the
        // address-search status and button (P.4: a button inside a listbox is not allowed).
        <div className="cp-suggest">
        <ul id={listId} role="listbox" className="cp-suggest-list" aria-label={t('trip.suggestions', { field: label })}>
          {options.map((o, i) => (
            <li key={`${o.label}-${i}`} id={optId(i)} role="option" aria-selected={i === active} className={i === active ? 'on' : undefined}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}>
              {o.label}
            </li>
          ))}
        </ul>
        <div role="status">
          {remoteState === 'loading' && <p className="muted cp-none"><span className="road-loader" aria-hidden="true"><span /></span>{t('trip.addressSearching')}</p>}
          {remoteState === 'none' && <p className="muted cp-none">{t('trip.addressNone')}</p>}
          {remoteState === 'busy' && <p className="muted cp-none">{t('trip.busy')}</p>}
          {remoteState === 'offline' && <p className="muted cp-none">{t('trip.addressOffline')}</p>}
        </div>
        {remote === null && (
          <div className="tp-address">
            <button type="button" className="btn small" onMouseDown={(e) => e.preventDefault()} onClick={searchAddress} disabled={text.trim().length < 3}>
              {t('trip.searchAddress')}
            </button>
            {!options.length && <span className="muted small"> {t('trip.noPlace')}</span>}
          </div>
        )}
        </div>
      )}
    </div>
  );
}
