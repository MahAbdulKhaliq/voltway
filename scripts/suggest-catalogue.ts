// `npm run suggest:catalogue -- --wave 1`: proposes the car list from both regulators (B90, B91,
// DESIGN-9 §2, checklist 9.12). Nothing goes live: it writes crosswalk/catalogue-review.md and
// crosswalk/catalogue-review.csv for the owner. `--apply` then writes skeleton records for the rows
// marked approved=yes (never overwriting a file), with confirmed crosswalk rows.
//
// Waves: 1 = the models in crosswalk/catalogue-models.json (our current models), every year;
//        2 = other models with a 2024+ row; 3 = everything else (older and discontinued models).

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseCsv, toCsv } from './lib/csv.ts';
import { groupRegulatorRows, assignModel, epaMotorKw, trimNameKey, type ModelMap, type RegRow, type Proposal } from './lib/catalogue.ts';

const root = process.cwd();
const args = process.argv.slice(2);
const wave = Number(args[args.indexOf('--wave') + 1] || 1);
const apply = args.includes('--apply');
const today = new Date().toISOString().slice(0, 10);
const load = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const readDir = (d: string) => (existsSync(join(root, d)) ? readdirSync(join(root, d)).filter((f) => f.endsWith('.json')).map((f) => load(join(root, d, f))) : []);

const map = load(join(root, 'crosswalk/catalogue-models.json')) as ModelMap;
const cwFile = join(root, 'crosswalk/crosswalk.csv');
const cwText = readFileSync(cwFile, 'utf8');
const cwHeader = cwText.slice(0, cwText.indexOf('\n')).replace(/\r$/, '').split(',');
const crosswalk = parseCsv(cwText);
const linked = new Set(crosswalk.filter((r) => r.source === 'nrcan' || r.source === 'epa').map((r) => `${r.source}|${r.source_key}`));

const nrcanMotor = new Map<string, number>();
for (const f of readDir('data/imported/nrcan')) for (const r of f.records) if (r.motor_kw?.[0]?.value) nrcanMotor.set(r.source_key, r.motor_kw[0].value);
const rows: RegRow[] = [
  ...readDir('data/imported/nrcan').flatMap((f) => f.records.map((r: any): RegRow => ({
    source: 'nrcan', market: 'CA', source_key: r.source_key, year: r.year, make: r.make, label: r.model, motor_kw: r.motor_kw?.[0]?.value ?? null,
  }))),
  ...readDir('data/imported/epa').flatMap((f) => f.records.map((r: any): RegRow => ({
    source: 'epa', market: 'US', source_key: r.source_key, year: r.year, make: r.make, label: r.model, base_model: r.base_model,
    drive: r.drive, motor_kw: epaMotorKw(r.motor),
  }))),
].filter((r) => !linked.has(`${r.source}|${r.source_key}`));

const csvFile = join(root, 'crosswalk/catalogue-review.csv');
// Researched buyer-facing names (B91, DESIGN-9 §2): one row per regulator label, with a cited source.
// Approving a proposal confirms the names of its rows (--apply sets confirmed=true).
const tnFile = join(root, 'crosswalk/trim-names.csv');
const TRIM_NAMES_HEADER = ['model_id', 'source', 'year', 'label', 'market', 'trim_name', 'dealer_trims', 'source_url', 'notes', 'confirmed'];
const tnRows = existsSync(tnFile) ? parseCsv(readFileSync(tnFile, 'utf8')) : [];
const trimNames = new Map<string, string>(
  tnRows
    .filter((r) => r.trim_name)
    .map((r) => [trimNameKey(r.source, r.year, r.label), r.trim_name]),
);
// A re-run keeps the owner's approvals for proposals that didn't change.
const kept = new Map<string, string>(
  (existsSync(csvFile) ? parseCsv(readFileSync(csvFile, 'utf8')) : [])
    .filter((r) => r.approved)
    .map((r) => [`${r.proposal}|${r.source}|${r.source_key}`, r.approved]),
);
const HEADER = ['approved', 'check', 'named', 'proposal', 'model_id', 'year', 'variant_id', 'markets', 'drivetrain', 'powertrain', 'trim_ca', 'trim_us', 'wheels', 'flags', 'source', 'source_key'];

if (apply) {
  const review = parseCsv(readFileSync(csvFile, 'utf8')).filter((r) => r.approved.trim().toLowerCase() === 'yes');
  const byProposal = new Map<string, Record<string, string>[]>();
  for (const r of review) byProposal.set(r.proposal, [...(byProposal.get(r.proposal) ?? []), r]);
  let written = 0;
  for (const [, group] of byProposal) {
    const p = group[0];
    const [make, model, year, slug] = p.variant_id.split('/');
    const vFile = join(root, 'data/variants', `${p.variant_id}.json`);
    if (existsSync(vFile)) { console.log(`skip ${p.variant_id}: exists`); continue; }
    const markets = p.markets.split(' ').filter(Boolean);
    const mFile = join(root, 'data/models', `${p.model_id}.json`);
    const m = load(mFile);
    const gen = (m.generations ?? []).find((g: any) => Number(year) >= g.first_year && (g.last_year === undefined || Number(year) <= g.last_year))?.id;
    const y = m.years.find((x: any) => x.year === Number(year));
    if (y) y.markets = [...new Set([...y.markets, ...markets])].sort();
    else m.years.push({ year: Number(year), markets, availability_status: 'production', ...(gen ? { generation: gen } : {}) });
    m.years.sort((a: any, b: any) => a.year - b.year);
    writeFileSync(mFile, JSON.stringify(m, null, 2) + '\n');
    // Powertrain: an existing one (its years grow) or a new one for this year.
    const ptId = p.powertrain.startsWith('new') ? `${make}/${model}/${year}-${slug}` : p.powertrain;
    const ptFile = join(root, 'data/powertrains', `${ptId}.json`);
    if (existsSync(ptFile)) {
      const pt = load(ptFile);
      if (!pt.years.includes(Number(year))) { pt.years = [...pt.years, Number(year)].sort(); writeFileSync(ptFile, JSON.stringify(pt, null, 2) + '\n'); }
    } else {
      mkdirSync(dirname(ptFile), { recursive: true });
      writeFileSync(ptFile, JSON.stringify({ id: ptId, model_id: p.model_id, name: p.trim_ca || p.trim_us, ...(gen ? { generation: gen } : {}), years: [Number(year)] }, null, 2) + '\n');
    }
    const names: Record<string, string> = {};
    if (p.trim_ca) names.CA = p.trim_ca;
    if (p.trim_us) names.US = p.trim_us;
    const variant = { id: p.variant_id, model_id: p.model_id, year: Number(year), name: p.trim_ca || p.trim_us, drivetrain: p.drivetrain || 'unknown', powertrain_id: ptId, markets, trims: [{ id: 'standard', names }] };
    mkdirSync(dirname(vFile), { recursive: true });
    writeFileSync(vFile, JSON.stringify(variant, null, 2) + '\n');
    for (const r of group) crosswalk.push({ our_variant_id: p.variant_id, source: r.source, source_key: r.source_key, match_method: 'manual', confirmed: 'true', our_trim_id: 'standard', notes: `Approved by the owner ${today} (B90 wave ${wave}).` });
    written++;
  }
  writeFileSync(cwFile, toCsv(cwHeader, crosswalk));
  const approvedLabels = new Set(review.map((r) => r.source_key));
  const labelOf = new Map(rows.map((r) => [r.source_key, trimNameKey(r.source, r.year, r.label)]));
  const keys = new Set([...approvedLabels].map((k) => labelOf.get(k)));
  for (const t of tnRows) if (keys.has(trimNameKey(t.source, t.year, t.label))) t.confirmed = 'true';
  if (tnRows.length) writeFileSync(tnFile, toCsv(TRIM_NAMES_HEADER, tnRows));
  console.log(`suggest-catalogue --apply: ${written} variants written`);
  process.exit(0);
}

// Suggest.
const ours = map.models.map((m) => m.id);
const assigned = rows.map((r) => ({ r, model: assignModel(r, map) }));
const inWave = assigned.filter(({ r, model }) => {
  if (wave === 1) return model !== null;
  if (model !== null) return false;
  const recent = assigned.some((x) => x.model === null && x.r.make === r.make && (x.r.base_model ?? x.r.label.split(' ')[0]) === (r.base_model ?? r.label.split(' ')[0]) && x.r.year >= 2024);
  return wave === 2 ? recent : !recent;
});

const existingVariants = new Map<string, any>();
const walk = (d: string): string[] => (existsSync(d) ? readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)])) : []);
for (const f of walk(join(root, 'data/variants'))) {
  const v = load(f);
  const key = crosswalk.find((r) => r.our_variant_id === v.id && r.source === 'nrcan' && r.confirmed === 'true')?.source_key;
  existingVariants.set(v.id, { ...v, motor_kw: key ? nrcanMotor.get(key) ?? null : null });
}

const proposals: Proposal[] = groupRegulatorRows(inWave.map((x) => ({ ...x.r, model_id: x.model ?? undefined })), existingVariants, crosswalk, map, (modelId, year) => {
  const f = join(root, 'data/models', `${modelId}.json`);
  if (!existsSync(f)) return undefined;
  return (load(f).generations ?? []).find((g: any) => year >= g.first_year && (g.last_year === undefined || year <= g.last_year))?.id;
}, trimNames);

const csvRows = proposals.flatMap((p) => p.rows.map((r) => ({
  approved: kept.get(`${p.id}|${r.source}|${r.source_key}`) ?? '', check: p.flags.length ? 'yes' : '', named: p.named ? 'yes' : '', proposal: p.id, model_id: p.model_id, year: p.year, variant_id: p.variant_id, markets: p.markets.join(' '), drivetrain: p.drivetrain ?? '',
  powertrain: p.powertrain, trim_ca: p.names.CA ?? '', trim_us: p.names.US ?? '', wheels: p.wheels.join(' '), flags: p.flags.join('; '), source: r.source, source_key: r.source_key,
})));
writeFileSync(csvFile, toCsv(HEADER, csvRows));

// --seed-names: add this wave's regulator labels to crosswalk/trim-names.csv (names blank) for research.
if (args.includes('--seed-names')) {
  const have = new Set(tnRows.map((t) => trimNameKey(t.source, t.year, t.label)));
  let added = 0;
  for (const p of proposals) for (const r of p.rows) {
    const k = trimNameKey(r.source, r.year, r.label);
    if (have.has(k)) continue;
    have.add(k);
    tnRows.push({ model_id: p.model_id, source: r.source, year: String(r.year), label: r.label.replace(/\s+/g, ' ').trim(), market: r.market, trim_name: '', dealer_trims: '', source_url: '', notes: '', confirmed: 'false' });
    added++;
  }
  tnRows.sort((a, b) => a.model_id.localeCompare(b.model_id) || Number(a.year) - Number(b.year) || a.market.localeCompare(b.market) || a.label.localeCompare(b.label));
  writeFileSync(tnFile, toCsv(TRIM_NAMES_HEADER, tnRows));
  console.log(`trim-names.csv: ${added} labels added (${tnRows.length} in all)`);
}

const md: string[] = [
  `# Catalogue review: wave ${wave}`,
  '',
  `Generated ${today} by \`npm run suggest:catalogue -- --wave ${wave}\` (B90, DESIGN-9 §2). **Nothing here is live.** Each proposal is one variant: a model year × pack × drivetrain × market edition. Rows from NRCan (Canada) and EPA (US) are paired when their trim words and drivetrain agree; otherwise each country gets its own variant (B91).`,
  '',
  'How to review: in `crosswalk/catalogue-review.csv`, set `approved` to `yes` on the rows to keep (all rows of a proposal), edit `trim_ca` / `trim_us` / `variant_id` / `powertrain` where they are wrong, then run `npm run suggest:catalogue -- --wave ' + wave + ' --apply`. Flags: ⚠ code = NRCan letter code (plant or certification, not a trim name), ⚠ date = mid-year change, ⚠ pair = Canada/US pairing is a guess, ⚠ name = trim name needs a check.',
  '',
  `${proposals.length} proposals from ${inWave.length} regulator rows (${ours.length} mapped models): ${proposals.filter((p) => !p.flags.length).length} clean (no ⚠, \`check\` empty in the CSV), ${proposals.filter((p) => p.flags.length).length} to check.`,
  '',
];
let lastModel = '';
for (const p of proposals) {
  if (p.model_id !== lastModel) { md.push(`## ${p.model_id}`, ''); lastModel = p.model_id; }
  const names = Object.entries(p.names).map(([k, v]) => `${k}: ${v}`).join(' · ');
  md.push(`- **${p.year} ${names}** → \`${p.variant_id}\` [${p.markets.join(', ')}] ${p.drivetrain ?? 'drivetrain ?'}${p.wheels.length ? ` · wheels ${p.wheels.join('/')}″` : ''} · powertrain ${p.powertrain}${p.named ? '' : ' · names: regulator wording'}${p.flags.length ? ` · ⚠ ${p.flags.join('; ')}` : ''}`);
  for (const r of p.rows) md.push(`  - ${r.source === 'nrcan' ? 'NRCan' : 'EPA'}: ${r.label}`);
}
writeFileSync(join(root, 'crosswalk/catalogue-review.md'), md.join('\n') + '\n');
console.log(`suggest-catalogue: wave ${wave}: ${proposals.length} proposals from ${inWave.length} rows → crosswalk/catalogue-review.{md,csv}`);
