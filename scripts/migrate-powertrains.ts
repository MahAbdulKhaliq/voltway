// One-off migration to the Phase 9 data model (B91, B95, DESIGN-9 §1, checklist 9.8):
// - each variant gets its own powertrain (1:1, so every figure stays the same); the pack and
//   charging-hardware figures move from the variant to data/powertrains/<make>/<model>/<slug>.json;
// - variants get powertrain_id and markets ["CA"] (today's list is all NRCan);
// - trim `name` becomes `names: { CA }`;
// - stored curves move from data/curves/<variant id>/ to data/curves/<powertrain id>/;
// - NRCan rows split only by wheel size ("(19" Wheels)" / "(20" Wheels)") become one trim with
//   two wheel options; the crosswalk rows point at the merged trim.
// Sharing a powertrain across model years happens when the catalogue adds them (9.12–9.15).
// Safe to re-run: variants that already have powertrain_id are skipped.

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { formatJson } from './lib/format-json.ts';
import { dirname, join } from 'node:path';
import { parseCsv, toCsv } from './lib/csv.ts';

const root = process.cwd();
const PT_FIELDS = ['ac_max_kw', 'dc_max_kw', 'published_10_80_min'] as const;
const WHEEL_SPLIT = /\s*\((\d{2})["″]? Wheels\)\s*$/i;

const listJson = (dir: string): string[] => {
  const out: string[] = [];
  const walk = (d: string) => { if (!existsSync(d)) return; for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (n.endsWith('.json')) out.push(f); } };
  walk(dir);
  return out.sort();
};
const load = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const save = (f: string, x: unknown) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, formatJson(x)); };

const models = new Map<string, any>(listJson(join(root, 'data/models')).map((f) => { const m = load(f); return [m.id, m]; }));
const cwFile = join(root, 'crosswalk/crosswalk.csv');
const cwText = readFileSync(cwFile, 'utf8');
const cwHeader = cwText.slice(0, cwText.indexOf('\n')).replace(/\r$/, '').split(',');
const crosswalk = parseCsv(cwText);
const log: string[] = [];

for (const f of listJson(join(root, 'data/variants'))) {
  const v = load(f);
  if (v.powertrain_id) continue;
  const [make, model, year, slug] = v.id.split('/');
  const gen = (models.get(v.model_id)?.generations ?? []).find((g: any) => v.year >= g.first_year && (g.last_year === undefined || v.year <= g.last_year))?.id;
  const ptId = `${make}/${model}/${year}-${slug}`;
  const pt: Record<string, unknown> = { id: ptId, model_id: v.model_id, name: v.name, ...(gen ? { generation: gen } : {}), years: [v.year] };
  if (v.battery) { pt.battery = v.battery; delete v.battery; }
  for (const k of PT_FIELDS) if (k in v) { pt[k] = v[k]; delete v[k]; }
  save(join(root, 'data/powertrains', make, model, `${year}-${slug}.json`), pt);

  // Rebuild in schema order: id, model_id, year, name, drivetrain, powertrain_id, markets, rest.
  const { id, model_id, year: y, name, drivetrain, ...rest } = v;
  const out: Record<string, any> = { id, model_id, year: y, name, drivetrain, powertrain_id: ptId, markets: ['CA'], ...rest };

  // Trims: name → names.CA; merge wheel-only splits.
  const trims: any[] = out.trims ?? [];
  const groups = new Map<string, any[]>();
  for (const t of trims) {
    const base = t.name.replace(WHEEL_SPLIT, '');
    groups.set(base, [...(groups.get(base) ?? []), t]);
  }
  const merged: any[] = [];
  for (const [base, ts] of groups) {
    const split = ts.length > 1 && ts.every((t) => WHEEL_SPLIT.test(t.name));
    if (!split) { for (const t of ts) { const { name: n, ...r } = t; merged.push({ id: r.id, names: { CA: n }, ...Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'id')) }); } continue; }
    const keep = ts[0];
    const wheels = ts.flatMap((t) => t.wheels ?? []);
    const hp = ts.find((t) => t.heat_pump)?.heat_pump;
    const { name: _n, wheels: _w, heat_pump: _h, ...r } = keep;
    merged.push({ id: keep.id, names: { CA: base }, ...Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'id')), ...(hp ? { heat_pump: hp } : {}), ...(wheels.length ? { wheels } : {}) });
    for (const t of ts.slice(1)) for (const row of crosswalk) if (row.our_variant_id === v.id && row.our_trim_id === t.id) row.our_trim_id = keep.id;
    log.push(`${v.id}: merged wheel-split trims ${ts.map((t) => t.id).join(', ')} → ${keep.id} "${base}"`);
  }
  if (trims.length) out.trims = merged;
  save(f, out);

  // Curves.
  const cdir = join(root, 'data/curves', v.id);
  if (existsSync(cdir)) {
    for (const n of readdirSync(cdir).filter((x) => x.endsWith('.json'))) {
      const c = load(join(cdir, n));
      const { variant_id: _vid, ...cr } = c;
      const moved = { id: cr.id, powertrain_id: ptId, ...Object.fromEntries(Object.entries(cr).filter(([k]) => k !== 'id')) };
      save(join(root, 'data/curves', ptId, n), moved);
      renameSync(join(cdir, n), join(cdir, `${n}.migrated`));
    }
  }
  log.push(`${v.id} → ${ptId}`);
}

// Remove the old curve files and empty folders.
const sweep = (d: string): boolean => {
  if (!existsSync(d)) return true;
  let empty = true;
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (sweep(p)) rmdirSync(p); else empty = false; }
    else if (n.endsWith('.migrated')) unlinkSync(p);
    else empty = false;
  }
  return empty;
};
sweep(join(root, 'data/curves'));

writeFileSync(cwFile, toCsv(cwHeader, crosswalk));
console.log(log.join('\n'));
console.log(`migrate-powertrains: ${log.filter((l) => l.includes('→ ') && !l.includes('merged')).length} variants migrated`);
