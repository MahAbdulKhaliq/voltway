// Output check (CHECKLIST 1.7, QA 9.1): every figure in a built car file must be a sourced value
// (value + kind + source_id) whose source is listed in the file. Walks the whole file (fields,
// "other figures", trims, wheels, curves), so `npm run data:build` itself fails on an unsourced figure.

import type { CarDetail } from '../../src/lib/types.ts';

const isScalar = (v: unknown) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean';

export function outputProblems(car: CarDetail): string[] {
  const ids = new Set(car.sources.map((s) => s.id));
  const problems: string[] = [];
  const cite = (o: Record<string, unknown>, path: string, what: string) => {
    if (typeof o.source_id !== 'string' || !o.source_id) problems.push(`${car.id} ${path}: ${what} has no source_id`);
    else if (!ids.has(o.source_id)) problems.push(`${car.id} ${path}: ${what} cites unlisted source ${o.source_id}`);
  };
  const walk = (x: unknown, path: string): void => {
    if (Array.isArray(x)) { x.forEach((y, i) => walk(y, `${path}[${i}]`)); return; }
    if (!x || typeof x !== 'object') return;
    const o = x as Record<string, unknown>;
    // A sourced value: a scalar "value" (with or without kind). Field wrappers hold an object "value".
    if ('value' in o && isScalar(o.value)) {
      if (!o.kind) problems.push(`${car.id} ${path}: figure has no kind`);
      cite(o, path, 'figure');
    }
    if ('diameter_in' in o) cite(o, path, 'wheel');
    if ('points' in o && 'kind' in o) cite(o, path, 'curve');
    for (const [k, v] of Object.entries(o)) if (k !== 'sources' && k !== 'derived') walk(v, `${path}.${k}`);
  };
  walk(car, '');
  return problems;
}

/**
 * Map output check (DESIGN-map.md M4): every station in a built map file must carry the
 * source_id of a listed source record, and have coordinates and at least one port.
 */
export function mapOutputProblems(
  file: string,
  fc: { features: { properties: { i: number; src?: string; p?: unknown[] }; geometry: { coordinates: number[] } }[] },
  sourceIds: ReadonlySet<string>,
): string[] {
  const problems: string[] = [];
  for (const f of fc.features) {
    const { i, src, p } = f.properties;
    if (!src) problems.push(`${file} station ${i}: no source_id`);
    else if (!sourceIds.has(src)) problems.push(`${file} station ${i}: cites unlisted source ${src}`);
    if (!Array.isArray(p) || p.length === 0) problems.push(`${file} station ${i}: no ports`);
    const [lon, lat] = f.geometry.coordinates;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) problems.push(`${file} station ${i}: no coordinates`);
  }
  return problems;
}
