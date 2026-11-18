// Header chips (B40): My car (menu: open it, change it, forget it) and Compare (n), which is
// hidden while the list is empty. Both follow the "voltway:mycar" / "voltway:compare" events,
// so they update live when a page changes them. "Pick your car" and "Change car" open the car
// picker in a dialog on the page the visitor is on (B54); the car list loads when it first opens.
// The menu also holds My car's plug switches (B55): NACS, CCS1, CHAdeMO, used by the trip
// planner. The car's own plug is on by default; the trip panel opens this menu with the
// "voltway:mycar-menu" event. The car dialog opens on "voltway:pick-car" (B58) and shows the
// same switches for the car being chosen.

import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/t.ts';
import { getCompare, getMyCar, setMyCar, type MyCar } from '../lib/my-car.ts';
import CarPicker from './CarPicker.tsx';
import { carLabel } from '../lib/car-label.ts';
import type { IndexEntry } from '../lib/types.ts';
import { DC_PLUGS, defaultDcPlugs, type DcPlug } from '../lib/map-filter.ts';
import type { MessageKey } from '../i18n/t.ts';

interface Props {
  /** Compare chip only once the Compare page exists (CLAUDE.md: hide links to parts not built); not on the map (B68). */
  showCompare?: boolean;
  /** My car chip: the map only (owner, B68). The car dialog stays, for the pages' own buttons. */
  showMyCar?: boolean;
}

const carHref = (id: string, trim: string | null) =>
  `/charging?car=${id.split('/').map(encodeURIComponent).join('/')}${trim ? `&trim=${encodeURIComponent(trim)}` : ''}`;

export default function HeaderChips({ showCompare = false, showMyCar = true }: Props) {
  const [mine, setMine] = useState<MyCar | null>(null);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [cars, setCars] = useState<IndexEntry[] | null>(null);
  const [carsFailed, setCarsFailed] = useState(false);
  const [picking, setPicking] = useState(false);
  // The car's own port (for the default plug switches), read from its car file when the menu opens.
  const [port, setPort] = useState<{ carId: string; port: string | null } | null>(null);
  const focusPlugs = useRef(false);

  useEffect(() => {
    setMine(getMyCar());
    setCount(getCompare().length);
    setReady(true);
    const onMine = (e: Event) => setMine((e as CustomEvent<MyCar | null>).detail);
    const onCompare = (e: Event) => setCount((e as CustomEvent<string[]>).detail.length);
    // Another tab changed storage.
    const onStorage = () => { setMine(getMyCar()); setCount(getCompare().length); };
    window.addEventListener('voltway:mycar', onMine);
    window.addEventListener('voltway:compare', onCompare);
    window.addEventListener('storage', onStorage);
    // The trip panel's "Change" next to the plugs it used opens this menu at the plug switches.
    // Opened after the asking click has finished bubbling, or the click-outside listener below
    // (added as soon as the menu opens) sees that same click and closes it again.
    const onMenu = () => { focusPlugs.current = true; setTimeout(() => setOpen(true), 0); };
    window.addEventListener('voltway:mycar-menu', onMenu);
    // B58: the trip form's "Choose your car", "Change car" and the map's car tile open the car dialog.
    const onPickCar = () => openPickerRef.current(document.activeElement as HTMLElement | null);
    window.addEventListener('voltway:pick-car', onPickCar);
    return () => {
      window.removeEventListener('voltway:pick-car', onPickCar);
      window.removeEventListener('voltway:mycar-menu', onMenu);
      window.removeEventListener('voltway:mycar', onMine);
      window.removeEventListener('voltway:compare', onCompare);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // The menu closes on Escape (focus back to the chip) and on a click outside it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); button.current?.focus(); } };
    const onClick = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    const first = focusPlugs.current ? '[role=menuitemcheckbox]' : '[role=menuitem]';
    const el = root.current?.querySelector<HTMLButtonElement>(first);
    el?.focus();
    // The plug switches stay disabled until the car file arrives; the effect below retries then.
    if (document.activeElement === el) focusPlugs.current = false;
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, [open]);

  useEffect(() => {
    if (!open || !mine || port?.carId === mine.carId) return;
    let live = true;
    const carId = mine.carId;
    fetch(`/data/cars/${carId}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((file) => {
        const v = file?.fields?.charge_port?.value?.value;
        if (live) setPort({ carId, port: typeof v === 'string' ? v : null });
      })
      .catch(() => live && setPort({ carId, port: null }));
    return () => { live = false; };
  }, [open, mine, port]);
  const plugsOn: DcPlug[] | null = mine
    ? mine.plugs ?? (port?.carId === mine.carId ? defaultDcPlugs(port.port) : null)
    : null;
  // "Change plugs" asked for the switches before they were ready: focus the first one now.
  useEffect(() => {
    if (!open || !plugsOn || !focusPlugs.current) return;
    focusPlugs.current = false;
    root.current?.querySelector<HTMLElement>('[role=menuitemcheckbox]')?.focus();
  }, [open, plugsOn]);
  const togglePlug = (p: DcPlug) => {
    if (!mine || !plugsOn) return;
    const next = plugsOn.includes(p) ? plugsOn.filter((x) => x !== p) : [...plugsOn, p];
    setMyCar({ ...mine, plugs: DC_PLUGS.filter((x) => next.includes(x)) });
  };

  // The picker dialog: a modal <dialog>, so focus stays inside, Escape closes it and focus goes back.
  const openPicker = (from: HTMLElement | null) => {
    opener.current = from ?? button.current;
    setOpen(false);
    setPicking(true);
    dialog.current?.showModal();
    if (!cars) {
      setCarsFailed(false);
      fetch('/data/index.json')
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((list: IndexEntry[]) => setCars(list))
        .catch(() => setCarsFailed(true));
    }
  };
  const openPickerRef = useRef(openPicker);
  openPickerRef.current = openPicker;
  const closePicker = () => dialog.current?.close();
  useEffect(() => {
    // Focus the search box once the picker is in the dialog.
    if (picking && cars) dialog.current?.querySelector<HTMLInputElement>('input[type=search]')?.focus();
  }, [picking, cars]);
  const onPick = (carId: string, trimId: string | null, plugs: DcPlug[] | null) => {
    const e = cars?.find((c) => c.id === carId);
    // B58: the plug switches shown in the dialog are saved with the car (none changed and a new
    // car: its own plug, worked out from its file when needed).
    setMyCar({ carId, trimId, label: e ? carLabel(e) : undefined, ...(plugs ? { plugs } : {}) });
    closePicker();
  };

  if (!ready) return null;
  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...(root.current?.querySelectorAll<HTMLElement>('[role=menuitem], [role=menuitemcheckbox]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
  };

  return (
    <div className="chips">
      {showCompare && count > 0 && (
        <a className="chip" href="/compare"><span className="chip-text">{t('compare.chip', { count })}</span></a>
      )}
      {!showMyCar ? null : mine ? (
        <div className="chip-menu" ref={root}>
          <button type="button" ref={button} className="chip" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span className="chip-text">{t('mycar.chip', { car: mine.label ?? mine.carId.split('/')[1] })}</span> <span aria-hidden="true">▾</span>
          </button>
          {open && (
            <div className="chip-pop" role="menu" aria-label={t('mycar.menu')} onKeyDown={onMenuKey}>
              <a role="menuitem" href={carHref(mine.carId, mine.trimId)}>{t('mycar.open')}</a>
              <button type="button" role="menuitem" onClick={() => openPicker(button.current)}>{t('mycar.change')}</button>
              <button type="button" role="menuitem" onClick={() => { setMyCar(null); setOpen(false); button.current?.focus(); }}>{t('mycar.forget')}</button>
              <div className="chip-plugs" role="group" aria-labelledby="mycar-plugs-label">
                <p id="mycar-plugs-label" className="chip-plugs-label">{t('mycar.plugs')}</p>
                {DC_PLUGS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={plugsOn ? plugsOn.includes(p) : false}
                    disabled={!plugsOn}
                    className="chip-plug"
                    onClick={(e) => { e.stopPropagation(); togglePlug(p); }}
                  >
                    <span className="switch" aria-hidden="true" />
                    <span>{t(`value.${p}` as MessageKey)}</span>
                  </button>
                ))}
                <p className="chip-plugs-note">{t('mycar.plugsNote')}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button type="button" className="chip" aria-haspopup="dialog" onClick={(e) => openPicker(e.currentTarget)}><span className="chip-text">{t('mycar.none')}</span></button>
      )}
      <dialog
        ref={dialog}
        className="picker-dialog"
        aria-label={t('picker.title')}
        onClose={() => { setPicking(false); (opener.current?.isConnected ? opener.current : document.querySelector<HTMLElement>('.chips .chip'))?.focus(); }}
        onClick={(e) => { if (e.target === e.currentTarget) closePicker(); }}
      >
        <button type="button" className="icon-btn picker-close" aria-label={t('picker.close')} onClick={closePicker}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        {picking && (cars
          ? <>
              <CarPicker cars={cars} level={2} onPick={onPick} onCancel={closePicker} tripTags
                savedPlugs={mine?.plugs ? { carId: mine.carId, plugs: mine.plugs } : null} initialCar={mine?.carId ?? null} />
            </>
          : <p className="picker-wait" role="status">{carsFailed ? t('picker.loadFailed') : t('picker.loading')}</p>)}
      </dialog>
    </div>
  );
}
