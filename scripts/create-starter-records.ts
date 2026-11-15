// One-off generator for checklist 1.6 (run once after the owner approved the starter set, B8).
// Turns crosswalk/starter-set.json + crosswalk/suggestions.csv into:
//   data/makes/*.json, data/models/*/*.json, data/variants/*/*/*/*.json (skeletons with trims)
//   crosswalk/crosswalk.csv (the approved suggestions, confirmed=true)
// Figures are NOT copied here: they attach from data/imported/* at build time via the crosswalk.
// Hand-entered figures are added to the variant files afterwards, each with its own source.
// Refuses to overwrite existing records, so hand edits are never lost.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseCsv, toCsv } from './lib/csv.ts';
import { parseName, slugify, tokenize } from './lib/match.ts';

const root = process.cwd();
const APPROVAL = 'Approved by the owner 2026-11-15 (B8).';

interface StarterModel { make: string; nrcan_model_prefix: string; year: number; our_make: string; our_model: string; name: string; body_type: string }
const starter = JSON.parse(readFileSync(join(root, 'crosswalk/starter-set.json'), 'utf8')) as { models: StarterModel[] };
const suggestions = parseCsv(readFileSync(join(root, 'crosswalk/suggestions.csv'), 'utf8'));
const nrcanByKey = new Map<string, { model: string; make: string }>();
for (const y of new Set(starter.models.map((m) => m.year))) {
  for (const r of JSON.parse(readFileSync(join(root, `data/imported/nrcan/${y}.json`), 'utf8')).records) nrcanByKey.set(r.source_key, r);
}
const openevByKey = new Map<string, { drivetrain?: string }>();
for (const s of suggestions.filter((x) => x.source === 'openev')) {
  const make = s.source_key.split(':')[0].replace(/_/g, '-');
  const file = JSON.parse(readFileSync(join(root, `data/imported/openev/${make}.json`), 'utf8'));
  const rec = file.records.find((r: { source_key: string }) => r.source_key === s.source_key);
  if (rec) openevByKey.set(s.source_key, rec);
}

const write = (rel: string, data: unknown) => {
  const path = join(root, rel);
  if (existsSync(path)) { console.log(`  skip (exists): ${rel}`); return; }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
};

// Makes
const makes = new Map(starter.models.map((m) => [m.our_make, m.make]));
for (const [id, name] of makes) write(`data/makes/${id}.json`, { id, name });

// Models
for (const m of starter.models) {
  write(`data/models/${m.our_make}/${m.our_model}.json`, {
    id: `${m.our_make}/${m.our_model}`,
    make_id: m.our_make,
    name: m.name,
    body_type: m.body_type,
    years: [{ year: m.year, markets: ['CA'], availability_status: 'production' }],
  });
}

// Variants: one per variant id in the approved suggestions; one trim per NRCan row.
const crosswalk: Record<string, string | boolean>[] = [];
const byVariant = new Map<string, typeof suggestions>();
for (const s of suggestions) byVariant.set(s.our_variant_id, [...(byVariant.get(s.our_variant_id) ?? []), s]);

for (const [variantId, rows] of byVariant) {
  const [make, model, year] = variantId.split('/');
  const sm = starter.models.find((m) => m.our_make === make && m.our_model === model && String(m.year) === year)!;
  const nrcanRows = rows.filter((r) => r.source === 'nrcan').map((r) => ({ key: r.source_key, rec: nrcanByKey.get(r.source_key)! }));
  const prefixLen = tokenize(sm.nrcan_model_prefix).length;
  const head = parseName(nrcanRows[0].rec.model);
  // Variant name: NRCan's words after the model name, as NRCan writes them (minus wheel/charger/pack hints).
  const words = head.base.split(' ');
  const variantName = words.slice(prefixLen).join(' ').trim() || 'Standard';
  const ev = rows.find((r) => r.source === 'openev');
  const evDrive = ev ? openevByKey.get(ev.source_key)?.drivetrain : undefined;
  const drivetrain = head.drivetrain ?? (evDrive === 'fwd' || evDrive === 'rwd' || evDrive === 'awd' ? evDrive : 'unknown');

  const trims = nrcanRows.map(({ key, rec }) => {
    const p = parseName(rec.model);
    const hint = [p.wheel_in && `${p.wheel_in}-in-wheels`, p.charger_kw && `${String(p.charger_kw).replace('.', '-')}-kw-charger`].filter(Boolean).join('-');
    const id = nrcanRows.length === 1 ? 'standard' : hint || slugify(rec.model.split(' ').slice(prefixLen).join(' ')) || 'standard';
    crosswalk.push({ our_variant_id: variantId, source: 'nrcan', source_key: key, match_method: 'automatic', confirmed: true, our_trim_id: id, notes: APPROVAL });
    return { id, name: rec.model.split(' ').slice(prefixLen).join(' ') || sm.name };
  });

  for (const r of rows.filter((x) => x.source !== 'nrcan')) {
    crosswalk.push({ our_variant_id: variantId, source: r.source, source_key: r.source_key, match_method: 'automatic', confirmed: true, our_trim_id: '', notes: `${APPROVAL} Suggested because: ${r.notes}` });
  }

  write(`data/variants/${variantId}.json`, {
    id: variantId,
    model_id: `${make}/${model}`,
    year: Number(year),
    name: variantName,
    drivetrain,
    trims,
  });
}

const cwPath = join(root, 'crosswalk/crosswalk.csv');
if (existsSync(cwPath)) {
  console.log('  skip (exists): crosswalk/crosswalk.csv');
} else {
  writeFileSync(cwPath, toCsv(['our_variant_id', 'source', 'source_key', 'match_method', 'confirmed', 'our_trim_id', 'notes'], crosswalk));
}
console.log(`create-starter-records: ${makes.size} makes, ${starter.models.length} models, ${byVariant.size} variants, ${crosswalk.length} crosswalk rows`);
