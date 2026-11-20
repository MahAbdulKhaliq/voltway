// Which curves the Charging page offers (B92, 2026-11-19): the best curve is always shown; the
// Curve dropdown lists measured curves only, and appears only when there are two or more.
// A measured curve with open plausibility warnings (B95) is offered only once a person cleared it.

import type { CurveOut } from './types.ts';

const offerable = (c: CurveOut) => c.kind !== 'estimated' && (c.is_display_default || !c.issues?.length || Boolean(c.reviewed_note));

/** Curves for the dropdown, default first; empty when there is nothing to choose between. */
export function curveChoices(curves: CurveOut[]): CurveOut[] {
  const def = curves.find((c) => c.is_display_default) ?? curves[0];
  if (!def || def.kind === 'estimated') return [];
  const list = [def, ...curves.filter((c) => c !== def && offerable(c))];
  return list.length >= 2 ? list : [];
}

/** The year a curve was recorded for, when its id carries one (e.g. "insideevs-2024", "chargeprice-2021"). */
export function curveYear(c: CurveOut): string | null {
  return c.id.match(/-(\d{4})(?:-|$)/)?.[1] ?? null;
}
