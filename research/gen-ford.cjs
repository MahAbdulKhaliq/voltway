// Scratch script: revises research/batch-2026-11-19-ford.json from the first-draft copy (idempotent).
// Usage: node research/gen-ford.cjs <draft.json> <out.json>
const fs = require('fs');
const path = require('path');
const [draft, out] = process.argv.slice(2);
const b = JSON.parse(fs.readFileSync(draft, 'utf8'));
const clone = (x) => JSON.parse(JSON.stringify(x));
const ptYears = (id) => JSON.parse(fs.readFileSync(`data/powertrains/${id}.json`, 'utf8')).years;
const P = b.powertrains;
b.variants ??= {};

const tail = (id) => id.replace(/^ford\/[^/]+\//, '');
const isMme = (id) => id.includes('mustang-mach-e');

// ---- sources: add the sibling 2022 InsideEVs reuse (already present); nothing new needed ----

// ---- 1. Notes rewording ----
const PRECOND_MME = 'Estimated: Ford Canada says its electric vehicles use navigation-triggered battery preconditioning (route planning or choosing a DC fast charger in Connected Navigation, Google Maps or Apple Maps EV Routing). The cited page is silent on any manual control and on model years; I found no manual battery-preconditioning control documented in Ford support pages or owner forums (owners have asked for one since 2021), so automatic_with_navigation is the best fit, not a proven fact.';
const PRECOND_EARLY = ' Cars from 2021 and 2022 may predate the navigation trigger (the Ford Canada navigation page says earlier model years received it by software update), so the value for this model year is unconfirmed.';
const SC_PHRASE = 'the cited Ford page names no model years, so eligibility of this model year is not shown by it';
for (const [id, p] of Object.entries(P)) {
  const yrs = ptYears(id);
  for (const e of p.fields['battery.preconditioning'] ?? []) {
    e.notes = PRECOND_MME + (Math.min(...yrs) <= 2022 ? PRECOND_EARLY : '');
    e.low_confidence = true;
  }
  for (const e of p.variant_fields?.supercharger_access ?? []) {
    e.notes = e.notes.replace(/press reports 2021-2024 model-year Mach-E \/ Lightning eligible/, SC_PHRASE);
    e.low_confidence = true;
  }
  // 2021 DC estimates (change 7)
  if (/2021-/.test(id)) {
    for (const e of p.fields.dc_max_kw ?? []) {
      const kw = e.value;
      e.notes = `Estimated: the 2022 Ford spec sheet lists up to ${kw} kW for this pack and Wikipedia lists the same 115 / 150 kW for 2020-22, but the basis is unproven: InsideEVs (2022) says Ford "improved the fast charging curve" for 2022, so the 2021 peak may differ.`;
    }
  }
  // gross 78.21 / 142 are manufacturer figures, not independent tests (change 2)
  for (const e of p.fields['battery.capacity_gross_kwh'] ?? []) {
    if (e.value === 78.21) {
      e.kind = 'manufacturer';
      e.notes = "Electrek read 78.21 kWh (225 Ah at 347.8 V) from the pack shown at Ford's presentation; a manufacturer figure relayed by press, not an independent test.";
    }
    if (e.value === 142) {
      e.kind = 'manufacturer';
      e.notes = 'Battery Design lists the 2022 ER pack at 349 V x 408 Ah = 142 kWh total, from published Ford specs (limited data on the page). A published figure, not an independent test.';
    }
  }
  // chemistry on the 360-cell 2025/2026 ER (change: mention pack change)
  if (/20(25|26)-extended-range/.test(id)) {
    for (const e of p.fields['battery.chemistry'] ?? []) {
      e.notes = 'Estimated: ER packs through 2024 are NCM (InsideEVs 2023, relays Ford). The 2025 ER pack changed (360 cells instead of 376, 2025 Ford sheet) but no chemistry change was reported, so NCM is the likely chemistry, not a proven one.';
    }
  }
  // AC 11 kW: Canadian source missing
  for (const e of p.fields.ac_max_kw ?? []) {
    if (e.source_id === 'src-wikipedia-mach-e' && !/market/.test(e.notes)) {
      e.notes += ' Wikipedia does not name a market, so the Canadian car is unproven.';
    }
  }
}

// 2021 GT: usable and gross are estimates (page names ER only)
{
  const gt = P['ford/mustang-mach-e/2021-gt'].fields;
  gt['battery.capacity_usable_kwh'][0].kind = 'estimated';
  gt['battery.capacity_usable_kwh'][0].notes = 'Estimated: InsideEVs (2022) gives 88 kWh usable (2021) for the Extended Range; the page does not name the GT. The GT shares the ER pack (376 cells, 2023 Ford sheet), so 88 kWh.';
  gt['battery.capacity_gross_kwh'][0].kind = 'estimated';
  gt['battery.capacity_gross_kwh'][0].notes = 'Estimated: InsideEVs (2022) gives 98.8 kWh total for the Extended Range pack; the GT shares that pack (376 cells, 2023 Ford sheet).';
}

// 2022 SR RWD override notes (change 3)
{
  const v = b.variants['ford/mustang-mach-e/2022/standard-range-rwd'].fields;
  const note = 'Ford 2022 spec sheet: SR 70 kWh usable, up to 115 kW. Override: the shared powertrain (2023-standard-range-rwd) carries the 2023 LFP pack, but the 2022 car has the NMC pack.';
  v['battery.capacity_usable_kwh'][0].notes = note;
  v.dc_max_kw[0].notes = note.replace('70 kWh usable, up to 115 kW', 'up to 115 kW DC fast charge');
}

// ---- 2. Drop the 45 min 10-80 on the 2025/2026 ER (change 4) ----
for (const id of Object.keys(P)) {
  if (/20(25|26)-extended-range/.test(id) && isMme(id)) delete P[id].fields.published_10_80_min;
}

// ---- 3. Item 5: cover every required field on the powertrains whose imported rows get unlinked ----
const tpl = (id, field) => clone(P[id].fields[field][0]);
const GT = 'ford/mustang-mach-e/2026-gt';
const SR25 = 'ford/mustang-mach-e/2025-standard-range-rwd';
const S25 = 'src-ford-us-mme-specs-2025';

// GT and Rally: usable 91 (Ford 2025 sheet), gross 98.8 estimated from the 376-cell ER pack
P[GT].fields['battery.capacity_usable_kwh'][0].notes = 'Ford 2025 spec sheet: GT 91 kWh usable (376 cells); InsideEVs 2024 also 91 kWh. The 2026 sheet was not read, so low confidence. Replaces the imported OpenEV 82 kWh.';
const grossGT = {
  value: 98.8, kind: 'estimated', source_id: 'src-insideevs-mme-2022-usable', unit: 'kWh', low_confidence: true,
  notes: 'Estimated: InsideEVs (2022) gives 98.8 kWh total for the 91 kWh usable, 376-cell Extended Range pack; the 2025 Ford sheet lists the GT on the same 91 kWh / 376-cell pack. Replaces the imported OpenEV 88 kWh.'
};
P[GT].fields['battery.capacity_gross_kwh'] = [grossGT];
const R = P['ford/mustang-mach-e/2026-rally'];
R.fields['battery.capacity_usable_kwh'] = [{ value: 91, kind: 'manufacturer', source_id: S25, unit: 'kWh', low_confidence: true, notes: 'Ford 2025 spec sheet: the GT / Rally column lists 91 kWh usable (376 cells); the Rally is not named separately in the usable row, and the 2026 sheet was not read. Replaces the imported OpenEV 82 kWh.' }];
R.fields['battery.capacity_gross_kwh'] = [clone(grossGT)];
R.fields.dc_max_kw = [{ ...tpl(GT, 'dc_max_kw'), notes: 'Ford 2025 spec sheet: up to 150 kW DC fast charge (all trims); 2026 sheet not read.' }];
R.fields.ac_max_kw = [tpl(GT, 'ac_max_kw')];
R.variant_fields.charge_port = clone(P[GT].variant_fields.charge_port);

// Standard Range 2026 (LFP): usable 73 estimated from the 2025 SR
for (const id of ['ford/mustang-mach-e/2026-standard-range', 'ford/mustang-mach-e/2026-standard-range-awd']) {
  const p = P[id];
  p.fields['battery.capacity_usable_kwh'] = [{ value: 73, kind: 'estimated', source_id: S25, unit: 'kWh', low_confidence: true, notes: 'Estimated: Ford 2025 spec sheet lists SR RWD and SR eAWD at 73 kWh usable (108 LFP-pack cells); same hardware carried to 2026 (2025 vs 2026 compared; nothing shows a change). Replaces the imported OpenEV / Chargeprice figures (70 and 91 kWh).' }];
  p.fields['battery.capacity_gross_kwh'] = [{ value: 78.21, kind: 'estimated', source_id: 'src-electrek-ford-lfp-2023', unit: 'kWh', low_confidence: true, notes: 'Estimated: Electrek reports 78.21 kWh total for the 2023 LFP SR pack (108 cells, Ford presentation); the 2025 sheet lists the same 108-cell SR pack. Replaces the imported OpenEV 75.7 kWh (the older NMC pack).' }];
  p.fields.dc_max_kw = [{ ...tpl(SR25, 'dc_max_kw'), kind: 'estimated', notes: 'Estimated: Ford 2025 spec sheet: up to 150 kW DC fast charge (all trims); same hardware carried to 2026.' }];
  p.fields.ac_max_kw = [tpl(SR25, 'ac_max_kw')];
  p.fields.published_10_80_min = [tpl(SR25, 'published_10_80_min')];
  p.variant_fields.charge_port = clone(P[GT].variant_fields.charge_port);
}
// Extended Range 2026 (CA RWD-label and AWD): 88 from the 2025 sheet
for (const id of ['ford/mustang-mach-e/2026-extended-range', 'ford/mustang-mach-e/2026-extended-range-awd']) {
  const p = P[id];
  p.fields['battery.capacity_usable_kwh'] = [{ value: 88, kind: 'manufacturer', source_id: S25, unit: 'kWh', low_confidence: true, notes: 'Ford 2025 spec sheet: ER RWD and ER eAWD 88 kWh usable (360 cells); the 2026 sheet was not read. OpenEV and Chargeprice list 91 kWh (3 % apart, the older 376-cell pack).' }];
  p.fields.dc_max_kw = [{ ...tpl(GT, 'dc_max_kw'), notes: 'Ford 2025 spec sheet: up to 150 kW DC fast charge (all trims); 2026 sheet not read.' }];
  p.fields.ac_max_kw = [tpl(GT, 'ac_max_kw')];
  p.variant_fields.charge_port = clone(P[GT].variant_fields.charge_port);
}

// Lightning 2025
const FL = 'ford/f-150-lightning/';
const F25 = 'src-ford-us-fl-specs-2025';
const flPlat = P[FL + '2025-platinum'];
// Platinum covers 2022-2025: the 19.2 kW is right for 2022-2024 only; 2025 overridden per car (change 1)
flPlat.fields.ac_max_kw[0].notes = 'Ford 2023 spec sheet: ER 19.2 kW / 17.6 kW (Ford-quoted maximum input / output). Applies to the 2022-2024 cars; the 2025 car is overridden to 11.3 kW (2025 sheet). The 2024 sheet was not available, so 2024 is unproven.';
flPlat.fields['battery.capacity_usable_kwh'][0].notes = 'Ford 2023 spec sheet: ER 131 kWh usable (2025 sheet also 131; the 2025 Platinum column is marked on the 131 kWh row only). Replaces the imported OpenEV 123 kWh on the 2025 car.';
flPlat.fields['battery.capacity_gross_kwh'][0].notes = 'Battery Design lists the 2022 ER pack at 349 V x 408 Ah = 142 kWh total, from published Ford specs (limited data on the page). A published figure, not an independent test. Replaces the imported OpenEV 131 kWh (that is the usable figure).';
b.variants[FL + '2025/platinum'] = {
  fields: {
    ac_max_kw: [{ value: 11.3, kind: 'manufacturer', source_id: F25, unit: 'kW', notes: 'Ford 2025 spec sheet: onboard charger 11.3 kW / 10.5 kW (48 A) on every battery; 19.2 kW / 17.6 kW is a fleet-only option. Overrides the 2022-2024 value of 19.2 kW on the shared powertrain.' }]
  }
};
// 131 kWh ER and Pro ER 2025 (existing powertrain lacked usable / DC / AC / port)
const gross131 = {
  value: 142, kind: 'estimated', source_id: 'src-batterydesign-fl-er', unit: 'kWh', low_confidence: true,
  notes: 'Estimated: Battery Design gives 142 kWh total for the 131 kWh usable ER pack (2022); the 2025 Ford sheet lists the same 131 kWh usable. Same hardware, 2022 vs 2025 compared; nothing shows a change.'
};
for (const id of ['2025-extended-range-131-kwh', '2025-pro-extended-range-131-kwh']) {
  const p = P[FL + id];
  p.fields['battery.capacity_usable_kwh'] = [{ value: 131, kind: 'manufacturer', source_id: F25, unit: 'kWh', notes: 'Ford 2025 spec sheet: 131 kWh of usable energy. Replaces the imported OpenEV 123 kWh (that is the 123 kWh pack).' }];
  p.fields['battery.capacity_gross_kwh'] = [clone(gross131)];
  p.fields.dc_max_kw = [{ value: 150, kind: 'manufacturer', source_id: F25, unit: 'kW', notes: 'Ford 2025 spec sheet: 15-80 % DC fast charge, 150 kW+. OpenEV lists 155 kW (3 % apart).' }];
  p.fields.ac_max_kw = [{ value: 11.3, kind: 'manufacturer', source_id: F25, unit: 'kW', notes: 'Ford 2025 spec sheet: onboard charger 11.3 kW / 10.5 kW (48 A) on every battery; 19.2 kW is a fleet-only option.' }];
  p.variant_fields.charge_port = clone(flPlat.variant_fields.charge_port);
}
// 123 kWh ER 2025
{
  const p = P[FL + '2025-extended-range-123-kwh'];
  p.fields['battery.capacity_usable_kwh'] = [{ value: 123, kind: 'manufacturer', source_id: F25, unit: 'kWh', notes: 'Ford 2025 spec sheet: 123 kWh of usable energy.' }];
  p.fields.dc_max_kw = [{ value: 150, kind: 'manufacturer', source_id: F25, unit: 'kW', notes: 'Ford 2025 spec sheet: 15-80 % DC fast charge, 150 kW+. OpenEV lists 155 kW (3 % apart).' }];
  p.fields.ac_max_kw = [{ value: 11.3, kind: 'manufacturer', source_id: F25, unit: 'kW', notes: 'Ford 2025 spec sheet: onboard charger 11.3 kW / 10.5 kW (48 A) on every battery; 19.2 kW is a fleet-only option.' }];
  p.variant_fields.charge_port = clone(flPlat.variant_fields.charge_port);
}
// SR: 98 kWh usable wins over the imported 91
P[FL + '2025-standard-range'].fields['battery.capacity_usable_kwh'][0].notes = 'Ford 2023 and 2025 spec sheets: SR 98 kWh usable. Replaces the imported OpenEV 91 kWh on the 2025 car.';

// ---- 4. low_confidence for manufacturer values citing a sheet of another year (change 5) ----
const sheetYear = (sid) => { const m = /specs-(\d{4})$/.exec(sid); return m ? +m[1] : null; };
for (const [id, p] of Object.entries(P)) {
  const yrs = ptYears(id);
  for (const [field, list] of Object.entries(p.fields)) {
    for (const e of list) {
      const sy = sheetYear(e.source_id);
      if (!sy || e.kind !== 'manufacturer') continue;
      // the 2022 SR RWD car overrides the shared 2023 SR powertrain, so only 2023 cars take its values
      const effYears = /2023-standard-range/.test(id) ? yrs.filter((y) => y === 2023) : yrs;
      if (effYears.some((y) => y !== sy)) e.low_confidence = true;
    }
  }
}
// per-car overrides: sheet year vs car year
for (const [vid, vp] of Object.entries(b.variants)) {
  const y = +vid.split('/')[2];
  for (const list of Object.values(vp.fields ?? {})) for (const e of list) {
    const sy = sheetYear(e.source_id);
    if (sy && e.kind === 'manufacturer' && sy !== y) e.low_confidence = true;
  }
}

fs.writeFileSync(out, JSON.stringify(b, null, 2) + '\n');
console.log('written', out, Object.keys(P).length, 'powertrains');
