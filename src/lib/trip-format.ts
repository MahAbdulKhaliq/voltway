// Small formatters for the trip itinerary (route-planner.md §7), kept apart so tests can use them.

import { t } from '../i18n/t.ts';
import type { MyCar } from './my-car.ts';
import type { TripStop } from './trip-plan.ts';
import { formatNumber } from './units.ts';

/** "1 stop" / "3 stops". */
export const stopsText = (n: number) => (n === 1 ? t('trip.stopsOne') : t('trip.stopsMany', { n }));

/** Minutes → "1 h 55 min" / "45 min" / "2 h". */
export function hoursMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  if (!h) return t('fmt.min', { value: m });
  return m % 60 ? t('trip.hm', { h, m: m % 60 }) : t('trip.h', { h });
}

/** "2026-12-01" → "Dec 1, 2026" (a calendar date, not a UTC instant). */
export function showDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** A whole percent, never below 0 (a stop reached "below empty" reads as 0 %; the warning says why). */
export const pct = (x: number) => formatNumber(Math.max(0, Math.round(x)));

/** "See the charging curve for this stop": the car, this charger's usable kW and this stop's window. */
export function stopCurveHref(car: MyCar, stop: Pick<TripStop, 'usableKw' | 'arriveSoc' | 'departSoc'>): string {
  const q = new URLSearchParams({ car: car.carId });
  if (car.trimId) q.set('trim', car.trimId);
  q.set('kw', String(Math.round(stop.usableKw)));
  q.set('from', String(Math.max(0, Math.round(stop.arriveSoc))));
  q.set('to', String(Math.round(stop.departSoc)));
  return `/charging?${q.toString()}`;
}
