// node research/b112-worklist.cjs: writes research/b112-todo-<group>.json for the B112 round (adapters and
// heat pumps): every car with no adapter value or a trim with no heat pump, grouped by make.
const fs = require('fs'), path = require('path');
const GROUPS = {
  tesla: ['tesla'], porsche: ['porsche'], rivian: ['rivian'], mercedes: ['mercedes'],
  bmw: ['bmw', 'mini', 'rolls-royce'], hyundai: ['hyundai', 'genesis'], kia: ['kia'],
  'audi-vw': ['audi', 'volkswagen'], gm: ['chevrolet', 'cadillac', 'gmc'], 'ford-lucid': ['ford', 'lincoln', 'lucid'],
  'nissan-honda': ['nissan', 'mitsubishi', 'honda', 'acura', 'mazda'], toyota: ['toyota', 'lexus', 'subaru'],
  'volvo-polestar': ['volvo', 'polestar', 'lotus'],
  others: ['dodge', 'fiat', 'jeep', 'maserati', 'jaguar', 'vinfast', 'fisker', 'lordstown', 'rimac'],
};
const walk = (d) => fs.readdirSync(d).flatMap((e) => { const p = path.join(d, e); return fs.statSync(p).isDirectory() ? walk(p) : [p]; });
const cars = Object.fromEntries(walk('public/data/cars').map((f) => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); return [j.id, j]; }));
const known = (f) => f && f.value && f.value.value !== 'unknown';
const byGroup = {};
const makeGroup = Object.fromEntries(Object.entries(GROUPS).flatMap(([g, ms]) => ms.map((m) => [m, g])));
for (const f of walk('data/variants').filter((x) => x.endsWith('.json'))) {
  const v = JSON.parse(fs.readFileSync(f, 'utf8'));
  const c = cars[v.id];
  if (!c) continue;
  const adapterKnown = Array.isArray(v.adapters_included) && v.adapters_included.some((x) => x.value !== 'unknown');
  const trims = c.trims.filter((t) => !known(t.heat_pump)).map((t) => ({ id: t.id, names: t.names }));
  if (adapterKnown && !trims.length) continue;
  const make = v.id.split('/')[0];
  const g = makeGroup[make];
  if (!g) throw new Error('no group for ' + make);
  const model = v.model_id;
  const val = (k) => (c.fields[k] && c.fields[k].value ? c.fields[k].value.value : 'unknown');
  ((byGroup[g] ??= {})[model] ??= []).push({ id: v.id, year: v.year, name: v.name, markets: v.markets, charge_port: val('charge_port'), supercharger_access: val('supercharger_access'), needs_adapter: !adapterKnown, trims_needing_heat_pump: trims });
}
for (const [g, models] of Object.entries(byGroup)) {
  for (const list of Object.values(models)) list.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  fs.writeFileSync(`research/b112-todo-${g}.json`, JSON.stringify(models, null, 1) + '\n');
  const n = Object.values(models).flat();
  console.log(g.padEnd(16), 'cars', String(n.length).padStart(4), 'trims', n.reduce((a, x) => a + x.trims_needing_heat_pump.length, 0));
}
