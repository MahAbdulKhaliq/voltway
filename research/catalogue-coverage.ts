// `npx tsx research/catalogue-coverage.ts [fragment.json ...] [--make "Make"]...`
// Shows which NRCan/EPA ratings no model in crosswalk/catalogue-models.json (plus any fragment files
// with the same { models: [...] } shape) claims, grouped by make and model words. Used while setting up
// waves 2-3 (B90): a fragment is ready when its makes print no unmapped rows.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assignModel, type ModelMap } from '../scripts/lib/catalogue.ts';

const args = process.argv.slice(2);
const makes = args.flatMap((a, i) => (args[i - 1] === '--make' ? [a.toLowerCase()] : []));
const frags = args.filter((a, i) => a.endsWith('.json') && args[i - 1] !== '--make');
const map = JSON.parse(readFileSync('crosswalk/catalogue-models.json', 'utf8')) as ModelMap;
for (const f of frags) map.models.push(...(JSON.parse(readFileSync(f, 'utf8')) as ModelMap).models);
const rd = (d: string) => (existsSync(d) ? readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(d, f), 'utf8'))) : []);
const rows: any[] = [
  ...rd('data/imported/nrcan').flatMap((f: any) => f.records.map((r: any) => ({ source: 'nrcan', year: r.year, make: r.make, label: r.model }))),
  ...rd('data/imported/epa').flatMap((f: any) => f.records.map((r: any) => ({ source: 'epa', year: r.year, make: r.make, label: r.model, base_model: r.base_model }))),
].filter((r) => !makes.length || makes.includes(r.make.toLowerCase()));
const claimed = new Map<string, number>();
const un = new Map<string, { n: number; years: Set<number>; labels: Set<string> }>();
for (const r of rows) {
  const m = assignModel(r, map);
  if (m) { claimed.set(m, (claimed.get(m) ?? 0) + 1); continue; }
  const k = `${r.make} | ${r.source} | ${r.base_model ?? r.label.split(' ').slice(0, 2).join(' ')}`;
  const e = un.get(k) ?? { n: 0, years: new Set(), labels: new Set() };
  e.n++; e.years.add(r.year); if (e.labels.size < 3) e.labels.add(r.label); un.set(k, e);
}
for (const [m, n] of [...claimed].sort()) console.log(`claimed  ${m.padEnd(40)} ${n}`);
for (const [k, e] of [...un].sort()) { const y = [...e.years].sort(); console.log(`UNMAPPED ${k.padEnd(50)} ${e.n} ${y[0]}-${y.at(-1)}  e.g. ${[...e.labels].join(' / ')}`); }
console.log(`${un.size ? [...un.values()].reduce((a, e) => a + e.n, 0) : 0} unmapped of ${rows.length} rows`);
