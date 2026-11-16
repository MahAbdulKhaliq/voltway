// Station details (charger-map.md §5 popup table): a side panel on desktop, a bottom sheet on
// phones (CSS, ≤ 640 px). Opened by clicking a pin; Escape or the close button shuts it.

import { useEffect, useRef } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import type { MapFeature } from '../lib/map-data.ts';
import { PIN } from '../lib/map-icons.ts';
import {
  accessDetail,
  addressLine,
  directionsUrls,
  formatKw,
  localDate,
  sortedPorts,
  stationLevel,
  stationStatus,
  teslaNote,
} from '../lib/station-details.ts';

/** "2026-12-01" → "Dec 1, 2026" (read as a calendar date, not a UTC instant). */
function showDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface Props {
  station: MapFeature;
  /** Date of the last data pull (meta.json), for the footer. */
  updated: string | null;
  onClose: () => void;
}

export default function StationPanel({ station, updated, onClose }: Props) {
  const s = station.properties;
  const heading = useRef<HTMLHeadingElement>(null);
  const level = stationLevel(s.p);
  const status = stationStatus(s, localDate());
  const tesla = teslaNote(s.nw);
  const detail = accessDetail(s.ad);
  const address = addressLine(s);
  const links = directionsUrls(station.geometry.coordinates);
  const levelKey: MessageKey = level === 3 ? 'map.level3' : 'map.level2';

  // Move focus to the new station's name so keyboard and screen-reader users land in the panel.
  useEffect(() => heading.current?.focus(), [s.i]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside className="station-panel" aria-labelledby="station-name">
      <header className="station-head">
        <div>
          <h2 id="station-name" ref={heading} tabIndex={-1}>
            {s.n}
          </h2>
          <p className="station-sub small">
            <span className="level-badge" style={{ background: PIN.fill[level], color: PIN.glyph }}>
              {t(levelKey)}
            </span>
            {s.nw && <span>{s.nw}</span>}
          </p>
          {address && <p className="small muted station-address">{address}</p>}
        </div>
        <button type="button" className="station-close" aria-label={t('map.station.close')} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="station-body">
        <section>
          <h3>{t('map.station.ports')}</h3>
          <ul className="station-ports">
            {sortedPorts(s.p).map(([lv, plug, kw, count]) => {
              const k = formatKw(kw);
              return (
                <li key={`${lv}-${plug}-${kw}`}>
                  {t('map.station.port', {
                    count,
                    plug: t(`value.${plug}` as MessageKey),
                    power: k === null ? t('map.station.unknownPower') : t('map.station.kw', { kw: k }),
                  })}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h3>{t('map.station.access')}</h3>
          {s.rs ? (
            <p className="banner small" role="note">
              {t('map.station.restricted')}
              {detail && <> {t(`map.station.ad.${detail}` as MessageKey)}</>}
            </p>
          ) : (
            <p>
              {t('map.station.public')}
              {detail && <> · {t(`map.station.ad.${detail}` as MessageKey)}</>}
            </p>
          )}
          {s.h && <p className="small">{t('map.station.hours', { hours: s.h })}</p>}
          {tesla && (
            <p className="banner small" role="note">
              {t(tesla === 'supercharger' ? 'map.station.tesla' : 'map.station.teslaDestination')}
            </p>
          )}
        </section>

        <section>
          <h3>{t('map.station.pricing')}</h3>
          <p>{s.pr ?? <span className="muted">{t('map.station.notListed')}</span>}</p>
        </section>

        <section>
          <h3>{t('map.station.status')}</h3>
          {status.unavailable ? (
            <p className="banner small">
              {status.until
                ? t('map.station.unavailableUntil', { date: showDate(status.until) })
                : t('map.station.unavailable')}
            </p>
          ) : (
            <p>{t('map.station.available')}</p>
          )}
        </section>

        <section>
          <h3>{t('map.station.directions')}</h3>
          <ul className="station-links">
            <li>
              <a href={links.google} target="_blank" rel="noopener">
                {t('map.station.google')} <span className="sr-only">{t('map.station.newTab')}</span>
              </a>
            </li>
            <li>
              <a href={links.apple} target="_blank" rel="noopener">
                {t('map.station.apple')} <span className="sr-only">{t('map.station.newTab')}</span>
              </a>
            </li>
          </ul>
        </section>
      </div>

      <footer className="station-foot small muted">
        {updated && <p>{t('map.station.footer', { date: showDate(updated) })}</p>}
        {s.u && <p>{t('map.station.recordChanged', { date: showDate(s.u) })}</p>}
      </footer>
    </aside>
  );
}
