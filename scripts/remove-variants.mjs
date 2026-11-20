// Remove cars the owner leaves out (B100: obscure cars; B107: no DC fast charging).
// Deletes the variant files, then any powertrain, curve folder, model-year entry, model or make
// left with nothing; drops their crosswalk and catalogue-review rows; and lists their regulator
// ratings in crosswalk/not-sold.csv so the catalogue suggester never proposes them again.
//
//   node scripts/remove-variants.mjs --ids ids.txt --reason "Left out by the owner (B107): no DC fast charging." \
//     --decided "owner 2026-11-20: left out (no DC fast charging, B107)" [--dry]
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { formatJson } from './lib/format-json.ts';
import { join } from 'node:path';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const ids = new Set(readFileSync(arg('--ids'), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
const reason = arg('--reason'), decided = arg('--decided'), dry = process.argv.includes('--dry');
if (!reason || !decided) throw new Error('need --ids, --reason, --decided');
const walk = (d) => (existsSync(d) ? readdirSync(d).flatMap((e) => { const p = join(d, e); return statSync(p).isDirectory() ? walk(p) : [p]; }) : []);
const readJ = (f) => JSON.parse(readFileSync(f, 'utf8'));
const del = (p) => { if (!dry) rmSync(p, { recursive: true, force: true }); };

const all = walk('data/variants').filter((f) => f.endsWith('.json')).map((f) => ({ f, v: readJ(f) }));
const gone = all.filter(({ v }) => ids.has(v.id));
const missing = [...ids].filter((id) => !gone.some(({ v }) => v.id === id));
if (missing.length) throw new Error(`unknown ids: ${missing.join(', ')}`);
const kept = all.filter(({ v }) => !ids.has(v.id));
for (const { f } of gone) del(f);

// Powertrains and curves no remaining variant uses.
const ptKept = new Set(kept.map(({ v }) => v.powertrain_id));
const ptGone = [...new Set(gone.map(({ v }) => v.powertrain_id))].filter((p) => p && !ptKept.has(p));
for (const p of ptGone) { del(join('data/powertrains', p + '.json')); del(join('data/curves', p)); }

// Model years, models and makes left empty.
const keptYears = new Map();
for (const { v } of kept) (keptYears.get(v.model_id) ?? keptYears.set(v.model_id, new Set()).get(v.model_id)).add(v.year);
const models = [...new Set(gone.map(({ v }) => v.model_id))];
const modelsGone = [];
for (const m of models) {
  const f = join('data/models', m + '.json');
  const years = keptYears.get(m);
  if (!years) { del(f); modelsGone.push(m); continue; }
  const rec = readJ(f);
  rec.years = rec.years.filter((y) => years.has(y.year));
  const gens = new Set(rec.years.map((y) => y.generation));
  rec.generations = rec.generations.filter((g) => gens.has(g.id));
  if (!dry) writeFileSync(f, formatJson(rec));
}
const makesKept = new Set(kept.map(({ v }) => v.id.split('/')[0]));
const makesGone = [...new Set(gone.map(({ v }) => v.id.split('/')[0]))].filter((m) => !makesKept.has(m));
for (const m of makesGone) { del(join('data/makes', m + '.json')); for (const d of ['models', 'variants', 'powertrains', 'curves']) del(join('data', d, m)); }

// Crosswalk rows → not-sold rows (only for ratings no kept variant still uses).
const cw = readFileSync('crosswalk/crosswalk.csv', 'utf8').split('\n');
const keyOf = (l) => { const c = l.split(','); return `${c[1]}|${c[2]}`; };
const keptKeys = new Set(cw.slice(1).filter((l) => l && !ids.has(l.split(',')[0])).map(keyOf));
const ns = [];
const csvq = (s) => (/[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
for (const l of cw.slice(1)) {
  const c = l.split(',');
  if (!ids.has(c[0]) || keptKeys.has(keyOf(l))) continue;
  const parts = c[2].split(' · ');           // "2013 · smart · fortwo electric drive coupe[ · #33306]"
  const label = parts[2];
  const model = c[0].split('/').slice(0, 2).join('/');
  const market = c[1] === 'nrcan' ? 'CA' : 'US';
  ns.push([model, c[1], parts[0], csvq(label), market, csvq(reason), '', csvq(decided)].join(','));
}
const cwOut = cw.filter((l, i) => i === 0 || !ids.has(l.split(',')[0]));
const cr = readFileSync('crosswalk/catalogue-review.csv', 'utf8').split('\n');
const crOut = cr.filter((l, i) => i === 0 || !l.split(',').some((x) => ids.has(x)));
if (!dry) {
  writeFileSync('crosswalk/crosswalk.csv', cwOut.join('\n'));
  writeFileSync('crosswalk/catalogue-review.csv', crOut.join('\n'));
  let s = readFileSync('crosswalk/not-sold.csv', 'utf8'); if (!s.endsWith('\n')) s += '\n';
  writeFileSync('crosswalk/not-sold.csv', s + ns.map((r) => r + '\n').join(''));
}
console.log(`removed ${gone.length} variants, ${ptGone.length} powertrains, models ${modelsGone.join(' ') || '-'}, makes ${makesGone.join(' ') || '-'}; crosswalk rows ${cw.length - cwOut.length}, review rows ${cr.length - crOut.length}, not-sold rows +${ns.length}`);
