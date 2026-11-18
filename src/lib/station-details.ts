// Pure helpers for the station panel (charger-map.md §5 popup table, §6 status, §7 Tesla).
// The component turns these into translated text; nothing here returns user-facing words.

import type { MapPort, MapStationProps } from './map-data.ts';
import type { ChargerLevel } from './power-bands.ts';

/** The station's level for the header badge: Level 3 if any port is Level 3. */
export function stationLevel(ports: MapPort[]): ChargerLevel {
  return ports.some(([lv]) => lv === 3) ? 3 : 2;
}

/** Port lines, fastest first: Level 3 before Level 2, then by kW (unknown last), then by plug. */
export function sortedPorts(ports: MapPort[]): MapPort[] {
  return [...ports].sort(
    (a, b) => b[0] - a[0] || (b[2] ?? -1) - (a[2] ?? -1) || a[1].localeCompare(b[1]),
  );
}

/** "180", "7.2", "19.2": at most one decimal, no trailing zero. Null stays null (unknown power). */
export function formatKw(kw: number | null): string | null {
  if (kw === null) return null;
  return kw.toLocaleString('en-CA', { maximumFractionDigits: 1 });
}

/** AFDC access detail codes we explain; anything else is left to the hours text. */
export const ACCESS_DETAILS = ['CALL', 'LIMITED_HOURS', 'KEY_ALWAYS', 'CREDIT_CARD_ALWAYS'] as const;
export type AccessDetail = (typeof ACCESS_DETAILS)[number];

export function accessDetail(code: string | undefined): AccessDetail | null {
  return (ACCESS_DETAILS as readonly string[]).includes(code ?? '') ? (code as AccessDetail) : null;
}

/**
 * Whether the access row is a warning: restricted sites (customers only, limited hours…), and
 * also open sites the source marks "limited hours" or "call ahead", which can turn a driver away.
 */
export function accessWarning(s: Pick<MapStationProps, 'rs' | 'ad'>): boolean {
  const d = accessDetail(s.ad);
  return s.rs === 1 || d === 'LIMITED_HOURS' || d === 'CALL';
}

/** §7: Superchargers get the generic access note, Tesla Destination sites the customers-only note. */
export function teslaNote(network: string | undefined): 'supercharger' | 'destination' | null {
  if (network === 'Tesla') return 'supercharger';
  if (network === 'Tesla Destination') return 'destination';
  return null;
}

/**
 * §6 status. The expected reopening date is shown only while it is still ahead:
 * most dates in the source have already passed (M2 audit), and a past date would mislead.
 * `today` is YYYY-MM-DD in the visitor's time zone.
 */
export function stationStatus(
  s: Pick<MapStationProps, 't' | 'ed'>,
  today: string,
): { unavailable: false } | { unavailable: true; until: string | null } {
  if (!s.t) return { unavailable: false };
  return { unavailable: true, until: s.ed && s.ed > today ? s.ed : null };
}

/** Local date as YYYY-MM-DD (not UTC, so "today" matches the visitor's calendar). */
export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "123 Main St, Ottawa, ON K1A 0A1", skipping missing parts. */
export function addressLine(s: Pick<MapStationProps, 'a' | 'c' | 'r' | 'z'>): string {
  const region = [s.r, s.z].filter(Boolean).join(' ');
  return [s.a, s.c, region].filter(Boolean).join(', ');
}

/** Directions links (B72): the same module as Drive mode. */
export { directionsUrls } from './nav-links.ts';
