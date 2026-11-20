// Move model years (or some variants) of one model into another model, e.g. a nameplate split
// (B101 bZ4X 2023-25 out of bZ; B102 LYRIQ-V out of LYRIQ). Moves variant, powertrain and curve
// files, rewrites every id reference under data/ and crosswalk/, and splits the model record.
//
//   node scripts/move-variants.mjs --from toyota/bz --to toyota/bz4x --name "bZ4X" \
//     --variants "^toyota/bz/(2023|2024|2025)/" [--trim-label "^bZ4X"] [--dry]
//
// --variants: regex on variant ids to move. --trim-label: regex on crosswalk/trim-names.csv labels
// (with the moved years) whose model_id moves too; defaults to every row of the moved years.
// Model-year entries move when every variant of that year moves; otherwise the year is copied.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, statSync, writeFileSync } from 'node:fs';
import { formatJson } from './lib/format-json.ts';
import { dirname, join } from 'node:path';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const from = arg('--from'), to = arg('--to'), name = arg('--name'), vre = new RegExp(arg('--variants') ?? '^$');
const trimLabel = arg('--trim-label') ? new RegExp(arg('--trim-label')) : null;
const dry = process.argv.includes('--dry');
if (!from || !to || !name) throw new Error('need --from, --to, --name, --variants');

const walk = (d) => (existsSync(d) ? readdirSync(d).flatMap((e) => { const p = join(d, e); return statSync(p).isDirectory() ? walk(p) : [p]; }) : []);
const readJ = (f) => JSON.parse(readFileSync(f, 'utf8'));
const writeJ = (f, o) => { if (!dry) { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, formatJson(o)); } };
const move = (a, b) => { if (!dry) { mkdirSync(dirname(b), { recursive: true }); renameSync(a, b); } };

// 1. Which variants and powertrains move.
const variants = walk(join('data/variants', from)).filter((f) => f.endsWith('.json')).map((f) => ({ f, v: readJ(f) }));
const moving = variants.filter(({ v }) => vre.test(v.id));
const staying = variants.filter(({ v }) => !vre.test(v.id));
if (!moving.length) throw new Error('no variants match');
const ids = new Map(); // old id -> new id (variants and powertrains)
for (const { v } of moving) ids.set(v.id, to + v.id.slice(from.length));
const ptStay = new Set(staying.map(({ v }) => v.powertrain_id));
for (const { v } of moving) {
  const pt = v.powertrain_id;
  if (pt?.startsWith(from + '/') && !ptStay.has(pt)) ids.set(pt, to + pt.slice(from.length));
}
console.log(`moving ${moving.length} variants, ${[...ids.keys()].filter((k) => !moving.some(({ v }) => v.id === k)).length} powertrains`);

// 2. Move files.
for (const { f, v } of moving) move(f, join('data/variants', ids.get(v.id) + '.json'));
for (const [old, nu] of ids) {
  const pf = join('data/powertrains', old + '.json');
  if (existsSync(pf)) move(pf, join('data/powertrains', nu + '.json'));
  const cd = join('data/curves', old);
  if (existsSync(cd)) for (const f of walk(cd)) move(f, join('data/curves', nu, f.slice(cd.length + 1)));
}

// 3. Rewrite id references (whole ids only) under data/ and crosswalk/.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const keys = [...ids.keys()].sort((a, b) => b.length - a.length);
const re = new RegExp(`(?<![\\w/-])(${keys.map(esc).join('|')})(?![\\w-])(?!/\\d)`, 'g');
let touched = 0;
for (const f of [...walk('data'), ...walk('crosswalk')].filter((x) => /\.(json|csv|md)$/.test(x) && !x.startsWith(join('data', 'imported')))) {
  const s = readFileSync(f, 'utf8');
  let out = s.replace(re, (m) => ids.get(m));
  // model_id fields of the moved records
  if (f.startsWith(join('data', 'variants', to)) || f.startsWith(join('data', 'powertrains', to))) out = out.replace(`"model_id": "${from}"`, `"model_id": "${to}"`);
  if (out !== s) { touched++; if (!dry) writeFileSync(f, out); }
}
console.log(`rewrote ids in ${touched} files`);

// 4. Split the model record.
const mf = join('data/models', from + '.json');
const model = readJ(mf);
const movedYears = new Set(moving.map(({ v }) => v.year));
const yearsGone = [...movedYears].filter((y) => !staying.some(({ v }) => v.year === y));
const nm = { ...model, id: to, name, years: model.years.filter((y) => movedYears.has(y.year)) };
const gens = new Set(nm.years.map((y) => y.generation));
nm.generations = model.generations.filter((g) => gens.has(g.id));
model.years = model.years.filter((y) => !yearsGone.includes(y.year));
const keep = new Set(model.years.map((y) => y.generation));
model.generations = model.generations.filter((g) => keep.has(g.id));
const target = join('data/models', to + '.json');
if (existsSync(target)) throw new Error(`${target} exists`);
writeJ(target, nm); writeJ(mf, model);

// 5. Trim-name map rows.
const tn = 'crosswalk/trim-names.csv';
const lines = readFileSync(tn, 'utf8').split('\n');
let tnMoved = 0;
const out = lines.map((l, i) => {
  if (!i || !l.startsWith(from + ',')) return l;
  const c = l.split(',');
  if (!movedYears.has(Number(c[2]))) return l;
  if (trimLabel && !trimLabel.test(c[3])) return l;
  tnMoved++;
  return to + l.slice(from.length);
});
if (!dry) writeFileSync(tn, out.join('\n'));
console.log(`model ${to}: years ${nm.years.map((y) => y.year).join(',')}; ${from} keeps ${model.years.map((y) => y.year).join(',')}; trim-name rows moved ${tnMoved}`);
if (!dry) for (const d of [join('data/variants', from), join('data/powertrains', from), join('data/curves', from)]) {
  const prune = (p) => { if (!existsSync(p) || !statSync(p).isDirectory()) return; for (const e of readdirSync(p)) prune(join(p, e)); if (!readdirSync(p).length) rmdirSync(p); };
  prune(d);
}
