// km/mi switch (browser only). Distances are rendered in km with data-km="…" and
// efficiency with data-whkm="…"; this rewrites their text for the chosen unit and tells
// islands (the curve viewer) via a "voltway:units" event. The choice is remembered.

import { t } from '../i18n/t.ts';
import { formatNumber, kmTo, whPerKmToDisplay, type DistanceUnit } from '../lib/units.ts';
import { getItem, setItem, KEYS } from '../lib/storage.ts';

export function currentUnit(): DistanceUnit {
  return getItem(KEYS.units) === 'mi' ? 'mi' : 'km';
}

export function applyUnits(unit: DistanceUnit): void {
  document.querySelectorAll<HTMLElement>('[data-km]').forEach((el) => {
    const km = Number(el.dataset.km);
    el.textContent = t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(km, unit)) });
  });
  document.querySelectorAll<HTMLElement>('[data-whkm]').forEach((el) => {
    const v = whPerKmToDisplay(Number(el.dataset.whkm), unit);
    el.textContent = t(unit === 'km' ? 'fmt.kwh100km' : 'fmt.kwh100mi', { value: formatNumber(v, 1) });
  });
  document.querySelectorAll<HTMLButtonElement>('.units button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.unit === unit)));
}

export function setUnit(unit: DistanceUnit): void {
  setItem(KEYS.units, unit);
  applyUnits(unit);
  window.dispatchEvent(new CustomEvent('voltway:units', { detail: unit }));
}
