// Generates research/batch-2026-11-16.json from the findings in research/NOTES.md.
// Direct reads of manufacturer pages: normal confidence. Quick web lookups: low_confidence.
// Run: node research/batch-2026-11-16.mjs && npx tsx scripts/add-facts.ts research/batch-2026-11-16.json
import { writeFileSync } from 'node:fs';

const D = '2026-11-15';
const QUICK = 'Quick web lookup (rough, not cross-checked).';
const src = (id, type, title, url, notes) => ({ id, type, title, url, accessed_on: D, ...(notes ? { notes } : {}) });
const num = (value, unit, source_id, extra = {}) => [{ value, unit, kind: 'manufacturer', source_id, ...extra }];
const fact = (value, source_id, extra = {}) => [{ value, kind: 'manufacturer', source_id, ...extra }];
const low = (notes) => ({ low_confidence: true, notes: notes ? `${QUICK} ${notes}` : QUICK });

const sources = [
  src('src-kia-ca-ev6-2025', 'oem', 'Kia Canada – 2025 EV6 page', 'https://www.kia.ca/en/vehicles/ev6', 'NACS port; heat pump standard on Wind and Land; 10–80% in as little as 20 minutes on a 350 kW charger.'),
  src('src-kia-ca-ev6-2025-specs', 'oem', 'Kia Canada – 2025 EV6 specifications', 'https://www.kia.ca/en/vehicles/ev6/specs', 'Charger power 10.9 kW; LIPB battery; 84 kWh. Trim tabs could not be confirmed separately.'),
  src('src-insideevs-2025-ev6-specs', 'community', 'InsideEVs – 2025 Kia EV6 US specs', 'https://insideevs.com/news/741756/2025-kia-ev6-specs-us/', 'Press article reporting Kia US specs.'),
  src('src-kia-ca-ev9-2026', 'oem', 'Kia Canada – 2026 EV9 page', 'https://www.kia.ca/en/vehicles/ev9', 'NACS port; heat pump standard on Wind, Land and GT; Light RWD 10–80% in as little as 20 minutes on 350 kW.'),
  src('src-slashgear-2026-ev9', 'community', 'SlashGear – 2026 Kia EV9 review', 'https://www.slashgear.com/2040439/2026-kia-ev9-review/', 'Press review; battery sizes match Kia NZ brochure.'),
  src('src-kia-ca-niro-ev-2026', 'oem', 'Kia Canada – 2026 Niro EV page', 'https://www.kia.ca/en/vehicles/niro/ev', 'Says the heat pump is available.'),
  src('src-auto123-ioniq-6-2025', 'community', 'auto123 – 2025 Hyundai IONIQ 6 Preferred AWD Long Range specs', 'https://www.auto123.com/en/specs/hyundai/ioniq-6/hyundai-ioniq-6-2025-preferred-awd-long-range-462829/'),
  src('src-chevrolet-equinox-ev', 'oem', 'Chevrolet (US) – Equinox EV page', 'https://www.chevrolet.com/equinox-ev', 'US-market page.'),
  src('src-thinkev-blazer-ev-2026', 'community', 'thinkEV – 2026 Chevrolet Blazer EV', 'https://thinkev.ca/compare/chevrolet-blazer-ev-2026'),
  src('src-gm-silverado-ev-2026-spec', 'oem', 'GM – 2026 Silverado EV Specification Guide (PDF)', 'https://www.gmupfitter.com/wp-content/uploads/2026/07/2026-Silverado-EV-Specification-Guide-072726.pdf', 'Up to 350 kW DC fast charging.'),
];

const v = {};
// Kia EV6 2025
for (const id of ['light', 'wind', 'land-awd']) {
  const big = id !== 'light';
  v[`kia/ev6/2025/${id}`] = {
    ...(id === 'light' || id === 'wind' ? { drivetrain: 'rwd' } : {}),
    fields: {
      charge_port: fact('nacs', 'src-kia-ca-ev6-2025'),
      supercharger_access: fact('yes', 'src-kia-ca-ev6-2025'),
      ac_max_kw: num(10.9, 'kW', 'src-kia-ca-ev6-2025-specs', { low_confidence: true, notes: 'Spec table value; not confirmed per trim.' }),
      'battery.capacity_gross_kwh': num(big ? 84 : 63, 'kWh', 'src-insideevs-2025-ev6-specs', low(big ? '84 kWh long-range pack.' : '63 kWh standard-range pack.')),
      'battery.nominal_voltage_class': fact('800v', 'src-insideevs-2025-ev6-specs', low()),
      dc_max_kw: num(big ? 240 : 180, 'kW', 'src-insideevs-2025-ev6-specs', low('US figure.')),
      ...(big ? { published_10_80_min: num(20, 'min', 'src-kia-ca-ev6-2025', { notes: '“As little as 20 minutes” on a 350 kW charger (best case).' }) } : {}),
    },
    ...(big ? { trims: { '*': { heat_pump: fact('standard', 'src-kia-ca-ev6-2025') } } } : {}),
  };
}
// Kia EV9 2026
for (const id of ['light', 'wind', 'land-awd', 'land-awd-gt-line', 'gt']) {
  const std = id === 'light';
  v[`kia/ev9/2026/${id}`] = {
    ...(id === 'light' || id === 'wind' ? { drivetrain: 'rwd' } : id === 'gt' ? { drivetrain: 'awd' } : {}),
    fields: {
      charge_port: fact('nacs', 'src-kia-ca-ev9-2026'),
      supercharger_access: fact('yes', 'src-kia-ca-ev9-2026'),
      'battery.capacity_gross_kwh': num(std ? 76.1 : 99.8, 'kWh', 'src-slashgear-2026-ev9', low('Gross capacity.')),
      'battery.nominal_voltage_class': fact('800v', 'src-slashgear-2026-ev9', low()),
      ...(std ? { published_10_80_min: num(20, 'min', 'src-kia-ca-ev9-2026', { notes: 'Light RWD, “as little as 20 minutes” on a 350 kW charger.' }) } : {}),
    },
    ...(!std ? { trims: { '*': { heat_pump: fact('standard', 'src-kia-ca-ev9-2026') } } } : {}),
  };
}
// Kia Niro EV 2026
v['kia/niro-ev/2026/standard'] = { trims: { '*': { heat_pump: fact('optional', 'src-kia-ca-niro-ev-2026', { notes: 'Page says the heat pump is “available”.' }) } } };
// Hyundai IONIQ 6 2025
for (const id of ['long-range', 'long-range-awd']) {
  v[`hyundai/ioniq-6/2025/${id}`] = {
    fields: {
      'battery.capacity_gross_kwh': num(77.4, 'kWh', 'src-auto123-ioniq-6-2025', low()),
      'battery.nominal_voltage_class': fact('800v', 'src-auto123-ioniq-6-2025', low()),
      ac_max_kw: num(10.9, 'kW', 'src-auto123-ioniq-6-2025', low()),
    },
    trims: { '*': { heat_pump: fact('standard', 'src-auto123-ioniq-6-2025', low('Dealer spec sheet lists a heat pump on RWD and AWD.')) } },
  };
}
// Chevrolet Equinox EV 2026
for (const id of ['standard', 'awd']) {
  v[`chevrolet/equinox-ev/2026/${id}`] = {
    ...(id === 'standard' ? { drivetrain: 'fwd' } : {}),
    fields: {
      'battery.capacity_gross_kwh': num(85, 'kWh', 'src-chevrolet-equinox-ev', low('“85 kWh battery pack”; gross or usable not stated.')),
      dc_max_kw: num(150, 'kW', 'src-chevrolet-equinox-ev', low()),
    },
    trims: { '*': { heat_pump: fact('standard', 'src-chevrolet-equinox-ev', low()) } },
  };
}
// Chevrolet Blazer EV 2026
for (const id of ['standard', 'lt-rs-awd', 'ss-awd']) {
  v[`chevrolet/blazer-ev/2026/${id}`] = {
    ...(id === 'standard' ? { drivetrain: 'fwd' } : {}),
    fields: {
      'battery.capacity_gross_kwh': num(id === 'ss-awd' ? 102 : 85, 'kWh', 'src-thinkev-blazer-ev-2026', low()),
      'battery.chemistry': fact('nmc', 'src-thinkev-blazer-ev-2026', low()),
      ...(id !== 'ss-awd' ? { dc_max_kw: num(190, 'kW', 'src-thinkev-blazer-ev-2026', low('Canadian listing; not confirmed by Chevrolet.')) } : {}),
    },
  };
}
// Chevrolet Silverado EV 2026
for (const id of ['lt-ext-range', 'lt-std-range', 'trail-boss-ext-range', 'wt-ext-range', 'wt-max-range', 'wt-std-range']) {
  v[`chevrolet/silverado-ev/2026/${id}`] = {
    drivetrain: 'awd',
    fields: {
      dc_max_kw: num(350, 'kW', 'src-gm-silverado-ev-2026-spec', low('“Up to 350 kW” public DC fast charging.')),
      'battery.nominal_voltage_class': fact('800v', 'src-gm-silverado-ev-2026-spec', low('Charges at about 800 V.')),
    },
  };
}

writeFileSync('research/batch-2026-11-16.json', JSON.stringify({ sources, variants: v }, null, 2) + '\n');
console.log(`wrote ${Object.keys(v).length} variants, ${sources.length} sources`);
