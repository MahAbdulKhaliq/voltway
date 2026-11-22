// A place field (From, To, "Where to?"): instant suggestions from the GeoNames place list (B45),
// and the address service (/api/geocode) when "Search full address" is pressed or, for text that
// reads like an address ("59 Paradise…"), once typing pauses.

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { t } from '../i18n/t.ts';
import { autoSearchAddress, hasExactName, makePlaceSearch, type PlaceRow, type PlaceSearch, type TripEnd } from '../lib/place-search.ts';
import { routeOptions } from '../lib/route-options.ts';
import { SHEET_MEDIA } from '../lib/sheet.ts';

// The place lists: one fetch each per visit, shared by every field. Canada loads first; the US list
// (B78, DESIGN-7 D5) loads when a search finds few matches or the map is over the US (loadUsPlaces).
const getRows = (cc: string) => fetch(`/data/places-${cc}.json`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))) as Promise<PlaceRow[]>;
let caRows: Promise<PlaceRow[]> | null = null;
let placesPromise: Promise<PlaceSearch> | null = null;
export const loadPlaces = () => (placesPromise ??= (caRows ??= getRows('ca')).then((rows) => makePlaceSearch(rows)));

/** The search over both countries once the US list is in; every field switches to it. */
let wide: PlaceSearch | null = null;
let widePromise: Promise<PlaceSearch> | null = null;
const listeners = new Set<() => void>();
export const loadUsPlaces = () =>
  (widePromise ??= Promise.all([(caRows ??= getRows('ca')), getRows('us')])
    .then(([ca, us]) => {
      wide = makePlaceSearch(ca, [{ cc: 'us', rows: us }]);
      listeners.forEach((l) => l());
      return wide;
    })
    .catch((e) => {
      widePromise = null; // a failed load can be tried again
      throw e;
    }));
const useWide = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => wide, () => null);
/** A search with fewer matches than this, or none with exactly the typed name, asks for the US list. */
const FEW = 3;
/** B136 (owner 2026-11-20): on phones (the map sheet) at most this many suggestions show, so the list stays small. */
const PHONE_MAX = 3;
/** Address-like text is searched this long after the last keystroke, so a typing burst is one search. */
const ADDRESS_PAUSE_MS = 700;
/** Address answers already fetched this visit (query + country → places): editing back and forth asks once. */
const addressCache = new Map<string, TripEnd[]>();
const onPhone = () => typeof matchMedia !== 'undefined' && matchMedia(SHEET_MEDIA).matches;
const usePhone = () => useSyncExternalStore((l) => { if (typeof matchMedia === 'undefined') return () => {}; const m = matchMedia(SHEET_MEDIA); m.addEventListener('change', l); return () => m.removeEventListener('change', l); }, onPhone, () => false);

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
  /** The trip start: place results lean to its country, and address search keeps to it (B78). */
  near?: TripEnd | null;
  /** Where the visitor is looking (the map's centre), when there is no trip start: an address typed
   *  without a town ("184 Lynbrook Dr") is also looked for near it. */
  focus?: { lat: number; lon: number } | null;
}

export default function PlaceField({ label, value, onChange, search: own, extra, placeholder, hideLabel, autoFocus, onText, near, focus }: FieldProps) {
  const wideSearch = useWide();
  const search = own ? (wideSearch ?? own) : null;
  const id = useId();
  const [text, setText] = useState(value?.label ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [remote, setRemote] = useState<TripEnd[] | null>(null);
  const [remoteState, setRemoteState] = useState<'idle' | 'loading' | 'none' | 'busy' | 'offline'>('idle');

  // Show a picked end's label; clearing the pick (while typing) leaves the typed text alone.
  useEffect(() => { if (value) setText(value.label); }, [value]);
  // The start's country: its tag, or (a share link, my location, a station) the nearest listed place's,
  // once both lists are in. A start without a tag loads the US list so the guess can be right.
  const nearCc = near ? (near.cc ?? wideSearch?.countryNear(near.lat, near.lon) ?? undefined) : undefined;
  useEffect(() => { if (own && near && !near.cc && !wideSearch) loadUsPlaces().catch(() => {}); }, [own, near, wideSearch]);
  const local = useMemo(() => (search && open ? search(text, 8, nearCc) : []), [search, text, open, nearCc]);
  // Few Canadian matches, or none named exactly as typed ("Spring"): bring in the US towns (once per
  // visit; failures are quiet, Canada still works).
  const exact = hasExactName(local, text);
  useEffect(() => {
    if (search && !wideSearch && open && text.trim().length >= 3 && (local.length < FEW || !exact)) loadUsPlaces().catch(() => {});
  }, [search, wideSearch, open, text, local.length, exact]);
  const phone = usePhone();
  const all = remote ?? local;
  const options = phone ? all.slice(0, PHONE_MAX) : all;
  useEffect(() => setActive(-1), [text, remote]);

  const pick = ({ estimated: _e, ...end }: TripEnd) => {
    onChange(end);
    setText(end.label);
    setOpen(false);
    setRemote(null);
    setRemoteState('idle');
  };
  // Only the latest search may fill the list (an older, slower answer is dropped).
  const latest = useRef(0);
  const searchAddress = async (raw = text) => {
    const q = raw.trim();
    if (q.length < 3) return;
    const seq = ++latest.current;
    setOpen(true);
    // With a start, addresses come from its country only while Stay within the border is on (B78);
    // with it off a destination may be in either country (B79, QA 2026-11-18).
    const around = near ?? focus;
    const at = (nearCc && !routeOptions().crossBorder ? `&country=${nearCc}` : '')
      + (around ? `&near=${around.lon.toFixed(1)},${around.lat.toFixed(1)}` : '');
    const key = `${q.toLowerCase()}|${at}`;
    const show = (places: TripEnd[]) => { setRemote(places); setRemoteState(places.length ? 'idle' : 'none'); };
    const cached = addressCache.get(key);
    if (cached) { show(cached); return; }
    setRemoteState('loading');
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}${at}`);
      if (!r.ok) throw new Error(String(r.status));
      const { places } = (await r.json()) as { places: TripEnd[] };
      addressCache.set(key, places);
      if (seq === latest.current) show(places);
    } catch {
      if (seq !== latest.current) return;
      setRemote([]);
      setRemoteState(navigator.onLine === false ? 'offline' : 'busy');
    }
  };
  // The timer below calls the newest searchAddress (its country and near point are current).
  const searchRef = useRef(searchAddress);
  searchRef.current = searchAddress;
  // Address-like text searches itself once typing pauses; town names (even "100 Mile House") stay
  // with the local list.
  // Not before the town list is in (it decides "100 Mile House"), nor while a search is running.
  const auto = open && search !== null && remote === null && remoteState !== 'loading' && value?.label !== text && autoSearchAddress(text, local);
  useEffect(() => {
    if (!auto) return;
    const timer = setTimeout(() => { void searchRef.current(text); }, ADDRESS_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [auto, text]);
  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;
  const showList = open && text.trim() !== '' && (value?.label !== text || remote !== null);
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { if (showList) e.preventDefault(); setOpen(false); setRemote(null); return; }
    if (!showList || !options.length) {
      if (e.key === 'Enter') { e.preventDefault(); void searchAddress(); }
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
          onChange={(e) => { latest.current++; setText(e.target.value); onText?.(e.target.value); setOpen(true); setRemote(null); setRemoteState('idle'); if (value) onChange(null); }}
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
              {o.estimated && <span className="muted small"> {t('trip.addressEstimated')}</span>}
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
            <button type="button" className="btn small" onMouseDown={(e) => e.preventDefault()} onClick={() => void searchAddress()} disabled={text.trim().length < 3}>
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
