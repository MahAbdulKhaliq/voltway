// `npx tsx scripts/add-facts.ts <facts.json> [--check]`: merges researched facts into variant files.
// With --check it validates the batch against a temporary copy and writes nothing.
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
//
// Trim "wheels" (B14) are a list of factory options rather than sourced values, but each entry
// carries its own source_id, so they merge the same way:
//   "wheels": [ { "diameter_in": 20, "is_standard": true, "source_id": "src-…", "notes"?, "low_confidence"? } ]
// Trim keys: heat_pump, ac_max_kw, range_km, wheels.
//
// Charging curves (B16) go in a variant's "curves" list and are written to
// data/curves/<variant id>/<curve id>.json (an existing file with the same id is replaced):
//   "curves": [ { "id": "outofspec-2025", "kind": "tested" | "community" | "manufacturer",
//                 "source_id": "src-…", "points": [ {"soc_percent": 10, "power_kw": 230}, … ],
//                 "conditions"?: {…}, "notes"?, "low_confidence"? },
//               { "id": "borrowed-ev6-2025", "kind": "estimated", "low_confidence": true,
//                 "based_on": { "variant_id": "kia/ev6/2025/wind", "reason": "Same 84 kWh 800 V pack…" },
//                 "source_id": "<the sibling curve's source>", "points": [ … copied … ] } ]
// The data build picks the default curve; batches never set is_display_default.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { validateRepo } from './lib/validate-data.ts';

type Sourced = { source_id: string; [k: string]: unknown };
interface Patch {
  drivetrain?: string;
  fields?: Record<string, Sourced[]>;
  trims?: Record<string, Record<string, Sourced[]>>;
  curves?: ({ id: string } & Record<string, unknown>)[];
}

// `--check`: apply to a temporary copy of the data and run the full validator; real files untouched.
const check = process.argv.includes('--check');
const batchPath = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!batchPath) throw new Error('Usage: npx tsx scripts/add-facts.ts <batch.json> [--check]');
// Per powertrain (B95, DESIGN-9 §1; checklist 9.18): pack and charging figures go on the shared powertrain,
// so every model year and market edition on that hardware gets them.
//   "powertrains": { "<powertrain id>": {
//       "fields": { "battery.capacity_usable_kwh": [ … ], "dc_max_kw": [ … ], "ac_max_kw": [ … ], … },
//       "variant_fields": { "charge_port": [ … ], "supercharger_access": [ … ] },  // copied to every variant on it
//       "curves": [ … same shape as variant curves; written with powertrain_id … ] } }
interface PowertrainPatch { fields?: Record<string, Sourced[]>; variant_fields?: Record<string, Sourced[]>; curves?: Patch['curves'] }
const spec = JSON.parse(readFileSync(batchPath, 'utf8')) as { sources: { id: string }[]; variants?: Record<string, Patch>; powertrains?: Record<string, PowertrainPatch> };
spec.variants ??= {};

const realRoot = process.cwd();
const root = check ? mkdtempSync(join(tmpdir(), 'voltway-check-')) : realRoot;
if (check) for (const d of ['schema', 'data', 'crosswalk']) cpSync(join(realRoot, d), join(root, d), { recursive: true });

for (const s of spec.sources) {
  writeFileSync(join(root, 'data/sources', `${s.id}.json`), JSON.stringify(s, null, 2) + '\n');
}

const merge = (existing: unknown, add: Sourced[]): Sourced[] => {
  const keep = Array.isArray(existing) ? (existing as Sourced[]).filter((e) => !add.some((a) => a.source_id === e.source_id)) : [];
  return [...keep, ...add];
};

const setPath = (obj: any, path: string, values: Sourced[]) => {
  const keys = path.split('.');
  let node = obj;
  for (const k of keys.slice(0, -1)) node = node[k] ??= {};
  const last = keys[keys.length - 1];
  node[last] = merge(node[last], values);
};

if (spec.powertrains) {
  const listVariants = (d: string): string[] => readdirSync(d, { withFileTypes: true })
    .flatMap((e) => e.isDirectory() ? listVariants(join(d, e.name)) : e.name.endsWith('.json') ? [join(d, e.name)] : []);
  const byPowertrain = new Map<string, string[]>();
  for (const f of listVariants(join(root, 'data/variants'))) {
    const v = JSON.parse(readFileSync(f, 'utf8'));
    if (v.powertrain_id) byPowertrain.set(v.powertrain_id, [...(byPowertrain.get(v.powertrain_id) ?? []), v.id]);
  }
  for (const [id, patch] of Object.entries(spec.powertrains)) {
    const file = join(root, 'data/powertrains', `${id}.json`);
    if (!existsSync(file)) throw new Error(`No powertrain file for ${id}`);
    const p = JSON.parse(readFileSync(file, 'utf8'));
    for (const [path, values] of Object.entries(patch.fields ?? {})) setPath(p, path, values);
    const { id: _id, model_id, name, generation, years, notes, ...rest } = p;
    writeFileSync(file, JSON.stringify({ id: p.id, model_id, name, ...(generation ? { generation } : {}), years, ...rest, ...(notes ? { notes } : {}) }, null, 2) + '\n');
    for (const c of patch.curves ?? []) {
      if ('is_display_default' in c) throw new Error(`${id}: curve "${c.id}" sets is_display_default; the build picks the default`);
      const dir = join(root, 'data/curves', id);
      mkdirSync(dir, { recursive: true });
      const { id: curveId, ...cr } = c;
      writeFileSync(join(dir, `${curveId}.json`), JSON.stringify({ id: curveId, powertrain_id: id, ...cr, is_display_default: false }, null, 2) + '\n');
    }
    if (patch.variant_fields) {
      const vids = byPowertrain.get(id) ?? [];
      if (!vids.length) throw new Error(`${id}: no variant uses this powertrain`);
      for (const vid of vids) {
        const vp = (spec.variants[vid] ??= {});
        vp.fields = { ...(vp.fields ?? {}) };
        for (const [path, values] of Object.entries(patch.variant_fields)) if (!vp.fields[path]) vp.fields[path] = values;
      }
    }
    if (!check) console.log(`updated powertrain ${id}`);
  }
}

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
  for (const c of patch.curves ?? []) {
    if ('is_display_default' in c) throw new Error(`${id}: curve "${c.id}" sets is_display_default; the build picks the default`);
    const dir = join(root, 'data/curves', id);
    mkdirSync(dir, { recursive: true });
    const { id: curveId, ...rest } = c;
    writeFileSync(join(dir, `${curveId}.json`), JSON.stringify({ id: curveId, variant_id: id, ...rest, is_display_default: false }, null, 2) + '\n');
    if (!check) console.log(`curve ${id}/${curveId}`);
  }
  if (!check) console.log(`updated ${id}`);
}

if (check) {
  const { errors, counts } = validateRepo(root);
  rmSync(root, { recursive: true, force: true });
  if (errors.length) {
    console.error(`check: ${errors.length} error(s); nothing was written\n`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log(`check: OK, batch is valid (${counts.variants} variants, ${counts.sources} sources after applying); nothing was written`);
}
