// Station details (charger-map.md §5 popup table): a side panel on desktop, a bottom sheet on
// phones (CSS, ≤ 640 px). Opened by clicking a pin; Escape or the close button shuts it.

import { useEffect, useRef } from 'react';
import { t, type MessageKey } from '../i18n/t.ts';
import type { MapFeature } from '../lib/map-data.ts';
import { needsAdapter, topDcKw, type CarMapInfo } from '../lib/map-filter.ts';
import type { MyCar } from '../lib/my-car.ts';
import { PIN } from '../lib/map-icons.ts';
import {
  accessDetail,
  accessWarning,
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
  /** My car and what the map knows about it (B28, B31); null when none is set or it is still loading. */
  myCar?: MyCar | null;
  carInfo?: CarMapInfo | null;
  /** "Route here" (B50): opens route mode on the same map with this station as To. */
  onRouteHere?: () => void;
}

export default function StationPanel({ station, updated, onClose, myCar = null, carInfo = null, onRouteHere }: Props) {
  const s = station.properties;
  const heading = useRef<HTMLHeadingElement>(null);
  const level = stationLevel(s.p);
  const status = stationStatus(s, localDate());
  const tesla = teslaNote(s.nw);
  const rule = carInfo?.rule ?? null;
  // My-car Tesla note (charger-map §7): hidden for a Tesla; adapter wording for a via-adapter car.
  const superNote: MessageKey | null =
    tesla !== 'supercharger' || carInfo?.isTesla
      ? null
      : carInfo?.access === 'via_adapter'
        ? 'map.station.teslaAdapter'
        : 'map.station.tesla';
  // "How fast would my car charge here?" (B31): only with My car and a DC port it can use.
  const capKw = myCar ? topDcKw(s.p, rule, s.nw) : null;
  const curveHref =
    myCar && capKw != null
      ? `/charging?${new URLSearchParams({
          car: myCar.carId,
          ...(myCar.trimId ? { trim: myCar.trimId } : {}),
          kw: String(Math.round(capKw)),
        }).toString()}`
      : null;
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
                  {needsAdapter(rule, plug, s.nw) && <> · <strong>{t('map.station.needsAdapter')}</strong></>}
                </li>
              );
            })}
          </ul>
        </section>

        {(curveHref || onRouteHere) && (
          <ul className="station-curve station-actions">
            {curveHref && <li><a href={curveHref}>{t('map.station.howFast')}</a></li>}
            {onRouteHere && <li><button type="button" className="linklike" onClick={onRouteHere}>{t('map.place.route')}</button></li>}
          </ul>
        )}

        <section>
          <h3>{t('map.station.access')}</h3>
          {accessWarning(s) ? (
            <p className="banner small" role="note">
              {s.rs ? t('map.station.restricted') : t('map.station.public')}
              {detail && <>{s.rs ? ' ' : ' · '}{t(`map.station.ad.${detail}` as MessageKey)}</>}
            </p>
          ) : (
            <p>
              {t('map.station.public')}
              {detail && <> · {t(`map.station.ad.${detail}` as MessageKey)}</>}
            </p>
          )}
          {s.h && <p className="small">{t('map.station.hours', { hours: s.h })}</p>}
          {superNote && (
            <p className="banner small" role="note">
              {t(superNote)}
            </p>
          )}
          {tesla === 'destination' && (
            <p className="banner small" role="note">
              {t('map.station.teslaDestination')}
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
