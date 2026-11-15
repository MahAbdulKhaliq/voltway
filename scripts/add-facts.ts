// `npx tsx scripts/add-facts.ts <facts.json>`: merges researched facts into variant files.
// The facts file lists sources (written to data/sources/) and, per variant, sourced values
// to add. A value replaces an earlier one from the same source for the same field, so
// re-running is safe; values from other sources are kept side by side (§3).
//
// facts.json shape:
// { "sources": [ {source record} ],
//   "variants": { "<variant id>": {
//       "drivetrain": "rwd",                      // optional, replaces "unknown"
//       "fields": { "battery.capacity_gross_kwh": [ {value, unit, kind, source_id, notes?} ], ... },
//       "trims": { "*" | "<trim id>": { "heat_pump": [ ... ], "ac_max_kw": [ ... ] } } } } }

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Sourced = { source_id: string; [k: string]: unknown };
interface Patch {
  drivetrain?: string;
  fields?: Record<string, Sourced[]>;
  trims?: Record<string, Record<string, Sourced[]>>;
}

const root = process.cwd();
const spec = JSON.parse(readFileSync(process.argv[2], 'utf8')) as { sources: { id: string }[]; variants: Record<string, Patch> };

for (const s of spec.sources) {
  writeFileSync(join(root, 'data/sources', `${s.id}.json`), JSON.stringify(s, null, 2) + '\n');
}

const merge = (existing: unknown, add: Sourced[]): Sourced[] => {
  const keep = Array.isArray(existing) ? (existing as Sourced[]).filter((e) => !add.some((a) => a.source_id === e.source_id)) : [];
  return [...keep, ...add];
};

for (const [id, patch] of Object.entries(spec.variants)) {
  const file = join(root, 'data/variants', `${id}.json`);
  if (!existsSync(file)) throw new Error(`No variant file for ${id}`);
  const v = JSON.parse(readFileSync(file, 'utf8'));
  if (patch.drivetrain) {
    if (v.drivetrain !== 'unknown' && v.drivetrain !== patch.drivetrain) throw new Error(`${id}: drivetrain is ${v.drivetrain}, facts say ${patch.drivetrain}`);
    v.drivetrain = patch.drivetrain;
  }
  for (const [path, values] of Object.entries(patch.fields ?? {})) {
    const keys = path.split('.');
    let node = v;
    for (const k of keys.slice(0, -1)) node = node[k] ??= {};
    const last = keys[keys.length - 1];
    node[last] = merge(node[last], values);
  }
  for (const [trimId, fields] of Object.entries(patch.trims ?? {})) {
    const targets = trimId === '*' ? v.trims : v.trims.filter((t: { id: string }) => t.id === trimId);
    if (!targets.length) throw new Error(`${id}: no trim "${trimId}"`);
    for (const t of targets) for (const [k, values] of Object.entries(fields)) t[k] = merge(t[k], values);
  }
  // Identity first, figures in the middle, trims last.
  const { id: _id, model_id, year, name, drivetrain, carry_over_from, trims, ...rest } = v;
  const ordered = { id: v.id, model_id, year, name, drivetrain, ...(carry_over_from ? { carry_over_from } : {}), ...rest, trims };
  writeFileSync(file, JSON.stringify(ordered, null, 2) + '\n');
  console.log(`updated ${id}`);
}
