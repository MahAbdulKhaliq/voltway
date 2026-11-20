// Lists the charging/mapping fields still missing, per powertrain (owner 2026-11-19: no unknowns).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from '../scripts/lib/csv.ts';
const REQ = ['capacity_usable_kwh','dc_max_kw','chemistry','nominal_voltage_class','charge_port','ac_max_kw','supercharger_access','preconditioning'];
const walk = (d: string): string[] => readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(d,e.name)):e.name.endsWith('.json')?[join(d,e.name)]:[]);
const idx = JSON.parse(readFileSync('public/data/index.json','utf8')) as {id:string}[];
const cw = parseCsv(readFileSync('crosswalk/crosswalk.csv','utf8'));
const labels = new Map<string,string[]>();
for (const r of cw) if (r.source==='nrcan'||r.source==='epa') labels.set(r.variant_id,[...(labels.get(r.variant_id)??[]), `${r.source}: ${r.source_key}`]);
const byPt = new Map<string, any>();
for (const e of idx) {
  const c = JSON.parse(readFileSync(`public/data/cars/${e.id}.json`,'utf8'));
  const missing = REQ.filter(k => { const f = c.fields?.[k]; const v = f?.value?.value ?? f?.value; return v===undefined||v===null||v==='unknown'; });
  const pt = c.powertrain_id ?? `(none) ${c.id}`;
  const g = byPt.get(pt) ?? { powertrain_id: pt, model: c.id.split("/").slice(0,2).join("/"), missing: new Set<string>(), variants: [] as any[] };
  missing.forEach(m=>g.missing.add(m));
  g.variants.push({ id: c.id, year: c.year, markets: c.markets, name: c.name, missing, regulator: labels.get(c.id) ?? [] });
  byPt.set(pt, g);
}
const out = [...byPt.values()].map(g=>({...g, missing:[...g.missing]})).filter(g=>g.missing.length);
writeFileSync('research/powertrain-gaps.json', JSON.stringify(out,null,1));
const per: Record<string,number> = {};
for (const g of out) per[g.model]=(per[g.model]??0)+1;
console.log('powertrains with gaps', out.length, 'of', byPt.size, 'cars with gaps', out.reduce((n,g)=>n+g.variants.filter((v:any)=>v.missing.length).length,0));
console.log(per);
const f: Record<string,number> = {}; for (const g of out) for (const v of g.variants) for (const m of v.missing) f[m]=(f[m]??0)+1; console.log(f);
