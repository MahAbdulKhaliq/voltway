// Scratch generator for research/batch-2026-11-19-w2-tesla.json (Model S, Model X, Cybertruck).
const fs = require('fs');
const T = '2026-11-19';
const gaps = JSON.parse(fs.readFileSync('research/powertrain-gaps.json', 'utf8'))
  .filter((e) => /^tesla\/(model-s|model-x|cybertruck)$/.test(e.model));

const S = (id, type, title, url, notes) => ({ id: 'src-' + id, type, title, url, accessed_on: T, notes });
const sources = [
  S('arenaev-model-s-85', 'community', 'ArenaEV: Tesla Model S 85 (2012-2016)', 'https://www.arenaev.com/tesla_model_s_85_2012-specs-199.php', '85 kWh nominal, liquid-cooled Li-ion, 350 V; no net figure. DC and AC figures on this page are European (Type 2, 16.5 kW AC, 150 kW Supercharger V2) and are not used.'),
  S('arenaev-model-s-60', 'community', 'ArenaEV: Tesla Model S 60 (2012-2016)', 'https://m.arenaev.com/tesla_model_s_60_2012-specs-197.php', '60 kWh nominal, 300 V; no net figure.'),
  S('arenaev-model-s-70d', 'community', 'ArenaEV: Tesla Model S 70D (2015-2016)', 'https://www.arenaev.com/tesla_model_s_70d_2015-specs-198.php', '70 kWh nominal, 300 V; no net figure.'),
  S('arenaev-model-s-75', 'community', 'ArenaEV: Tesla Model S 75 (2016-2017)', 'https://www.arenaev.com/tesla_model_s_75_2016-specs-191.php', '75 kWh gross/nominal, 72.6 kWh net/usable, 300 V.'),
  S('arenaev-model-s-90d', 'community', 'ArenaEV: Tesla Model S 90D (2015-2016)', 'https://m.arenaev.com/tesla_model_s_90d_2015-specs-203.php', '90 kWh nominal, 350 V; no net figure.'),
  S('arenaev-model-s-100d', 'community', 'ArenaEV: Tesla Model S 100D (2017-2018)', 'https://www.arenaev.com/tesla_model_s_100d_2017-specs-195.php', '100 kWh gross, 95 kWh net/usable, 350 V.'),
  S('arenaev-model-s-sr-2019', 'community', 'ArenaEV: Tesla Model S Standard Range (2019)', 'https://www.arenaev.com/tesla_model_s_sr_2019-specs-187.php', '75 kWh total (nominal), 350 V; no net figure.'),
  S('arenaev-model-s-lr-2019', 'community', 'ArenaEV: Tesla Model S Long Range (2019)', 'https://www.arenaev.com/tesla_model_s_lr_2019-specs-52.php', '100 kWh gross, 95 kWh usable.'),
  S('arenaev-model-s-lrplus-2020', 'community', 'ArenaEV: Tesla Model S Long Range+ (2020)', 'https://www.arenaev.com/tesla_model_s_lr+_2020-specs-188.php', '100 kWh nominal, 94 kWh net.'),
  S('arenaev-model-s-plaid-2021', 'community', 'ArenaEV: Tesla Model S Plaid (2021)', 'https://www.arenaev.com/tesla_model_s_plaid_2021-specs-53.php', '100 kWh total, 92.3 kWh usable, 350 V (EVSpecs says 99 kWh, 400-407 V).'),
  S('arenaev-model-s-plaid-2025', 'community', 'ArenaEV: Tesla Model S Plaid (2025)', 'https://m.arenaev.com/tesla_model_s_plaid_2025-specs-839.php', '100 kWh total, 92.3 kWh usable.'),
  S('arenaev-model-x-60d', 'community', 'ArenaEV: Tesla Model X 60D (2016)', 'https://m.arenaev.com/tesla_model_x_60d_2016-specs-215.php', '61 kWh gross, 58.5 kWh net, 300 V.'),
  S('arenaev-model-x-75d', 'community', 'ArenaEV: Tesla Model X 75D (2016-2018)', 'https://www.arenaev.com/tesla_model_x_75d_2016-specs-214.php', '75 kWh gross, 72.6 kWh net, 300 V.'),
  S('arenaev-model-x-90d', 'community', 'ArenaEV: Tesla Model X 90D (2016-2017)', 'https://m.arenaev.com/tesla_model_x_90d_2016-specs-213.php', '85.8 kWh total (gross), 81.8 kWh usable (net), 350 V.'),
  S('arenaev-model-x-100d', 'community', 'ArenaEV: Tesla Model X 100D (2017-2019)', 'https://www.arenaev.com/tesla_model_x_100d_2017-specs-48.php', '100 kWh gross, 95 kWh net, 350 V.'),
  S('arenaev-model-x-lr-2019', 'community', 'ArenaEV: Tesla Model X Long Range (2019-2021)', 'https://www.arenaev.com/tesla_model_x_lr_2019-specs-275.php', '100 kWh total, 350 V; no net figure.'),
  S('evspecs-model-s-2012-85', 'community', 'EVSpecifications: 2012 Tesla Model S Signature 85 RWD', 'https://www.evspecifications.com/en/model/54972b', '85 kWh, NCA, 346 V, 7,104 Panasonic NCR18650A cells; DC max 90 kW; the AC line (11.5 kW, 240 V 48 A) disagrees with Tesla VIN codes (10/20 kW) and is not used for 2012-2013.'),
  S('evspecs-model-s-2014-85', 'community', 'EVSpecifications: 2014 Tesla Model S 85 RWD', 'https://www.evspecifications.com/en/model/81ed2f', '85 kWh, NCA, 346 V, DC max 120 kW.'),
  S('evspecs-model-s-2018-100d-compare', 'community', 'EVSpecifications: 2018 Model S P100D / 100D / 75D and 2018 Model X P100D', 'https://www.evspecifications.com/en/comparison/b8873c31', 'North American listings: S 100D/P100D 100 kWh NCA 400 V 8,256 cells, AC 11.5 kW, DC 120 kW; S 75D 75 kWh 302 V 5,880 cells, AC 11.5 kW, DC 120 kW; X P100D AC 17.28 kW, DC 145 kW.'),
  S('evspecs-model-s-2017-90d-75d-compare', 'community', 'EVSpecifications: 2018 Model S 100D, 2017 90D, 2017 75D', 'https://www.evspecifications.com/en/comparison/70a828b7', '90D: 90 kWh, NCA, 346 V, 7,104 cells, AC 11.5 kW, DC 120 kW; 75D 75 kWh 302 V, AC 11.5, DC 120.'),
  S('evspecs-model-s-2021-plaid', 'community', 'EVSpecifications: 2021 Tesla Model S Plaid', 'https://www.evspecifications.com/en/model/500c10a', '99 kWh, NCA, 400 V, 7,920 cells, AC 11.5 kW, DC max 200 kW (differs from Tesla 250 kW claim).'),
  S('evspecs-model-s-2023-plaid', 'community', 'EVSpecifications: 2023 Tesla Model S Plaid', 'https://www.evspecifications.com/en/model/fe20295', '99 kWh, NCA, 407 V, AC 11.5 kW, DC 250 kW, NACS port.'),
  S('evspecs-model-s-2025-plaid', 'community', 'EVSpecifications: 2025 Tesla Model S Plaid', 'https://www.evspecifications.com/en/model/df813e7', '99 kWh, NCA, 407 V, AC 11.5 kW, DC 250 kW, NACS port.'),
  S('evspecs-model-x-2023-plaid', 'community', 'EVSpecifications: 2023 Tesla Model X Plaid', 'https://www.evspecifications.com/en/model/48a9297', '99 kWh, NCA, 407 V, AC 16.5 kW (7.4 kW option), DC 250 kW.'),
  S('tesla-s-service-vin-2012-2020', 'oem', 'Tesla 2012-2020 Model S Service Manual: VIN reference', 'https://service.tesla.com/docs/ModelS/ServiceManual/en-us/GUID-BED77626-E575-4DB7-8C1F-CFA600EAA082.html', '2012-2013 VIN digit 7 charger codes: 10 kW charger, 20 kW charger, each with or without DC fast charge; battery tiers 31-40, 51-60 and 81-90 kWh (2012-2013). No charger codes for 2014 and later.'),
  S('electrek-2020-s-x-225kw', 'community', 'Electrek: Tesla Model S and X Supercharging rate increases to 225 kW (2020-06-24)', 'https://electrek.co/2020/06/24/tesla-model-s-x-supercharging-rate-increase-225-kw/', 'Release note: when you navigate to a Supercharger the car conditions its battery during the drive. Raven Model S/X 200 kW before, 225 kW after software 2020.24.6; only recent cars got it.'),
  S('insideevs-s-x-250kw-wires', 'community', 'InsideEVs: Tesla Model S/X now charge at up to 250 kW after thicker wiring (2020)', 'https://insideevs.com/news/433707/thicker-wires-model-sx-charging-250-kw/', 'Tesla design studio lists up to 250 kW for newly ordered Model S and X; previous maximum 225 kW (Raven 200 kW before that); V3 peak 250 kW, V2 150 kW.'),
  S('insideevs-plaid-supercharging-2021', 'community', 'InsideEVs: Tesla Plaid Supercharging (2021)', 'https://insideevs.com/news/513343/tesla-supercharging-plaid/', 'Model S/X Long Range (Raven, July 2020) 250 kW peak; Plaid 187 miles in 15 minutes (Tesla image); pack kWh and voltage not stated.'),
  S('wikipedia-tesla-model-s', 'community', 'Wikipedia: Tesla Model S', 'https://en.wikipedia.org/wiki/Tesla_Model_S', 'NCA 18650 cells; 2013 60 kWh pack software-limited to 40; 2016 60 kWh upgradable to 75 by software; pre-2016 cars could have two onboard chargers (62 mi of range per hour); Supercharger network from late 2012; 2021 Plaid 95 kWh (article figure differs from other sources).'),
  S('wikipedia-tesla-model-x', 'community', 'Wikipedia: Tesla Model X', 'https://en.wikipedia.org/wiki/Tesla_Model_X', '60D is a 75 kWh pack software-limited to 60 kWh; packs 60, 75, 90, 100 kWh; discontinued 2026. No onboard charger or DC figures.'),
  S('manualslib-tesla-s-owners-manual-p145', 'community', "ManualsLib: Tesla Model S Owner's Manual (page 145 of 253, undated)", 'https://www.manualslib.com/manual/2044361/Tesla-S.html?page=145', 'Quote: "When navigating to a Supercharger location, Model S may allocate energy to pre-heat the Battery". Edition and model years not stated on the page.'),
  S('tmc-on-route-battery-warmup-2019', 'community', 'Tesla Motors Club: No nav in my car, can I use on-route battery warmup (2019-03-07)', 'https://teslamotorsclub.com/tmc/threads/no-nav-in-my-car-can-i-use-on-route-battery-warmup.144937/', 'Forum: early Model S could be ordered without navigation (Tech Package); poster doubts warm-up works without nav. No MCU1 statement.'),
  S('notebookcheck-tesla-precond-season', 'community', 'Notebookcheck: Tesla battery preconditioning adapts to the season', 'https://www.notebookcheck.net/Tesla-battery-preconditioning-adapts-to-the-season-to-knock-10-minutes-off-a-Supercharger-session.1147843.0.html', 'Trip Planner navigation starts battery warm-up before a Supercharger; names Cybertruck (800 V, 4680); no manual control mentioned.'),
  S('insideevs-cybertruck-epa-docs', 'community', 'InsideEVs: Cybertruck battery size and heat pump revealed in EPA docs', 'https://insideevs.com/news/699248/tesla-cybertruck-battery-size-and-heat-pump/', 'EPA certification: 816 V total pack voltage; derived 122.4 kWh; unofficial 123 kWh.'),
  S('insideevs-cybertruck-320kw', 'community', 'InsideEVs: Cybertruck Supercharging at 320+ kW (2024-08-05)', 'https://insideevs.com/news/729088/tesla-cybertruck-supercharging-320kw/', 'Recorded peak 325 kW at 18 % SoC on V4 posts with V3 cabinets; earlier about 255 kW; stated spec 250 kW; 800 V class; 123 kWh.'),
  S('ifixit-cybertruck', 'community', 'iFixit: Tesla Cybertruck', 'https://www.ifixit.com/Device/Tesla_Cybertruck', '123 kWh lithium-ion, 816 V, 150 Ah; AC onboard charger 11.5 kW at 240 V 48 A; DC up to 250 kW at 400 V and 350 kW at 800 V.'),
  S('insideevs-cybertruck-battery-passport', 'community', 'InsideEVs: Cybertruck battery passport (4680 cell)', 'https://insideevs.com/news/724981/tesla-cybertruck-battery-passport-4680cell/', 'NCM cathode, 4680 cells (1,344 per pack), 123 kWh total energy, 800 V class; no usable figure.'),
  S('gcc-cybertruck-lr-rwd', 'community', 'Green Cars Compare: Tesla Cybertruck Long Range RWD specs', 'https://greencarscompare.com/car/tesla-cybertruck-single-motor-rwd/specs/', '122.4 kWh gross, 117 kWh usable, 800 V, DC 325 kW (253 kW at 400 V), AC 11.5 kW. Vehicle trim labelled 2025.'),
  S('arenaev-cybertruck-awd-2026', 'community', 'ArenaEV: Tesla Cybertruck Dual Motor All-Wheel Drive (2026)', 'https://www.arenaev.com/tesla_cybertruck_dual_motor_all_wheel_drive_2026-specs-916.php', '123 kWh total, 111.9 kWh usable, Li-NMC 800 V, DC 250 kW (older figure).'),
];

// ---------- packs ----------
const NOTE_PORT = 'Tesla connector (now NACS / SAE J3400) on every Tesla since the 2012 Model S; Canada and US cars alike (Wikipedia NACS article; EVSpecifications lists "NACS / Tesla (SAE J3400)" on Model S Plaid pages).';
const fld = (value, unit, kind, src, notes, low = true) => {
  const o = { value };
  if (unit) o.unit = unit;
  o.kind = kind; o.source_id = 'src-' + src; if (low) o.low_confidence = true; o.notes = notes; return o;
};
const est = (n) => 'Estimated: ' + n;

const COMMON_CHEM = (src) => fld('nca', null, 'community', src, 'NCA (nickel-cobalt-aluminium) cylindrical 18650 cells (Wikipedia Model S: graphite/silicon anode, NCA cathode; EVSpecifications lists Panasonic NCR18650A, LiNiCoAlO2).');

// pack: {gross:[val,kind,src,notes], usable:[...], volt, dc:[val,kind,src,notes], ac:[...]}
// Built per powertrain by function below.
const PRECOND = (cybertruck) => fld('automatic_with_navigation', null, 'estimated', cybertruck ? 'notebookcheck-tesla-precond-season' : 'electrek-2020-s-x-225kw',
  cybertruck
    ? est('Tesla Trip Planner warms the battery when navigating to a Supercharger (Notebookcheck, names the Cybertruck); no manual battery-warming control found on this or Tesla\'s other pages (tesla.com owner\'s manuals 403).')
    : est('Tesla release note (software 2020.24.6, Electrek) for Model S/X: "when you navigate to a Supercharger, your car will condition its battery during the drive"; lineup-wide software feature. No manual control found; tesla.com manuals are blocked (403). Cars without navigation or on the oldest MCU1 hardware (2012-2017) may not run it: unconfirmed.'));

function packFor(model, id) {
  const m = id.split('/')[2]; // e.g. 2016-p90d-2
  const year = +m.slice(0, 4);
  const rest = m.slice(5).replace(/-\d$/, '').replace(/-us$/, '');
  return { model, year, rest, id };
}

const out = {};
const missing = [];
const gens = {};

function build(p) {
  const { model, year, rest } = p;
  let key, gross, usable, dc, ac, volt = '400v', voltSrc, voltNote;
  const nca = 'evspecs-model-s-2018-100d-compare';
  const sibS = 'Model S';
  if (model === 'tesla/cybertruck') {
    key = 'cybertruck-123';
    gross = fld(123, 'kWh', 'community', 'insideevs-cybertruck-battery-passport', 'Battery passport: 123 kWh total energy, 4680 cells x 1,344 (InsideEVs). EPA filing derivation 122.4 kWh (InsideEVs EPA-docs article); iFixit and ArenaEV also 123. Same pack assumed on Dual Motor AWD and Long Range RWD (Green Cars Compare lists 122.4 gross for the Long Range RWD).');
    usable = fld(117, 'kWh', 'estimated', 'gcc-cybertruck-lr-rwd', est('Green Cars Compare Long Range RWD page lists 117 kWh usable of 122.4 gross; ArenaEV Dual Motor AWD lists 111.9 kWh usable of 123 and Notebookcheck-type reports say 122.5. Tesla does not publish usable. Same 4680 pack on every 2025-2026 Cybertruck trim.'));
    dc = fld(325, 'kW', 'tested', 'insideevs-cybertruck-320kw', 'InsideEVs recorded 325 kW at 18 % SoC at a V4-post station (Aug 2024), Green Cars Compare also lists 325 kW (253 kW at 400 V). Tesla launch spec and ArenaEV (2026 page) say 250 kW; iFixit says up to 350 kW at 800 V. Peak needs a V4 cabinet; V3 stalls give less.');
    ac = fld(11.5, 'kW', 'community', 'ifixit-cybertruck', 'iFixit teardown spec: AC onboard charger 11.5 kW at 240 V, 48 A; Green Cars Compare lists 11.5 kW for the Long Range RWD too.');
    return { key, f: {
      'battery.capacity_gross_kwh': [gross], 'battery.capacity_usable_kwh': [usable],
      'battery.chemistry': [fld('nmc', null, 'community', 'insideevs-cybertruck-battery-passport', 'Battery passport lists a nickel-cobalt-manganese (NCM) cathode on 4680 cells (InsideEVs).')],
      'battery.nominal_voltage_class': [fld('800v', null, 'community', 'insideevs-cybertruck-battery-passport', '800 V class (battery passport); EPA filing 816 V total pack voltage (InsideEVs EPA-docs article, iFixit 816 V 150 Ah).')],
      'battery.preconditioning': [PRECOND(true)], dc_max_kw: [dc], ac_max_kw: [ac] } };
  }
  const X = model === 'tesla/model-x';
  // pack by label
  const lab = rest; // e.g. 85, p85, 85d, p85d, 60, 60d, 70, 70d, 75, 75d, 90, 90d, p90d, 100d, p100d, long-range, ...
  const n = (lab.match(/^p?(\d+)/) || [])[1];
  const modernLabels = /long-range|performance|plaid|standard-range|dual-motor|awd/.test(lab);
  const wrap = (s) => s;
  let ratio75 = 72.6 / 75;
  if (!modernLabels) {
    if (n === '40') {
      key = 's-60-hw-limited-40';
      gross = fld(60, 'kWh', 'estimated', 'wikipedia-tesla-model-s', est('Wikipedia Model S: the 40 kWh car was delivered as a 60 kWh pack software-limited to 40 kWh (2013). VIN reference lists the 51-60 kWh tier for 2012-2013.'));
      usable = fld(40, 'kWh', 'estimated', 'wikipedia-tesla-model-s', est('Software limit of 40 kWh on the 60 kWh pack (Wikipedia Model S). The 2013 "40" label is the 60 kWh hardware with a 40 kWh software cap.'));
    } else if (n === '60' && year <= 2015) {
      key = 's-60';
      gross = fld(60, 'kWh', 'community', 'arenaev-model-s-60', 'ArenaEV Model S 60 (2012-2016): 60 kWh nominal, 300 V. Wikipedia Model S: 2013 60 kWh pack.');
      usable = fld(57.5, 'kWh', 'estimated', 'arenaev-model-x-60d', est('No page states usable for the 60 kWh pack. Ratio 58.5 net / 61 gross = 0.959 on the Model X 60D page (60 kWh-limited pack, 300 V, same Panasonic 18650 family) x 60 kWh = 57.5. Different pack hardware (the 60D is a limited 75 kWh pack), so low confidence.'));
    } else if (n === '60') {
      key = 'sx-75-hw-limited-60';
      gross = fld(61, 'kWh', 'community', 'arenaev-model-x-60d', 'ArenaEV Model X 60D: 61 kWh gross, 58.5 kWh net. Wikipedia (Model S 2016 and Model X): the 60 is a 75 kWh pack software-limited to 60 kWh (upgradable by software to 75). Gross here is the 60 kWh limit, not the hardware.');
      usable = fld(58.5, 'kWh', 'community', 'arenaev-model-x-60d', 'ArenaEV Model X 60D: 58.5 kWh net (usable). The 2016-2017 Model S 60/60D uses the same 75 kWh pack with the same 60 kWh software limit (Wikipedia Model S and X).', true);
      if (!X) usable.kind = 'estimated', usable.notes = est('Model X 60D page (ArenaEV) 58.5 kWh net; same software-limited 75 kWh pack (Wikipedia Model S 2016 60 kWh, upgradable to 75). ') ;
    } else if (n === '70') {
      key = 's-70';
      gross = fld(70, 'kWh', 'community', 'arenaev-model-s-70d', 'ArenaEV Model S 70D (2015-2016): 70 kWh nominal, 300 V.');
      usable = fld(67.8, 'kWh', 'estimated', 'arenaev-model-s-75', est('No page states usable for the 70 kWh pack. Ratio 72.6 net / 75 gross = 0.968 on the Model S 75 page (same 300 V pack family, 300 V on both ArenaEV pages) x 70 = 67.8.'));
    } else if (n === '75') {
      key = 'sx-75';
      gross = fld(75, 'kWh', 'community', X ? 'arenaev-model-x-75d' : 'arenaev-model-s-75', 'ArenaEV ' + (X ? 'Model X 75D' : 'Model S 75') + ': 75 kWh gross/nominal, 72.6 kWh net; EVSpecifications: 75 kWh, 302 V, 5,880 cells.');
      usable = fld(72.6, 'kWh', 'community', X ? 'arenaev-model-x-75d' : 'arenaev-model-s-75', 'ArenaEV: 72.6 kWh net (usable).');
    } else if (n === '85') {
      key = 's-85';
      gross = fld(85, 'kWh', 'community', 'arenaev-model-s-85', 'ArenaEV Model S 85: 85 kWh nominal, 350 V; EVSpecifications: 85 kWh, 346 V, 7,104 cells. Wikipedia: 85 kWh from 2012 Signature.');
      usable = fld(81, 'kWh', 'estimated', 'arenaev-model-x-90d', est('No opened page states usable for the 85 kWh pack. Ratio 81.8 net / 85.8 gross = 0.953 on the Model X 90D page (same 7,104-cell Panasonic 18650 pack family, EVSpecifications lists 7,104 cells for both) x 85 = 81.0. Search-result snippets from EV Database/EVKX give 80.8 (pages not fetched: 429 / blocked).'));
    } else if (n === '90') {
      key = X ? 'x-90' : 's-90';
      gross = X ? fld(85.8, 'kWh', 'community', 'arenaev-model-x-90d', 'ArenaEV Model X 90D: 85.8 kWh total (gross), 350 V. The "90" is Tesla\'s marketing size; ArenaEV\'s Model S 90D page says 90 kWh nominal.')
                : fld(90, 'kWh', 'community', 'arenaev-model-s-90d', 'ArenaEV Model S 90D (2015-2016): 90 kWh nominal, 350 V. Its Model X 90D page lists the same pack as 85.8 kWh gross / 81.8 kWh net: sources differ.');
      usable = fld(81.8, 'kWh', X ? 'community' : 'estimated', 'arenaev-model-x-90d', (X ? '' : 'Estimated: Model S 90D pack = same 90 kWh pack as Model X 90D; ') + 'ArenaEV Model X 90D: 81.8 kWh net (usable).');
    } else if (n === '100') {
      key = X ? 'x-100' : 's-100';
      gross = fld(100, 'kWh', 'community', X ? 'arenaev-model-x-100d' : 'arenaev-model-s-100d', 'ArenaEV: 100 kWh gross; EVSpecifications: 100 kWh, 400 V, 8,256 cells (Model S 100D/P100D 2018).');
      usable = fld(95, 'kWh', 'community', X ? 'arenaev-model-x-100d' : 'arenaev-model-s-100d', 'ArenaEV: 95 kWh net (usable).');
    }
    // 85 / 85D / P85 / P85D share; P90D etc handled by n
    // DC
    if (year === 2012) dc = fld(90, 'kW', 'community', 'evspecs-model-s-2012-85', 'EVSpecifications 2012 Signature 85: DC max 90 kW (early Superchargers). 2013+ listings say 120 kW.');
    else dc = fld(120, 'kW', year >= 2013 && year <= 2014 && n !== '85' && n !== '75' ? 'estimated' : 'community', year <= 2014 ? 'evspecs-model-s-2014-85' : 'evspecs-model-s-2018-100d-compare',
        (year <= 2014 && n !== '85' ? 'Estimated: ' : '') + (year <= 2014 ? 'EVSpecifications 2014 Model S 85: DC max 120 kW (the 2015 85D page says 120 too); ' : 'EVSpecifications 2017-2018 Model S 75D/90D/100D/P100D: DC max 120 kW; ') + 'ArenaEV lists 150 kW (V2) and EV Database about 145 kW for the 100 kWh pack (European listings). No page gives a pack-specific limit for this size; Supercharger-stall limit used.' + (X ? ' Model X taken from the same-year Model S pack/charger (EVSpecifications X P100D page lists 145 kW).' : ''));
    if (year === 2013 && n === '85') dc.notes += ' 2013 car carried over from the 2014 page (nothing shows a change).';
    if (['40','60','70'].includes(n) || (n==='60')) { dc.kind = 'estimated'; if (!dc.notes.startsWith('Estimated')) dc.notes = 'Estimated: ' + dc.notes; }
    if (n === '100' && year === 2019) {} // pre-Raven
    // AC
    if (year <= 2013) ac = fld(10, 'kW', 'manufacturer', 'tesla-s-service-vin-2012-2020', 'Tesla 2012-2020 Model S service manual VIN reference (2012-2013 digit 7): "10 kW Charger" standard, "20 kW Charger" for the dual-charger option. Standard single charger recorded; Wikipedia: two onboard chargers optional before 2016 (62 mi of range per hour).');
    else if (year <= 2015) ac = fld(10, 'kW', 'estimated', 'tesla-s-service-vin-2012-2020', est('2012-2013 VIN codes (Tesla service manual) give a 10 kW standard charger, 20 kW dual; the VIN page has no charger codes for 2014 and later, the service manual still documents the same 2nd-generation single/dual charger, and Wikipedia says pre-2016 cars could have two chargers. EVSpecifications lists 11.5 kW on 2014 and 2015 cars (looks generic). Dual option up to 20 kW not recorded.'));
    else ac = fld(11.5, 'kW', year === 2016 ? 'estimated' : 'community', 'evspecs-model-s-2018-100d-compare', (year === 2016 ? 'Estimated: ' : '') + 'EVSpecifications 2017-2018 Model S (75D/90D/100D/P100D) list AC 11.5 kW (48 A); a 72 A / 16.5-17.3 kW higher-amperage charger was optional (EVSpecifications lists 17.28 kW on the 2018 Model X P100D). ' + (year === 2016 ? '2016 cars carried over from 2017; the pre-refresh 2016 cars (before about May 2016) may have the 10 kW single or dual charger. ' : '') + (X ? 'Model X from the Model S figure (same charger family).' : ''));
    if (year === 2019 && /^(75d|100d|p100d)$/.test(lab.replace('p', n ? 'p' : ''))) {}
  } else {
    // modern: Raven (2019-2020 + early 2021) or Palladium (2021 LR, Plaid, 2022+)
    const palladium = year >= 2022 || /plaid/.test(lab) || (year === 2021 && lab === 'long-range');
    const sr = /standard-range/.test(lab);
    if (sr) {
      key = (X ? 'x' : 's') + '-sr-75';
      gross = fld(75, 'kWh', 'community', 'arenaev-model-s-sr-2019', 'ArenaEV Model S Standard Range 2019: 75 kWh total (nominal), no net figure. Model X Standard Range assumed to use the same pack (not confirmed on any opened page).');
      usable = fld(72.6, 'kWh', 'estimated', 'arenaev-model-s-75', est('Standard Range pack = 75 kWh; 72.6 kWh net on ArenaEV Model S 75 (same 75 kWh size). No page states usable for the Standard Range itself.'));
      dc = fld(120, 'kW', 'estimated', 'evspecs-model-s-2017-90d-75d-compare', est('EVSpecifications 2017-2018 75D (75 kWh): DC max 120 kW; ArenaEV lists 150 kW V2 on the Standard Range. No page gives a Standard Range limit; Raven chassis may allow more (Raven LR/Performance 200-250 kW).'));
    } else if (!palladium) {
      key = 'raven-100-' + (year === 2019 ? '2019' : '2020');
      gross = fld(100, 'kWh', 'community', X ? 'arenaev-model-x-lr-2019' : (year === 2019 ? 'arenaev-model-s-lr-2019' : 'arenaev-model-s-lrplus-2020'), 'ArenaEV: 100 kWh (' + (X ? 'Model X Long Range 2019-2021, total' : 'Model S Raven') + ').');
      usable = year === 2019
        ? fld(95, 'kWh', X ? 'estimated' : 'community', 'arenaev-model-s-lr-2019', (X ? 'Estimated: Model S 2019 Long Range page; same 100 kWh Raven pack on the Model X (no net figure on the X page). ' : '') + 'ArenaEV Model S Long Range 2019: 95 kWh usable (EV Database search snippet: 95.0 for Apr 2019-Oct 2020 LR, 98.0 for Long Range Plus; not fetched, 429).')
        : fld(94, 'kWh', X ? 'estimated' : 'community', 'arenaev-model-s-lrplus-2020', (X ? 'Estimated: Model S Long Range+ page; same 100 kWh Raven pack on the Model X. ' : '') + 'ArenaEV Model S Long Range+ 2020: 94 kWh net. Compare 95 on the 2019 page and 98 in an EV Database snippet for the LR Plus (not fetched).');
      dc = year === 2019
        ? fld(200, 'kW', 'estimated', 'insideevs-s-x-250kw-wires', est('InsideEVs: Raven Model S/X peaked at 200 kW at launch (2019), raised to 225 kW by software 2020.24.6 (Electrek, only recent cars) and 250 kW on cars ordered from July 2020. 2019 builds recorded at the launch value; owner may update.'))
        : fld(250, 'kW', 'manufacturer', 'insideevs-s-x-250kw-wires', 'Tesla design studio lists up to 250 kW for newly ordered Model S and X from July 2020 (InsideEVs); 225 kW after software 2020.24.6 on earlier 2020 cars (Electrek). V3 Supercharger; V2 stalls 150 kW.');
    } else {
      key = 'palladium-100';
      gross = fld(100, 'kWh', 'community', year === 2021 ? 'arenaev-model-s-plaid-2021' : 'arenaev-model-s-plaid-2025', 'ArenaEV Model S Plaid ' + (year === 2021 ? '2021' : '2025') + ': 100 kWh total (EVSpecifications: 99 kWh, 7,920 cells, 5 modules). Long Range/AWD cars (92.6 kWh usable of 100 in an ArenaEV search snippet) and Plaid share the Palladium pack.' + (X ? ' Model X Plaid per EVSpecifications 99 kWh too.' : ''));
      usable = fld(92.3, 'kWh', 'community', year === 2021 ? 'arenaev-model-s-plaid-2021' : 'arenaev-model-s-plaid-2025', 'ArenaEV Model S Plaid ' + (year === 2021 ? '2021' : '2025') + ': 92.3 kWh usable (same figure on the 2021 and 2025 pages).' + (X ? ' Applied to the Model X on the same Palladium-era pack (EVSpecifications 99 kWh on X Plaid).' : '') + (/plaid/.test(lab) ? '' : ' Applied to the Long Range/AWD cars: same pack (the Palladium LR and Plaid share 99-100 kWh).'));
      if (X) usable.kind = 'estimated', usable.notes = est(usable.notes.replace(/^/, ''));
      dc = fld(250, 'kW', year >= 2023 ? 'community' : 'estimated', year >= 2023 ? 'evspecs-model-s-2023-plaid' : 'insideevs-plaid-supercharging-2021',
        year >= 2023 ? 'EVSpecifications 2023/2025 Model S and X Plaid: DC max 250 kW; Tesla design studio 250 kW for Model S/X (InsideEVs 2020). Same 250 kW across 2022-2026.' + (X ? '' : '')
          : est('InsideEVs 2021: Model S/X Long Range 250 kW peak (July 2020 Raven), Plaid claims 187 miles in 15 minutes; EVSpecifications lists 200 kW for the 2021 Plaid. Taken as 250 kW, same hardware as 2023+ cars.'));
      if (year === 2022) { dc.kind = 'estimated'; dc.source_id = 'src-insideevs-plaid-supercharging-2021'; dc.notes = est('2021 (InsideEVs) and 2023 (EVSpecifications) both give 250 kW; 2022 carried over, nothing shows a change.'); }
    }
    if (!dc) throw new Error('no dc ' + p.id);
    // AC
    ac = fld(11.5, 'kW', year >= 2023 ? 'community' : 'estimated', year >= 2023 ? 'evspecs-model-s-2023-plaid' : 'evspecs-model-s-2018-100d-compare',
      (year >= 2023 ? '' : 'Estimated: 2017-2018 Model S pages (EVSpecifications) give 11.5 kW and the 2023 Model S Plaid page gives 11.5 kW (240 V, 48 A); same charger carried over. ') + 'EVSpecifications 2023/2025 Model S Plaid: AC 11.5 kW (240 V, 48 A). A 72 A / 16.5-17.3 kW charger was optional on some cars (EVSpecifications: 16.5 kW on Model X Plaid pages and 17.28 kW on the 2018 X P100D); standard figure recorded.');
  }
  // chemistry / voltage / precond
  const chemSrc = 'evspecs-model-s-2018-100d-compare';
  const chem = fld('nca', null, 'community', chemSrc, 'EVSpecifications 2017-2018 Model S/X: NCA (Panasonic NCR18650A, LiNiCoAlO2); Wikipedia Model S: NCA cathode.');
  const vsrc = 'arenaev-model-s-100d';
  const volt400 = fld('400v', null, 'estimated', 'evspecs-model-s-2018-100d-compare', est('Pack voltage 300-407 V (EVSpecifications: 302 V 75 kWh, 346 V 85/90 kWh, 400-407 V 100 kWh; ArenaEV 300-360 V), well below 800 V: 400 V class.'));
  return { key, f: {
    'battery.capacity_gross_kwh': [gross], 'battery.capacity_usable_kwh': [usable],
    'battery.chemistry': [chem], 'battery.nominal_voltage_class': [volt400],
    'battery.preconditioning': [PRECOND(false)], dc_max_kw: [dc], ac_max_kw: [ac] } };
}

for (const e of gaps) {
  const p = packFor(e.model, e.powertrain_id);
  let b;
  try { b = build(p); } catch (err) { missing.push(e.powertrain_id + ' ' + err.message); continue; }
  (gens[b.key] ??= []).push(e.powertrain_id);
  out[e.powertrain_id] = {
    fields: b.f,
    variant_fields: {
      charge_port: [fld('nacs', null, 'community', 'wikipedia-nacs', NOTE_PORT)],
      supercharger_access: [fld('yes', null, 'community', 'wikipedia-nacs', "Tesla's own Supercharger network, built for this connector (Wikipedia NACS article); same in Canada and the US.")],
    },
  };
}
require('./gen-w2-tesla-fixes.cjs')(out);
const batch = { sources, powertrains: out };
fs.writeFileSync('research/batch-2026-11-19-w2-tesla.json', JSON.stringify(batch, null, 2) + '\n');
console.log(Object.keys(out).length, 'powertrains; missing', missing);
for (const [k, v] of Object.entries(gens)) console.log(k, v.length, v.join(' '));
