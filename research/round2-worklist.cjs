// Round 2 (B103-B105) work list: trims with no factory wheels, by make.
// `node research/round2-worklist.cjs` writes research/round2-wheels-todo.json.
const fs = require('fs'), p = require('path');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(p.join(d, e.name)) : e.name.endsWith('.json') ? [p.join(d, e.name)] : []);
const out = {};
for (const f of walk('data/variants')) {
  const v = JSON.parse(fs.readFileSync(f, 'utf8'));
  const missing = (v.trims || []).filter((t) => !t.wheels || !t.wheels.length).map((t) => ({ trim_id: t.id, names: t.names }));
  if (!missing.length) continue;
  const make = v.id.split('/')[0];
  (out[make] ??= []).push({ variant_id: v.id, year: v.year, name: v.name, markets: v.markets, trims: missing });
}
fs.writeFileSync('research/round2-wheels-todo.json', JSON.stringify(out, null, 1) + '\n');
console.log(Object.entries(out).map(([m, l]) => `${m} ${l.length}`).join(', '));
