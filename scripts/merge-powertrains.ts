// Merge powertrain records that are identical apart from their id, name and years (B111, owner
// 2026-11-20). B95 meant one powertrain to cover every year its pack and charging hardware stayed the
// same; research rounds wrote one per model year. Two records merge only when their figures, notes and
// curves are all the same, so no car gains or loses anything. The earliest record's id is kept; its
// years become the union. Variants and curves are repointed, duplicate curve folders removed.
//
//   npx tsx scripts/merge-powertrains.ts [--dry]
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatJson } from './lib/format-json.ts';

const dry = process.argv.includes('--dry');
const walk = (d: string): string[] => (existsSync(d) ? readdirSync(d).flatMap((e) => { const p = join(d, e); return statSync(p).isDirectory() ? walk(p) : [p]; }) : []);
const readJ = (f: string): any => JSON.parse(readFileSync(f, 'utf8'));
const write = (f: string, o: unknown) => { if (!dry) writeFileSync(f, formatJson(o)); };

const pts = walk('data/powertrains').filter((f) => f.endsWith('.json')).map((f) => ({ f, p: readJ(f) }));
const curvesOf = (id: string) => {
  const d = join('data/curves', id);
  if (!existsSync(d) || !statSync(d).isDirectory()) return [];
  return readdirSync(d).filter((x) => x.endsWith('.json')).sort().map((x) => { const { powertrain_id, ...c } = readJ(join(d, x)); return [x, c]; });
};
type Pt = { f: string; p: any };
const key = ({ p }: Pt) => { const { id, name, years, ...rest } = p; return JSON.stringify([rest, curvesOf(p.id)]); };

const groups = new Map<string, Pt[]>();
for (const x of pts) (groups.get(key(x)) ?? groups.set(key(x), []).get(key(x))!).push(x);

const rename = new Map<string, string>(); // old id -> kept id
for (const g of groups.values()) {
  if (g.length < 2) continue;
  g.sort((a, b) => Math.min(...a.p.years) - Math.min(...b.p.years) || a.p.id.localeCompare(b.p.id));
  const [keep, ...rest] = g;
  keep.p.years = [...new Set(g.flatMap((x) => x.p.years))].sort((a: number, b: number) => a - b);
  write(keep.f, keep.p);
  for (const x of rest) {
    rename.set(x.p.id, keep.p.id);
    if (!dry) { rmSync(x.f); rmSync(join('data/curves', x.p.id), { recursive: true, force: true }); }
  }
}

// Repoint variants (curves of merged records were identical, so the kept folder already holds them).
let variants = 0;
for (const f of walk('data/variants').filter((x) => x.endsWith('.json'))) {
  const v = readJ(f);
  const to = rename.get(v.powertrain_id);
  if (to) { v.powertrain_id = to; write(f, v); variants++; }
}
console.log(`powertrains ${pts.length} -> ${pts.length - rename.size} (merged ${rename.size}); variants repointed ${variants}`);
if (!dry) writeFileSync('crosswalk/powertrain-merges.csv', 'old_id,kept_id\n' + [...rename].map(([a, b]) => `${a},${b}`).join('\n') + '\n');
