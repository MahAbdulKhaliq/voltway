// Output check (CHECKLIST 1.7, QA 9.1): every figure in a built car file must be a sourced value
// (value + kind + source_id) whose source is listed in the file. Walks the whole file (fields,
// "other figures", trims, curves), so `npm run data:build` itself fails on an unsourced figure.

import type { CarDetail } from '../../src/lib/types.ts';

export function outputProblems(car: CarDetail): string[] {
  const ids = new Set(car.sources.map((s) => s.id));
  const problems: string[] = [];
  const walk = (x: unknown, path: string): void => {
    if (Array.isArray(x)) { x.forEach((y, i) => walk(y, `${path}[${i}]`)); return; }
    if (!x || typeof x !== 'object') return;
    const o = x as Record<string, unknown>;
    if ('value' in o && 'kind' in o) {
      if (typeof o.source_id !== 'string' || !o.source_id) problems.push(`${car.id} ${path}: no source_id`);
      else if (!ids.has(o.source_id)) problems.push(`${car.id} ${path}: cites unlisted source ${o.source_id}`);
    }
    if ('points' in o && 'kind' in o && !ids.has(String(o.source_id))) problems.push(`${car.id} ${path}: curve cites unlisted source ${String(o.source_id)}`);
    for (const [k, v] of Object.entries(o)) if (k !== 'sources') walk(v, `${path}.${k}`);
  };
  walk(car, '');
  return problems;
}
