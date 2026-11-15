// Turns sourced values into on-screen text. Server-rendered pages use km and carry data
// attributes so the km/mi switch converts them in place; React islands pass the unit.

import { t, type MessageKey } from '../i18n/t.ts';
import { decimalsFor, formatNumber, kmTo, whPerKmToDisplay, type DistanceUnit } from './units.ts';
import type { SourcedValue } from './types.ts';

export interface Display {
  text: string;
  /** Attributes for the km/mi switch: data-km or data-whkm. */
  attrs: Record<string, string>;
}

export function valueLabel(v: string): string {
  const key = `value.${v}` as MessageKey;
  try {
    return t(key);
  } catch {
    return v;
  }
}

export function display(v: SourcedValue, unit: DistanceUnit = 'km'): Display {
  if (typeof v.value === 'string') return { text: valueLabel(v.value), attrs: {} };
  const n = v.value;
  switch (v.unit) {
    case 'km':
      return { text: t(unit === 'km' ? 'fmt.km' : 'fmt.mi', { value: formatNumber(kmTo(n, unit)) }), attrs: { 'data-km': String(n) } };
    case 'Wh/km':
      return { text: t(unit === 'km' ? 'fmt.kwh100km' : 'fmt.kwh100mi', { value: formatNumber(whPerKmToDisplay(n, unit), 1) }), attrs: { 'data-whkm': String(n) } };
    case 'kWh':
      return { text: t('fmt.kwh', { value: formatNumber(n, decimalsFor('kWh', n)) }), attrs: {} };
    case 'kW':
      return { text: t('fmt.kw', { value: formatNumber(n, Number.isInteger(n) ? 0 : 1) }), attrs: {} };
    case 'min':
      return { text: t('fmt.min', { value: formatNumber(n) }), attrs: {} };
    case 'h':
      return { text: t('fmt.h', { value: formatNumber(n, decimalsFor('h', n)) }), attrs: {} };
    case 'kg':
      return { text: t('fmt.kg', { value: formatNumber(n) }), attrs: {} };
    default:
      return { text: formatNumber(n, 1), attrs: {} };
  }
}

export const kindLabel = (kind: SourcedValue['kind']): string => t(`kind.${kind}` as MessageKey);
