// Header chips (B40): My car (menu: open it, change it, forget it) and Compare (n), which is
// hidden while the list is empty. Both follow the "voltway:mycar" / "voltway:compare" events,
// so they update live when a page changes them.

import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n/t.ts';
import { getCompare, getMyCar, setMyCar, type MyCar } from '../lib/my-car.ts';

interface Props { /** Compare chip only once the Compare page exists (CLAUDE.md: hide links to parts not built). */ showCompare?: boolean }

const carHref = (id: string, trim: string | null) =>
  `/charging?car=${id.split('/').map(encodeURIComponent).join('/')}${trim ? `&trim=${encodeURIComponent(trim)}` : ''}`;

export default function HeaderChips({ showCompare = false }: Props) {
  const [mine, setMine] = useState<MyCar | null>(null);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

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
    return () => {
      window.removeEventListener('voltway:mycar', onMine);
      window.removeEventListener('voltway:compare', onCompare);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // The menu closes on Escape (focus back to the chip) and on a click outside it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    const onClick = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    root.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, [open]);

  if (!ready) return null;
  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...(root.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
  };

  return (
    <div className="chips">
      {showCompare && count > 0 && (
        <a className="chip" href="/compare"><span className="chip-text">{t('compare.chip', { count })}</span></a>
      )}
      {mine ? (
        <div className="chip-menu" ref={root}>
          <button type="button" ref={button} className="chip" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span className="chip-text">{t('mycar.chip', { car: mine.label ?? mine.carId.split('/')[1] })}</span> <span aria-hidden="true">▾</span>
          </button>
          {open && (
            <div className="chip-pop" role="menu" aria-label={t('mycar.menu')} onKeyDown={onMenuKey}>
              <a role="menuitem" href={carHref(mine.carId, mine.trimId)}>{t('mycar.open')}</a>
              <a role="menuitem" href="/charging?pick=1">{t('mycar.change')}</a>
              <button type="button" role="menuitem" onClick={() => { setMyCar(null); setOpen(false); button.current?.focus(); }}>{t('mycar.forget')}</button>
            </div>
          )}
        </div>
      ) : (
        <a className="chip" href="/charging?pick=1"><span className="chip-text">{t('mycar.none')}</span></a>
      )}
    </div>
  );
}
