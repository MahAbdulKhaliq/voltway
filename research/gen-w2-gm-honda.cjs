// Scratch generator for research/batch-2026-11-19-w2-gm-honda.json (W2 group gm-honda).
const fs = require('fs');
const T = '2026-11-19';
const MODELS = new Set('cadillac/celestiq cadillac/optiq cadillac/optiq-v cadillac/vistiq chevrolet/bolt-ev chevrolet/bolt-euv chevrolet/bolt chevrolet/spark-ev gmc/hummer-ev-pickup gmc/hummer-ev-suv gmc/sierra-ev honda/clarity-electric honda/fit-ev honda/prologue acura/zdx'.split(' '));
const gaps = JSON.parse(fs.readFileSync('research/powertrain-gaps.json', 'utf8')).filter((e) => MODELS.has(e.model));

const S = (id, type, title, url, notes) => ({ id: 'src-' + id, type, title, url, accessed_on: T, notes });
const sources = [
  S('wikipedia-chevrolet-bolt', 'community', 'Wikipedia: Chevrolet Bolt', 'https://en.wikipedia.org/wiki/Chevrolet_Bolt', 'First generation 2017-2023: 60 kWh (2017-19), 66 kWh (2020-23), nickel-rich lithium-ion, 55 kW SAE Combo DC (optional; standard from 2021 Premier and the 2022 refresh), onboard AC 7.2 kW rising to 11.5 kW with the 2022 refresh; EUV 65 kWh, 55 kW DC standard, 11.5 kW AC. 2027: 65 kWh LFP, 150 kW, port switched from CCS to NACS. Usable not stated.'),
  S('gm-techlink-2020-bolt-battery', 'oem', 'GM TechLink: 2020 Bolt EV Battery Updates Add to Electric Range', 'https://gm-techlink.com/?p=12236', 'GM service newsletter: 2020 pack is 66 kWh, up from 60 kWh in previous model years; new N2.2 chemistry not compatible with the N2.1 of 2017-2019.'),
  S('arenaev-bolt-ev-66', 'community', 'ArenaEV: Chevrolet Bolt EV 66 kWh (2019/2020)', 'https://www.arenaev.com/chevrolet_bolt_ev_66kwh_2019-specs-180.php', '66 kWh usable, liquid-cooled Li-ion 350 V, DC up to 55 kW, AC up to 11 kW (AC conflicts with Wikipedia 7.2 kW for 2017-2021).'),
  S('insideevs-bolt-euv-2022-technical', 'community', 'InsideEVs: Technical comparison of the new Chevrolet Bolt EV and EUV (2022)', 'https://insideevs.com/news/490154/technical-comparison-new-chevrolet-bolt-ev-euv/', '2022 Bolt EV/EUV: 65 kWh (288 cells, LG), DC fast charging up to 55 kW, AC onboard 11 kW single-phase; active thermal management, preconditioning not mentioned.'),
  S('torquenews-bolt-2020-55kw', 'community', 'Torque News: Fast charging 2020 Chevy Bolt EV still tops out at 55 kW', 'https://www.torquenews.com/7893/fast-charging-2020-chevy-bolt-ev-still-tops-out-55kw', '2020 peaks at 55 kW, the same rate as earlier 60 kWh model years.'),
  S('insideevs-2027-bolt-fast-charging', 'community', 'InsideEVs: The New Chevy Bolt Is Much Better At Fast-Charging', 'https://insideevs.com/news/775280/202', '2027 Bolt: new 65 kWh LFP pack, 150 kW peak (up from 50 kW on the old Bolt), 10-80 % in 26 min, native NACS. Says of the predecessor: "The lack of preconditioning meant charging in the dead of winter took even longer."'),
  S('insideevs-2027-bolt-charging-curve', 'community', 'InsideEVs: The New Chevy Bolt Charges Quicker Than GM\'s Pricier EVs', 'https://insideevs.com/features/790023/chevy-bolt-charging-curve/', '2027 Bolt LFP pack: 65 kWh, nominal voltage "a lot closer to 400" than the roughly 290 V Ultium modules, peak 150 kW, 10-80 % in 26 min.'),
  S('automotiveworld-2027-bolt', 'community', 'Automotive World: It\'s back, introducing the 2027 Chevrolet Bolt (GM release)', 'https://www.automotiveworld.com/news/its-back-introducing-the-2027-chevrolet-bolt/', 'GM release text: 150 kW or more, 10-80 % about 26 min, automatic battery preconditioning when DC fast charging is on a Google Maps route, first Chevrolet with native NACS.'),
  S('evwire-2027-bolt', 'community', 'EVWire: New Chevy Bolt EV 2027 all specs', 'https://evwire.com/p/new-chevy-bolt-ev-2027-all-specs-starts-28995', '65 kWh LFP, AC up to 11.5 kW, DC up to 150 kW, native NACS with a CCS adapter included. Gross/usable not given.'),
  S('wikipedia-chevrolet-spark-ev', 'community', 'Wikipedia: Chevrolet Spark (Spark EV section)', 'https://en.wikipedia.org/wiki/Chevrolet_Spark_EV', '2014: 21.3 kWh LiFePO4 pack (A123); 2015-16: 19 kWh Li-ion (LG Chem), same range; 3.3 kW onboard charger; optional CCS Combo 1 at 50 kW DC (80 % in 20 min); liquid thermal management. No voltage or usable figure. Wikipedia text ambiguity: cell change year is cited to a press source.'),
  S('greencarscompare-spark-ev', 'community', 'GreenCarsCompare: Chevrolet Spark EV 19 kWh', 'https://greencarscompare.com/global/car/chevrolet-spark-ev/', '19 kWh nominal, 18 kWh usable; DC up to 50 kW (CCS Type 1); AC 3.3 kW; model years listed 2015-2017.'),
  S('autodata-spark-ev-19', 'community', 'Auto-data.net: Chevrolet Spark EV 19 kWh', 'https://www.auto-data.net/en/chevrolet-spark-ev-19-kwh-140hp-33392', '19 kWh gross, 400 V, Li-ion; production 2014-2016.'),
  S('hondanews-fit-ev-2013', 'oem', 'Honda News: 2013 Honda Fit EV overview (press kit)', 'https://hondanews.com/en-US/releases/release-c2152ff8fb3b43a8923c61ab3326fbb9-2013-honda-fit-ev-overview', '20 kWh lithium-ion pack from Toshiba, 6.6 kW 32-amp onboard charger, SAE J1772 port; only 120/240 V AC charging described; air-cooled battery (cooling, no heater mentioned).'),
  S('wikipedia-honda-fit-ev', 'community', 'Wikipedia: Honda Fit EV', 'https://en.wikipedia.org/wiki/Honda_Fit_EV', '20 kWh lithium-ion battery, lithium titanate oxide anode, 240 V charge in 4 hours.'),
  S('honda-tech-review-fit-ev-battery', 'oem', 'Honda Technical Review: Development of Battery System for EV (Fit EV)', 'https://global.honda/en/technical-review/papers/10002067/', 'Toshiba SCiB cells, fans for cooling, no voltage figure given.'),
  S('hondanews-clarity-electric-specs', 'oem', 'Honda News: 2017 Clarity Electric specifications and features', 'https://hondanews.com/en-US/releases/release-79a636b2660e457fbeecb5603a9b9ce2-2017-clarity-electric-specifications-features', '25.5 kWh lithium-ion battery, 6.6 kW 32-amp onboard charger, DC fast charging 80 % in 30 min; no voltage or DC kW stated.'),
  S('wikipedia-honda-clarity-electric', 'community', 'Wikipedia: Honda Clarity Electric', 'https://en.wikipedia.org/wiki/Honda_Clarity_Electric', '25.5 kWh battery, CCS Type 1 combo port, 3.5 h on 240 V.'),
  S('greencarscompare-clarity-electric', 'community', 'GreenCarsCompare: Honda Clarity Electric (2018) specs', 'https://greencarscompare.com/car/honda-clarity-electric-2018/specs/', '25.5 kWh nominal, 24.2 kWh usable, 400 V, DC max 50 kW, AC 6.6 kW, CCS Type 1.'),
  S('wikipedia-honda-prologue', 'community', 'Wikipedia: Honda Prologue', 'https://en.wikipedia.org/wiki/Honda_Prologue', '85 kWh liquid-cooled Ultium, up to 155 kW DC peak, 11.5 kW onboard charger, Google Maps can start battery preconditioning automatically when routing to a charger.'),
  S('thechargeport-honda-prologue', 'community', 'The Charge Port: Honda Prologue', 'https://thechargeport.com/ev/honda-prologue', 'Up to 11.5 kW home charging; CCS1 port, Superchargers need an adapter; no DC kW or 10-80 time published; 2026 is the last model year.'),
  S('wikipedia-acura-zdx', 'community', 'Wikipedia: Acura ZDX', 'https://en.wikipedia.org/wiki/Acura_ZDX', '102 kWh lithium-ion modular Ultium battery, DC up to 190 kW; trims A-Spec RWD/AWD and Type S.'),
  S('thechargeport-acura-zdx', 'community', 'The Charge Port: Acura ZDX', 'https://thechargeport.com/ev/acura-zdx', '102 kWh GM Ultium pack on all three trims, DC peak 190 kW, 11.5 kW onboard charger, CCS1, Acura-approved NACS adapter ($225), Supercharger access since July 2025.'),
  S('wikipedia-cadillac-optiq', 'community', 'Wikipedia: Cadillac Optiq', 'https://en.wikipedia.org/wiki/Cadillac_Optiq', 'North America: Ultium 85.0 kWh (usable capacity) NMC, 10 modules, 400 V architecture, DC 150 kW, 11.5 kW standard AC with a 19.2 kW option, CCS1 (NACS via adapter). FWD 2023-2026 (China), RWD after 2026, dual-motor AWD.'),
  S('thechargeport-cadillac-optiq', 'community', 'The Charge Port: Cadillac Optiq', 'https://thechargeport.com/ev/cadillac-optiq', '85 kWh on Luxury RWD/AWD; home AC 11.5 kW standard, 19.2 kW with the upgraded charger; no DC peak or 10-80 time published; trims described as native NACS (2027 page).'),
  S('kbb-cadillac-optiq-2026-specs', 'community', 'KBB: 2026 Cadillac Optiq specs', 'https://www.kbb.com/cadillac/optiq/2026/specs/', 'Battery 85.00 kWh on all four trims.'),
  S('kbb-cadillac-optiq-v-2026-specs', 'community', 'KBB: 2026 Cadillac Optiq-V specs', 'https://www.kbb.com/cadillac/optiq-v/2026/specs/', 'Battery 85.00 kWh.'),
  S('wikipedia-cadillac-vistiq', 'community', 'Wikipedia: Cadillac Vistiq', 'https://en.wikipedia.org/wiki/Cadillac_Vistiq', '102.0 kWh, Ultium NCMA cathode, AC 19.2 kW, DC 190 kW.'),
  S('thechargeport-cadillac-vistiq', 'community', 'The Charge Port: 2027 Cadillac Vistiq', 'https://thechargeport.com/ev/cadillac-vistiq', '102 kWh, DC peak 190 kW, home AC 11.5 kW standard to 19.2 kW optional; 2027 has native NACS; the 2026 uses CCS1 and needs GM\'s $299 NACS DC adapter.'),
  S('kbb-cadillac-vistiq-2026-specs', 'community', 'KBB: 2026 Cadillac Vistiq specs', 'https://www.kbb.com/cadillac/vistiq/2026/specs/', 'Battery 102.00 kWh on all four trims.'),
  S('wikipedia-cadillac-celestiq', 'community', 'Wikipedia: Cadillac Celestiq', 'https://en.wikipedia.org/wiki/Cadillac_Celestiq', '111 kWh NCMA Ultium (total capacity), DC up to 200 kW in the text and 190 kW in the infobox; no AC figure.'),
  S('kbb-cadillac-celestiq-2025-specs', 'community', 'KBB: 2025 Cadillac Celestiq specs', 'https://www.kbb.com/cadillac/celestiq/2025/specs/', '111 kWh lithium-ion battery; 78 miles of range in 10 minutes on a DC fast charger; no kW figure.'),
  S('wikipedia-gmc-hummer-ev', 'community', 'Wikipedia: GMC Hummer EV', 'https://en.wikipedia.org/wiki/GMC_Hummer_EV', 'Infobox: 24-module pack 246.8/212.7 kWh (total/usable), 20-module pack c. 170 kWh; typically 400 V, switches to 800 V when charging; 350 kW DC; 19.2 kW AC; not mapped to trims or years.'),
  S('gm-techlink-hummer-ev-ultium', 'oem', 'GM TechLink: Ultium Battery System Powers the GMC HUMMER EV Pickup (2022-04-14)', 'https://gm-techlink.com/?p=16152', '24-module system with "approximately 200 kWh of available energy"; about 400 V per layer, layers in parallel normally and in series for "800-volt DC fast charging" (up to 800 V/350 kW); apps can precondition the battery for charging.'),
  S('thechargeport-gmc-hummer-ev', 'community', 'The Charge Port: GMC Hummer EV', 'https://thechargeport.com/ev/gmc-hummer-ev', '800 V DC charging up to 300 kW on most trims (Pickup 2X), 350 kW with the 24-module pack; home AC up to 19.2 kW; CCS1 port needs an adapter for Superchargers.'),
  S('wikipedia-gmc-sierra-ev', 'community', 'Wikipedia: GMC Sierra EV', 'https://en.wikipedia.org/wiki/GMC_Sierra_EV', 'Packs 119 kWh (Standard Range), 170 kWh (Extended Range), 205 kWh (Max Range), Ultium lithium-ion; 400 V switching to 800 V when charging; 350 kW DC; 19.2 kW AC.'),
  S('thechargeport-gmc-sierra-ev', 'community', 'The Charge Port: GMC Sierra EV', 'https://thechargeport.com/ev/gmc-sierra-ev', 'Home charging 11.5 to 19.2 kW depending on trim; no 10-80 time published.'),
  S('insideevs-nontesla-supercharger-access-2026', 'community', 'InsideEVs: All the non-Tesla EVs that can use Tesla Superchargers in 2026', 'https://insideevs.com/news/735724/non-tesla-ev-tesla-supercharger-access/', 'US list: Chevrolet Bolt EV/EUV, Cadillac Optiq/Lyriq/Celestiq/Vistiq, GMC Hummer EV, GMC Sierra EV, Honda Prologue, Acura ZDX listed as compatible; Chevrolet Spark EV "cannot be recharged at Tesla Superchargers". Clarity Electric and Fit EV not mentioned.'),
  S('auto123-gm-nacs-adapter-2024', 'community', 'Auto123: GM EV owners can use Tesla Superchargers (2024-09-18)', 'https://auto123.com/en/news/amp/general-motors-chargers-nacs-tesla/71850', 'GM-approved NACS adapter works with all GM EVs including Bolt EV, Blazer EV and Lyriq; US first ($225), "available in Canada before the end of the year"; some Bolt EVs need a software update.'),
  S('arenaev-gm-supercharger-2024', 'community', 'ArenaEV: Chevrolet, Cadillac and GMC owners can now use Tesla\'s Superchargers in the US and Canada', 'https://www.arenaev.com/chevrolet_cadillac_and_gmc_owners_can_now_use_teslas_superchargers_in_the_us_and_canada-news-3936.php', 'Announced 2024-09-18: GM-approved NACS adapter, US MSRP $225 via GM brand apps, Canada "later this year".'),
];
const srcIds = new Set(sources.map((s) => s.id));
// Sources already in data/sources (written by earlier batches); referenced by id only.
const EXISTING = ['src-insideevs-silverado-battery', 'src-weeklydriver-gm-ultium-truck-14', 'src-weeklydriver-gm-ultium-truck-20', 'src-weeklydriver-gm-ultium-truck-24', 'src-gm-silverado-ev-2026-spec-guide', 'src-chevrolet-battery-preconditioning-guide', 'src-evdb-lyriq-v', 'src-evcs-2027-silverado', 'src-evcs-2027-lyriq-nacs', 'src-wikipedia-cadillac-lyriq', 'src-autodata-equinox-ev-89', 'src-weeklydriver-gm-ultium-85', 'src-insideevs-equinox-ev-ultium-voltage', 'src-kbb-lyriq-2026-specs', 'src-cadillac-dc-fast-charging-support', 'src-thechargeport-lyriq-2027', 'src-thechargeport-equinox-ev'];
for (const id of EXISTING) {
  const f = `data/sources/${id}.json`;
  if (fs.existsSync(f)) sources.push(JSON.parse(fs.readFileSync(f, 'utf8')));
  else throw new Error('missing existing source ' + id);
}
const use = new Set();
const F = (value, unit, kind, src, notes, low = true) => {
  const sid = src.startsWith('src-') ? src : 'src-' + src;
  use.add(sid);
  const o = { value };
  if (unit) o.unit = unit;
  o.kind = kind; o.source_id = sid;
  if (low) o.low_confidence = true;
  if (notes) o.notes = (kind === 'estimated' && !notes.startsWith('Estimated: ') ? 'Estimated: ' : '') + notes;
  return o;
};
const K = 'kWh', W = 'kW';
// ----------------------------------------------------------------------------------------------
// Hardware generations. Each: powertrain fields + variant_fields (port, supercharger by year/market rule).
// ----------------------------------------------------------------------------------------------
const NA_ADAPTER_US = (notes = '') => F('via_adapter', null, 'manufacturer', 'insideevs-nontesla-supercharger-access-2026', 'US: the GM/Honda-approved NACS adapter is needed on this CCS1 car; the model is on InsideEVs\' list of non-Tesla EVs with Supercharger access. Current state for this model year. ' + notes);
const NA_ADAPTER_CA = (notes = '') => F('via_adapter', null, 'estimated', 'auto123-gm-nacs-adapter-2024', 'GM announced the NACS adapter for all GM EVs on 2024-09-18, US first and Canada before the end of 2024 (Auto123, ArenaEV); no Canadian page for this exact model was readable (gm.ca, chevrolet.ca, cadillaccanada.ca return 403). Assumed the Canadian car has the same adapter access as the US car. ' + notes);

const PRECOND_CAD = (extra = '') => F('automatic_and_manual', null, 'estimated', 'src-cadillac-dc-fast-charging-support', 'Cadillac DC fast-charging support page (cadillac.com returns 403, read only as a search excerpt by an earlier researcher, not reproduced): routing to a DC fast charger with Google built-in navigation preconditions automatically, plus a manual Fast Charge Prep in the app. Applied to all Ultium Cadillacs, the same as the LYRIQ records. UNVERIFIED on a page for this model. ' + extra);
const PRECOND_GM = (extra = '') => F('automatic_and_manual', null, 'estimated', 'src-chevrolet-battery-preconditioning-guide', 'GM\'s battery-preconditioning guide (chevrolet.com returns 403, search excerpt only): automatic with Google built-in navigation plus a manual Fast Charge Prep in the app; applied lineup-wide to GM Ultium vehicles as for Silverado EV/Equinox EV records. UNVERIFIED on a page for this model. ' + extra);

const gens = {};
// ---- Bolt EV 2017-2019 (60 kWh, N2.1) ----
gens.bolt1719 = {
  fields: {
    'battery.capacity_gross_kwh': [F(60, K, 'manufacturer', 'gm-techlink-2020-bolt-battery', 'GM TechLink: the 2020 pack is 66 kWh "up from 60 kWh in previous model years" (Bolt EV 2017-2019). Wikipedia lists 60 kWh for 2017-2019 too. Bare nominal capacity, treated as gross.', false)],
    'battery.capacity_usable_kwh': [F(59.1, K, 'estimated', 'gm-techlink-2020-bolt-battery', 'GM states only 60 kWh (nominal). Applied the 65/66 usable-to-nominal ratio of the 2020-23 pack of the same LG cell family (66 kWh GM nominal per GM TechLink; 65 kWh per the 2022 GM figure relayed by InsideEVs): 60 x 65/66 = 59.1. Korea\'s ministry measured 60.9 kWh (not opened). WEAK: the 65/66 pair is a press nominal, not a published usable ratio, and the N2.1 chemistry differs from N2.2.')],
    'battery.chemistry': [F('nmc', null, 'estimated', 'wikipedia-chevrolet-bolt', 'Wikipedia: first-generation Bolt uses a "nickel-rich lithium-ion" pack (LG Chem cells); GM calls the 2017-19 chemistry N2.1 (GM TechLink). Closest enum nmc.')],
    'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'arenaev-bolt-ev-66', 'ArenaEV: "Liquid-cooled Li-ion 350V" (a 350 V nominal pack is the 400 V class). Page covers the 2019/2020 66 kWh car; 2017-19 uses the same cell stack count and architecture.')],
    'battery.preconditioning': [F('none', null, 'estimated', 'insideevs-2027-bolt-fast-charging', 'InsideEVs on the previous Bolt: "The lack of preconditioning meant charging in the dead of winter took even longer." No battery-warming feature found for 2017-2023 Bolt EV/EUV; GM\'s automatic preconditioning arrived with Google built-in nav on the Ultium cars.')],
    'dc_max_kw': [F(55, W, 'estimated', 'torquenews-bolt-2020-55kw', 'Torque News: 2020 tops out at 55 kW, "the same rate familiar to anyone fast charging a previous model year"; Wikipedia: first generation 55 kW SAE Combo DC (optional; tapers to 38 kW at 56 % and 24 kW at 68 %). Other sources say 50 kW. DC fast charging was a factory option on the 2017-2020 cars (standard on the 2021 Premier and from 2022).')],
    'ac_max_kw': [F(7.2, W, 'manufacturer', 'wikipedia-chevrolet-bolt', 'Wikipedia: Level 2 initially up to 7.2 kW (32 A), raised to 11.5 kW with the 2022 refresh. ArenaEV lists 11 kW and Recharged 7.7 kW for 2017-2021 (conflict).')],
  },
  port: F('ccs1', null, 'manufacturer', 'wikipedia-chevrolet-bolt', 'Wikipedia: J1772 inlet for AC, with the SAE Combo (CCS1) DC inlet a factory option on 2017-2020 cars (standard from 2021 Premier and 2022). Cars without the option have only J1772 and no DC.'),
};
// ---- Bolt EV 2020-2021 (66 kWh, N2.2, 7.2 kW) ----
const boltPack = (aw) => ({
  'battery.capacity_gross_kwh': [F(66, K, 'manufacturer', 'gm-techlink-2020-bolt-battery', 'GM TechLink: 2020 Bolt EV pack is 66 kWh, new N2.2 chemistry. Same pack carried to 2021-2023 (Wikipedia lists 66 kWh for 2020-2023; GM later quotes it as 65 kWh). Bare nominal capacity, treated as gross.', false)],
  'battery.capacity_usable_kwh': [F(65, K, 'estimated', 'insideevs-bolt-euv-2022-technical', 'GM figure for the 2022 Bolt EV/EUV is 65 kWh (288 cells, InsideEVs); ArenaEV lists 66 kWh usable for the 2019/2020 car (conflict of 1 kWh); no GM statement of usable vs gross. Years on this pack: 2020-2023 (same cells; no change found).')],
  'battery.chemistry': [F('nmc', null, 'estimated', 'wikipedia-chevrolet-bolt', 'Wikipedia: "nickel-rich lithium-ion" (LG); GM N2.2 chemistry for 2020 (GM TechLink). Closest enum nmc.')],
  'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'arenaev-bolt-ev-66', 'ArenaEV: "Liquid-cooled Li-ion 350V" (400 V class).')],
  'battery.preconditioning': [F('none', null, 'estimated', 'insideevs-2027-bolt-fast-charging', 'InsideEVs on the previous Bolt: "The lack of preconditioning meant charging in the dead of winter took even longer." GM TechLink says 2020 DC charging was improved in cold weather (software/chemistry), not a warm-up feature. No preconditioning feature found for 2017-2023.')],
  'dc_max_kw': [F(55, W, 'manufacturer', 'insideevs-bolt-euv-2022-technical', 'InsideEVs 2022 Bolt EV/EUV: "DC fast charging: up to 55 kW"; Torque News: 2020 55 kW; Wikipedia 55 kW. Standard on the EUV and from 2021 Premier/2022 on the EV.', false)],
  'ac_max_kw': [aw],
});
gens.bolt2021 = {
  fields: boltPack(F(7.2, W, 'manufacturer', 'wikipedia-chevrolet-bolt', 'Wikipedia: Level 2 up to 7.2 kW until the 2022 refresh (ArenaEV says 11 kW for the 2019/2020 car: conflict).')),
  port: F('ccs1', null, 'manufacturer', 'wikipedia-chevrolet-bolt', 'J1772 AC with CCS1 DC: option through 2020, standard on the 2021 Premier (Wikipedia). Cars without it have J1772 only.'),
};
gens.bolteuv = { fields: { ...boltPack(F(11.5, W, 'manufacturer', 'wikipedia-chevrolet-bolt', 'Wikipedia: EUV 11.5 kW at 48 A.')), 'battery.capacity_gross_kwh': [F(65, K, 'manufacturer', 'wikipedia-chevrolet-bolt', 'Wikipedia lists the Bolt EUV pack at 65.0 kWh; InsideEVs (2022 technical comparison) 65 kWh (288 cells). Bare nominal, treated as gross.', false)] }, port: F('ccs1', null, 'manufacturer', 'wikipedia-chevrolet-bolt', 'EUV: J1772 AC, CCS Combo 1 DC standard (Wikipedia).') };
gens.bolt2223 = {
  fields: boltPack(F(11.5, W, 'manufacturer', 'wikipedia-chevrolet-bolt', 'Wikipedia: the 2022 refresh raised the onboard charger to 11.5 kW (48 A; EUV 11.5 kW at 48 A). InsideEVs rounds it to 11 kW.')),
  port: F('ccs1', null, 'manufacturer', 'wikipedia-chevrolet-bolt', 'J1772 AC and CCS1 DC; DC fast charging standard from the 2022 refresh (Wikipedia).'),
};
// ---- 2027 Bolt (LFP) ----
gens.bolt27 = {
  fields: {
    'battery.capacity_gross_kwh': [F(65, K, 'manufacturer', 'insideevs-2027-bolt-fast-charging', 'GM spec: 65 kWh LFP pack (prismatic cells); GM lists it as rated energy, not usable. Gross by default.')],
    'battery.capacity_usable_kwh': [F(65, K, 'estimated', 'insideevs-2027-bolt-charging-curve', 'No page states a usable figure. GM publishes 65 kWh as the pack size and recommends charging this LFP pack to 100 % (GM Authority, search excerpt), so 65 kWh is used for usable too. WEAK basis (search excerpt, no maker statement of usable). An owner OBD scan read 69.9 kWh (wind-works.org, flagged unreliable by its author).')],
    'battery.chemistry': [F('lfp', null, 'manufacturer', 'insideevs-2027-bolt-fast-charging', 'InsideEVs: "new 65-kilowatt-hour lithium-iron-phosphate (LFP) battery"; GM specs say LFP in prismatic can cells, cell-to-pack.')],
    'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'insideevs-2027-bolt-charging-curve', 'InsideEVs: the LFP pack has "a nominal voltage that\'s a lot closer to 400" (than the ~290 V Ultium modules); AutoGuide calls it a 400 V architecture (search excerpt). No GM figure.')],
    'battery.preconditioning': [F('automatic_with_navigation', null, 'manufacturer', 'automotiveworld-2027-bolt', 'GM release relayed by Automotive World: "If DC fast charging is available along your route, automatic battery preconditioning gives your battery a warm-up" via Google Maps. No manual control found in the release.')],
    'dc_max_kw': [F(150, W, 'manufacturer', 'automotiveworld-2027-bolt', 'GM: peak 150 kW or more; InsideEVs test reached 151 kW (156 kW at 18 %).')],
    'ac_max_kw': [F(11.5, W, 'manufacturer', 'evwire-2027-bolt', 'GM spec relayed by EVWire and The EV Report: AC up to 11.5 kW.')],
    'published_10_80_min': [F(26, 'min', 'manufacturer', 'automotiveworld-2027-bolt', 'GM: about 26 minutes for 10-80 % on public DC fast charging (Automotive World, InsideEVs); a KBB piece says 25.')],
  },
  port: F('nacs', null, 'manufacturer', 'automotiveworld-2027-bolt', 'GM: the 2027 Bolt is Chevrolet\'s first vehicle with a native NACS port.'),
  sc: F('yes', null, 'manufacturer', 'insideevs-2027-bolt-fast-charging', 'Native NACS; InsideEVs charged a 2027 Bolt at a Tesla Supercharger with a NACS cable; KBB: plugs directly into compatible Superchargers. US.'),
};
// ---- Spark EV ----
const spark = (y) => ({
  fields: {
    'battery.capacity_gross_kwh': [y === 2014
      ? F(21.3, K, 'manufacturer', 'wikipedia-chevrolet-spark-ev', 'Wikipedia: 2014 pack is 21.3 kWh LiFePO4 (A123). Nominal, treated as gross.')
      : F(19, K, 'manufacturer', 'wikipedia-chevrolet-spark-ev', 'Wikipedia: 2015-16 pack is 19 kWh Li-ion (LG Chem), same range as before; GreenCarsCompare: 19 kWh nominal. Auto-data lists 19 kWh for 2014-2016 (conflict on 2014).')],
    'battery.capacity_usable_kwh': [y === 2014
      ? F(20.2, K, 'estimated', 'greencarscompare-spark-ev', 'No page gives usable energy for the 2014 21.3 kWh LFP pack. Applied the published usable/nominal ratio of the 2015-16 Spark EV pack (18/19, GreenCarsCompare): 21.3 x 18/19 = 20.2. WEAK: different cells (LFP vs the later Li-ion pack).')
      : F(18, K, 'estimated', 'greencarscompare-spark-ev', 'GreenCarsCompare: "18 kWh usable battery pack (19 kWh nominal)".')],
    'battery.chemistry': [y === 2014
      ? F('lfp', null, 'manufacturer', 'wikipedia-chevrolet-spark-ev', 'Wikipedia: 21.3 kWh lithium iron phosphate pack supplied by A123 Systems (2014).')
      : F('nmc', null, 'estimated', 'wikipedia-chevrolet-spark-ev', 'Wikipedia says only "lithium-ion" (LG Chem) for 2015-16 and no page names the cathode. NMC is an assumption (the usual LG Chem automotive pouch cell of the time), not a sourced fact. OWNER QUESTION.')],
    'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'autodata-spark-ev-19', 'Auto-data lists the Spark EV battery at 400 V; no 800 V production car existed before 2019.')],
    'battery.preconditioning': [F('none', null, 'estimated', 'wikipedia-chevrolet-spark-ev', 'Absence of mention: Wikipedia describes only a liquid thermal management system and no battery warm-up feature; GM\'s navigation-based preconditioning appears only on the 2022+ Ultium cars (2027 Bolt release). No page states that the Spark EV lacks preconditioning.')],
    'dc_max_kw': [F(50, W, 'manufacturer', 'wikipedia-chevrolet-spark-ev', 'Wikipedia: optional CCS Combo 1 at 50 kW DC, 80 % in 20 minutes; EVSpecs and GreenCarsCompare agree on 50 kW. DC was optional: cars without it have no DC port.')],
    'ac_max_kw': [F(3.3, W, 'manufacturer', 'wikipedia-chevrolet-spark-ev', 'Wikipedia: maximum 3.3 kW onboard charger (EVSpecs 3.84 kW at 240 V).')],
  },
  port: F('ccs1', null, 'manufacturer', 'wikipedia-chevrolet-spark-ev', 'Wikipedia: optional CCS Combo 1 inlet, first car in the US with CCS; cars without the option have J1772 only. Canada: limited fleet sales from 2014, port not stated.'),
  sc: F('no', null, 'manufacturer', 'insideevs-nontesla-supercharger-access-2026', 'InsideEVs: the Spark EV "cannot be recharged at Tesla Superchargers" and is not in the GM adapter programme.'),
});
// ---- Fit EV ----
gens.fit = {
  fields: {
    'battery.capacity_gross_kwh': [F(20, K, 'manufacturer', 'hondanews-fit-ev-2013', 'Honda press kit: 20 kWh lithium-ion pack from Toshiba (SCiB).', false)],
    'battery.capacity_usable_kwh': [F(20, K, 'estimated', 'hondanews-fit-ev-2013', 'Honda publishes only "20 kWh"; no usable figure on any page opened, so the nominal 20 kWh is recorded as usable with no further basis. OWNER QUESTION.')],
    'battery.chemistry': [F('other', null, 'manufacturer', 'wikipedia-honda-fit-ev', 'Wikipedia: Toshiba SCiB cells with a lithium titanate oxide (LTO) anode; enum has no LTO, so other.')],
    'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'honda-tech-review-fit-ev-battery', 'No page gives the pack voltage (Honda\'s review only says many low-voltage SCiB cells are in series). 400 V class is elimination only (no 800 V production car existed in 2013), not a sourced or relative-based figure. OWNER QUESTION.')],
    'battery.preconditioning': [F('none', null, 'estimated', 'hondanews-fit-ev-2013', 'Absence of mention: the press kit describes an air-cooled battery (fans) and AC-only charging with no battery-warming feature; no page states the absence outright.')],
    'dc_max_kw': [F(0, W, 'estimated', 'hondanews-fit-ev-2013', 'The US press kit describes only 120/240 V AC charging on an SAE J1772 port; no DC inlet mentioned. (Japan model had a quick-charge inlet, per a Honda R&D paper seen in a search excerpt.)')],
    'ac_max_kw': [F(6.6, W, 'manufacturer', 'hondanews-fit-ev-2013', 'Honda press kit: 6.6 kW onboard 32-amp charger, 240 V in under three hours.', false)],
  },
  port: F('j1772', null, 'manufacturer', 'hondanews-fit-ev-2013', 'Standardized SAE J1772 port under a lid on the left-front fender; no DC inlet.'),
  sc: F('no', null, 'estimated', 'hondanews-fit-ev-2013', 'No DC inlet and no adapter programme; not on InsideEVs\' Supercharger-access list.'),
};
// ---- Clarity Electric ----
gens.clarity = {
  fields: {
    'battery.capacity_gross_kwh': [F(25.5, K, 'manufacturer', 'hondanews-clarity-electric-specs', 'Honda spec sheet: 25.5 kWh lithium-ion battery (capacity).', false)],
    'battery.capacity_usable_kwh': [F(24.2, K, 'estimated', 'greencarscompare-clarity-electric', 'GreenCarsCompare lists 24.2 kWh usable of 25.5 kWh nominal; Honda does not publish a usable figure.')],
    'battery.chemistry': [F('nmc', null, 'estimated', 'hondanews-clarity-electric-specs', 'Honda says only "lithium-ion"; no page names the chemistry. NMC is an assumption (typical 2017 automotive pack), not sourced. OWNER QUESTION.')],
    'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'greencarscompare-clarity-electric', 'GreenCarsCompare: 400 V architecture; no 800 V car existed in 2017-2019.')],
    'battery.preconditioning': [F('none', null, 'estimated', 'hondanews-clarity-electric-specs', 'Absence of mention: the Honda 2017 spec sheet lists DC fast charging and a 6.6 kW charger and no battery warm-up feature; the first Honda feature found is the 2024 Prologue (Wikipedia: Google Maps preconditioning). No page states the absence outright.')],
    'dc_max_kw': [F(50, W, 'estimated', 'greencarscompare-clarity-electric', 'GreenCarsCompare: DC max 50 kW; Honda says 80 % in 30 minutes with DC fast charging (consistent with ~50 kW); other sources 55 and 80 kW.')],
    'ac_max_kw': [F(6.6, W, 'manufacturer', 'hondanews-clarity-electric-specs', 'Honda spec sheet: 6.6 kW onboard 32-amp charger; 3.5 h on 240 V.', false)],
  },
  port: F('ccs1', null, 'manufacturer', 'wikipedia-honda-clarity-electric', 'Wikipedia: US Clarity Electric has a CCS Type 1 combo port for DC; Honda: DC fast charging with SAE CCS.'),
  sc: F('no', null, 'estimated', 'insideevs-nontesla-supercharger-access-2026', 'Not on InsideEVs\' list of non-Tesla EVs with Supercharger access; Honda\'s Supercharger access programme covers the Prologue and later. US only.'),
};
// ---- Ultium sibling generations ----
const SC_US_NOTE = '';
const ultium85 = (src) => ({
  'battery.capacity_usable_kwh': [F(85, K, 'estimated', src.use, src.note)],
  'battery.chemistry': [F('nmc', null, 'estimated', 'wikipedia-cadillac-optiq', 'Wikipedia: Optiq 85 kWh Ultium NMC (GM calls the cells NCMA); same cells across Ultium. Closest enum nmc.')],
  'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'wikipedia-cadillac-optiq', 'Wikipedia: Optiq has a 400 V architecture; Equinox EV 85 kWh pack ~290 V modules in the 400 V class (InsideEVs).')],
});
gens.prologue = {
  fields: {
    ...ultium85({ use: 'wikipedia-honda-prologue', note: 'Honda Prologue uses the same GM Ultium 85 kWh pack as the Equinox EV (85 kWh usable, 89 gross, Auto-data) and the Optiq (Wikipedia: 85.0 kWh usable); Wikipedia states only "85 kWh". Years compared: 2024-2026; no pack change found.' }),
    'battery.preconditioning': [F('automatic_with_navigation', null, 'manufacturer', 'wikipedia-honda-prologue', 'Wikipedia: Google Maps can start battery preconditioning automatically when routing to a charger. No manual control found.')],
    'dc_max_kw': [F(155, W, 'manufacturer', 'wikipedia-honda-prologue', 'Wikipedia: "capable of up to 155 kW peak during DC fast charging". The shared Ultium 85 kWh pack is 150 kW on Chevrolet/Cadillac (conflict of 5 kW).')],
    'ac_max_kw': [F(11.5, W, 'manufacturer', 'thechargeport-honda-prologue', 'Charge Port and Wikipedia: up to 11.5 kW (48 A) home charging; no 19.2 kW option found. Applies to US and Canada.')],
  },
  port: F('ccs1', null, 'manufacturer', 'thechargeport-honda-prologue', 'The Charge Port: CCS1 port; Superchargers need an adapter (2024-2026 model years).'),
};
gens.zdx = {
  fields: {
    'battery.capacity_gross_kwh': [F(102, K, 'manufacturer', 'wikipedia-acura-zdx', 'Acura: 102 kWh GM Ultium pack on all three trims (same pack as the Lyriq). Bare capacity treated as gross.')],
    'battery.capacity_usable_kwh': [F(100, K, 'estimated', 'src-wikipedia-cadillac-lyriq', 'Same 102 kWh Ultium pack as the Cadillac Lyriq, for which Wikipedia lists 102 gross / 100 usable (and Auto-data 100.4 net); ratio applied.')],
    'battery.chemistry': [F('nmc', null, 'estimated', 'wikipedia-acura-zdx', 'Wikipedia: "102 kWh lithium-ion modular Ultium battery" (GM NCMA cells; Lyriq-V cells are NMC per EV Database). Closest enum nmc.')],
    'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'src-insideevs-equinox-ev-ultium-voltage', 'Estimated from the GM Ultium platform: InsideEVs gives the Equinox EV 85 kWh Ultium pack as about 288 V nominal (80S 3P); the ZDX uses the same Ultium modules in a larger 102 kWh pack, 400 V class. No Acura page states the voltage.')],
    'battery.preconditioning': [F('automatic_with_navigation', null, 'estimated', 'wikipedia-honda-prologue', 'Platform sibling: the Honda Prologue (GM Ultium, Google built-in) preconditions automatically via Google Maps (Wikipedia). No Acura page read for the ZDX; manual control unknown.')],
    'dc_max_kw': [F(190, W, 'manufacturer', 'thechargeport-acura-zdx', 'Acura: up to 190 kW; Wikipedia agrees. Same on all trims (Charge Port).')],
    'ac_max_kw': [F(11.5, W, 'manufacturer', 'thechargeport-acura-zdx', 'Charge Port: 11.5 kW onboard charger.')],
  },
  port: F('ccs1', null, 'manufacturer', 'thechargeport-acura-zdx', 'Charge Port: "The ZDX uses a CCS1 port."'),
};
// Cadillac
const cadCommon = {
  'battery.preconditioning': [PRECOND_CAD()],
};
gens.optiq = {
  fields: {
    ...ultium85({ use: 'wikipedia-cadillac-optiq', note: 'Wikipedia: Ultium 85.0 kWh (usable capacity) NMC for the North American Optiq; KBB lists 85.00 kWh on all trims. 2025-2027 same pack (the 2026 update changed outputs and added RWD, not the pack, per Wikipedia reference titles).' }),
    ...cadCommon,
    'dc_max_kw': [F(150, W, 'manufacturer', 'wikipedia-cadillac-optiq', 'Wikipedia: maximum 150 kW DC, claimed 79 miles in 10 minutes. The Charge Port publishes no figure. Same pack and charger as the Equinox EV (150 kW).')],
    'ac_max_kw': [F(11.5, W, 'manufacturer', 'thechargeport-cadillac-optiq', 'Charge Port: 11.5 kW standard, 19.2 kW with the upgraded charger on some trims; powertrain value is the standard charger (as for the LYRIQ records).')],
  },
};
gens.optiqv = {
  fields: {
    ...ultium85({ use: 'kbb-cadillac-optiq-v-2026-specs', note: 'KBB lists 85.00 kWh for the Optiq-V; same pack as the Optiq (Wikipedia: 85.0 kWh usable). Years 2026-2027.' }),
    ...cadCommon,
    'dc_max_kw': [F(150, W, 'estimated', 'wikipedia-cadillac-optiq', 'Same 85 kWh pack and charger hardware as the Optiq (150 kW); no Optiq-V-specific figure found.')],
    'ac_max_kw': [F(11.5, W, 'estimated', 'thechargeport-cadillac-optiq', 'The Charge Port does not publish an Optiq-V AC rating ("check the owner\'s manual"); Optiq standard charger 11.5 kW assumed.')],
  },
};
gens.vistiq = {
  fields: {
    'battery.capacity_gross_kwh': [F(102, K, 'manufacturer', 'kbb-cadillac-vistiq-2026-specs', 'KBB (relaying Cadillac) lists 102.00 kWh on all trims; Wikipedia 102.0 kWh. Bare capacity treated as gross.')],
    'battery.capacity_usable_kwh': [F(100, K, 'estimated', 'src-wikipedia-cadillac-lyriq', 'Same 102 kWh Ultium pack as the LYRIQ: Wikipedia lists 102 gross / 100 usable (Auto-data 100.4 net); ratio applied. Years 2026-2027.')],
    'battery.chemistry': [F('nmc', null, 'estimated', 'wikipedia-cadillac-vistiq', 'Wikipedia: Ultium NCMA cathode; closest enum nmc.')],
    'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'src-insideevs-equinox-ev-ultium-voltage', 'Estimated from the GM Ultium platform: InsideEVs gives Ultium modules at about 288 V nominal (Equinox EV); the Vistiq 102 kWh pack is the same Ultium module family, 400 V class. No Vistiq page states the voltage.')],
    ...cadCommon,
    'dc_max_kw': [F(190, W, 'manufacturer', 'thechargeport-cadillac-vistiq', 'Charge Port and Wikipedia: DC peak 190 kW (2027 DC figures said to differ from 2026, but no new figure published).')],
    'ac_max_kw': [F(11.5, W, 'manufacturer', 'thechargeport-cadillac-vistiq', 'Charge Port: 11.5 kW standard onboard charger, 19.2 kW optional (305 mi range with the standard charger, 300 mi with the optional one); Wikipedia lists 19.2 kW. Powertrain value is the standard charger.')],
  },
};
gens.celestiq = {
  fields: {
    'battery.capacity_gross_kwh': [F(111, K, 'manufacturer', 'kbb-cadillac-celestiq-2025-specs', 'KBB (relaying Cadillac): "floor-mounted 111 kilowatt-hour lithium-ion battery"; Wikipedia: "total capacity of 111 kWh".')],
    'battery.capacity_usable_kwh': [F(108.8, K, 'estimated', 'wikipedia-cadillac-celestiq', 'No page states Celestiq usable energy (Wikipedia and KBB give only 111 kWh). Basis: Celestiq gross 111 kWh with the usable/gross ratio of the Lyriq pack (100/102, Wikipedia), both GM Ultium NCMA cells: 111 x 100/102 = 108.8. Weak: different pack size and module count. OWNER QUESTION.')],
    'battery.chemistry': [F('nmc', null, 'estimated', 'wikipedia-cadillac-celestiq', 'Wikipedia infobox: 111 kWh NCMA Ultium; closest enum nmc.')],
    'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'src-insideevs-equinox-ev-ultium-voltage', 'No Celestiq page gives the voltage (Wikipedia: "high-voltage Ultium traction battery"). Basis: the GM Ultium lineup is 400 V class except the 20/24-module trucks (InsideEVs: Ultium modules about 288 V nominal). Weak. OWNER QUESTION.')],
    ...cadCommon,
    'dc_max_kw': [F(200, W, 'manufacturer', 'wikipedia-cadillac-celestiq', 'Wikipedia text says "up to 200 kW (DC)" while its infobox lists 190 kW (unresolved; 190 is the figure of the other 102 kWh Ultium Cadillacs). 200 kept as the figure stated in prose. KBB: 78 miles in 10 minutes. OWNER QUESTION.')],
    'ac_max_kw': [F(11.5, W, 'estimated', 'thechargeport-cadillac-vistiq', 'No Celestiq page gives an AC rating. Basis: Cadillac states 11.5 kW as the standard onboard charger with 19.2 kW optional on its Ultium models (Vistiq and Optiq pages); the standard 11.5 kW is recorded because no Celestiq option list was found. OWNER QUESTION.')],
  },
};
// GMC
const hummer = (pack) => {
  const big = pack === 24;
  return {
    fields: {
      'battery.capacity_gross_kwh': big ? [F(246.8, K, 'estimated', 'wikipedia-gmc-hummer-ev', 'Wikipedia infobox: 24-module pack 246.8 / 212.7 kWh (total / usable).')] : [],
      'battery.capacity_usable_kwh': big
        ? [F(200, K, 'manufacturer', 'gm-techlink-hummer-ev-ultium', 'GM TechLink: the 24-module pack provides "approximately 200 kWh of available energy". Wikipedia\'s infobox says 212.7 kWh usable / 246.8 total (6 % higher; not recorded as a value).')]
        : [F(170, K, 'estimated', 'src-weeklydriver-gm-ultium-truck-20', 'Wikipedia: 20-module pack "c. 170 kWh"; The Weekly Driver lists the same 20-module Ultium pack at 170 kWh as published (no usable/gross split). Years/trims: 2X (EPA "2M20", NRCan 20M).')],
      'battery.chemistry': [F('nmc', null, 'estimated', 'src-weeklydriver-gm-ultium-truck-24', 'Same GM Ultium NCMA cells as the 24-module pack (Weekly Driver); closest enum nmc.')],
      'battery.nominal_voltage_class': [F('800v', null, big ? 'manufacturer' : 'estimated', 'gm-techlink-hummer-ev-ultium', 'GM TechLink: ~400 V per layer, layers switched in series for "800-volt DC fast charging". Treated as the 800 V class (as the Silverado EV 24- and 20-module records). ' + (big ? '' : 'The 20-module pack is assumed to use the same switching (The Charge Port: "800V DC charging up to 300 kW" on the 2X).'), false)],
      'battery.preconditioning': [PRECOND_GM('GM TechLink (2022 Hummer) says the apps can precondition the battery for charging; automatic navigation-based preconditioning from the GM guide assumed for the 2024-2025 trucks.')],
      'dc_max_kw': [big
        ? F(350, W, 'manufacturer', 'gm-techlink-hummer-ev-ultium', 'GM TechLink: Level 3 up to 800 V/350 kW; The Charge Port: 24-module pack reaches 350 kW.')
        : F(300, W, 'manufacturer', 'thechargeport-gmc-hummer-ev', 'The Charge Port: "800V DC charging up to 300 kW" (Pickup 2X); 300 kW is also the 20-module Silverado EV figure (GM spec guide).')],
      'ac_max_kw': [F(19.2, W, big ? 'manufacturer' : 'estimated', 'thechargeport-gmc-hummer-ev', 'The Charge Port: home charging up to 19.2 kW (about 80 A); Wikipedia 19.2 kW. ' + (big ? '' : 'No page separates the 2X/20-module AC rating; 19.2 kW assumed (an 11.5 kW standard charger as on the Silverado EV is possible).'))],
    },
  };
};
gens.hummer24 = hummer(24);
const h20suv = hummer(20);
delete h20suv.fields['battery.capacity_gross_kwh'];
h20suv.fields['battery.capacity_usable_kwh'] = [F(170, K, 'estimated', 'src-weeklydriver-gm-ultium-truck-20', 'UNPROVEN pack for the 2025 SUV 3X (OWNER QUESTION): no page gives it. Basis: the 2025 pickup 3X carries NRCan\'s label "(20M Battery)"; the SUV 3X has no such label but its EPA range (502.1 km) equals the pickup 3X, and The Charge Port (2026 page) lists the SUV 3X at 300 kW, the 20-module level. 20-module pack c. 170 kWh (Wikipedia; Weekly Driver as published).')];
gens.hummer20suv3x = h20suv;
gens.hummer20 = hummer(20);
gens.hummer20.fields['battery.capacity_gross_kwh'] = undefined; delete gens.hummer20.fields['battery.capacity_gross_kwh'];
const sierra = (kind) => {
  if (kind === 'std') return {
    fields: {
      'battery.capacity_usable_kwh': [F(119, K, 'estimated', 'src-weeklydriver-gm-ultium-truck-14', 'Wikipedia: Sierra EV Standard Range pack 119 kWh; Weekly Driver 14-module Ultium truck pack 119 kWh as published (no usable/gross split).')],
      'battery.chemistry': [F('nmc', null, 'estimated', 'src-insideevs-silverado-battery', 'GM Ultium cells shared with the Silverado EV; closest enum nmc.')],
      'battery.nominal_voltage_class': [F('400v', null, 'estimated', 'src-weeklydriver-gm-ultium-truck-14', 'Weekly Driver: 14-module pack ~470 V nominal as published; GM spec guide 475 V up to 220 kW; Silverado EV Standard Range recorded 400 V class.')],
      'battery.preconditioning': [PRECOND_GM()],
      'dc_max_kw': [F(220, W, 'estimated', 'src-gm-silverado-ev-2026-spec-guide', 'Same 14-module pack as the Silverado EV Standard Range: GM spec guide 475 V up to 220 kW.')],
      'ac_max_kw': [F(11.5, W, 'estimated', 'src-gm-silverado-ev-2026-spec-guide', 'Silverado EV Standard Range 11.5 kW charging module (GM spec guide); Wikipedia lists 19.2 kW as the Sierra EV maximum (ER/Max).')],
    },
  };
  return {
    fields: {
      'battery.capacity_usable_kwh': [F(170, K, 'estimated', 'src-weeklydriver-gm-ultium-truck-20', 'Wikipedia: Sierra EV Extended Range pack 170 kWh; Weekly Driver 20-module Ultium truck pack 170 kWh as published (no usable/gross split).')],
      'battery.chemistry': [F('nmc', null, 'estimated', 'src-insideevs-silverado-battery', 'GM Ultium cells shared with the Silverado EV; closest enum nmc.')],
      'battery.nominal_voltage_class': [F('800v', null, 'estimated', 'src-gm-silverado-ev-2026-spec-guide', 'Silverado EV Extended Range (same 20-module pack): 670 V, 800 V class, up to 300 kW (GM spec guide); Wikipedia: Sierra EV 400 V switching to 800 V when charging.')],
      'battery.preconditioning': [PRECOND_GM()],
      'dc_max_kw': [F(300, W, 'estimated', 'src-gm-silverado-ev-2026-spec-guide', 'Same 20-module pack as the Silverado EV Extended Range: up to 300 kW (GM spec guide).')],
      'ac_max_kw': [F(11.5, W, 'estimated', 'thechargeport-gmc-sierra-ev', 'The Charge Port Sierra EV page: home charging is 11.5 kW on Elevation, Denali and AT4 Extended Range; 19.2 kW applies only to the Max Range (Denali Max, 205 kWh). Wikipedia lists 19.2 kW as the model maximum, not for this pack.')],
    },
  };
};
gens.sierraStd = sierra('std');
gens.sierraEr = sierra('er');

// ----------------------------------------------------------------------------------------------
// Map powertrain ids to generations and write variant fields
// ----------------------------------------------------------------------------------------------
const mapGen = (id, e) => {
  const y = Number(id.match(/\/(\d{4})-/)[1]);
  const m = e.model;
  if (m === 'chevrolet/bolt-ev') return y <= 2019 ? 'bolt1719' : y <= 2021 ? 'bolt2021' : 'bolt2223';
  if (m === 'chevrolet/bolt-euv') return 'bolteuv';
  if (m === 'chevrolet/bolt') return 'bolt27';
  if (m === 'chevrolet/spark-ev') return 'spark' + y;
  if (m === 'honda/fit-ev') return 'fit';
  if (m === 'honda/clarity-electric') return 'clarity';
  if (m === 'honda/prologue') return 'prologue';
  if (m === 'acura/zdx') return 'zdx';
  if (m === 'cadillac/optiq') return 'optiq';
  if (m === 'cadillac/optiq-v') return 'optiqv';
  if (m === 'cadillac/vistiq') return 'vistiq';
  if (m === 'cadillac/celestiq') return 'celestiq';
  if (m.startsWith('gmc/hummer')) {
    const tr = id.includes('3x') ? '3x' : '2x';
    // 2024 3X = 24-module (EPA 505 km, NRCan "EV3X"); 2025 3X pickup = NRCan "(20M Battery)"; 2X = 20-module (EPA 2M20).
    if (tr === '3x' && y === 2024) return 'hummer24';
    if (tr === '3x' && y === 2025 && m === 'gmc/hummer-ev-suv') return 'hummer20suv3x';
    return 'hummer20';
  }
  if (m === 'gmc/sierra-ev') return id.includes('standard') ? 'sierraStd' : 'sierraEr';
  throw new Error('no gen for ' + id);
};
const sparkGen = (y) => (gens['spark' + y] ??= spark(y));
for (const y of [2014, 2015, 2016]) sparkGen(y);

const hasCA = (e) => e.variants.some((v) => v.markets.includes('CA'));
const hasUS = (e) => e.variants.some((v) => v.markets.includes('US'));
const isNacsYear = (id, m) => {
  const y = Number(id.match(/\/(\d{4})-/)[1]);
  return y >= 2027 && (m.startsWith('cadillac/') || m === 'gmc/sierra-ev');
};

const powertrains = {};
const variants = {};
for (const e of gaps) {
  const id = e.powertrain_id;
  const gk = mapGen(id, e);
  const g = gens[gk];
  const fields = {};
  for (const [k, v] of Object.entries(g.fields)) if (v && v.length) fields[k] = v;
  const m = e.model;
  const y = Number(id.match(/\/(\d{4})-/)[1]);
  const vf = {};
  let port = g.port, sc = g.sc;
  if (!port) {
    if (m === 'cadillac/optiq' || m === 'cadillac/optiq-v') port = F('ccs1', null, 'estimated', 'wikipedia-cadillac-optiq', 'Wikipedia: North American Optiq has a CCS Type 1 port (NACS via adapter); same on the Optiq-V. Model years 2025-2026 (2027 moves to NACS).');
    else if (m === 'cadillac/vistiq') port = F('ccs1', null, 'manufacturer', 'thechargeport-cadillac-vistiq', 'The Charge Port: the 2026 Vistiq uses CCS1 and needs the GM $299 NACS DC adapter for Superchargers.');
    else if (m === 'cadillac/celestiq') port = F('ccs1', null, 'estimated', 'src-thechargeport-lyriq-2027', 'GM Ultium Cadillacs through 2026 use CCS1 (The Charge Port, LYRIQ/Vistiq pages); no Celestiq page states the port. Model years 2025-2026.');
    else if (m.startsWith('gmc/hummer')) port = F('ccs1', null, 'manufacturer', 'thechargeport-gmc-hummer-ev', 'The Charge Port: the Hummer EV has a CCS1 port that needs an adapter for Superchargers (tools section).');
    else if (m === 'gmc/sierra-ev') port = F('ccs1', null, 'estimated', 'src-gm-silverado-ev-2026-spec-guide', 'The GM 2026 Silverado EV spec guide treats the J1772/CCS1 inlet as native with an optional NACS DC adapter; the Sierra EV is the same truck. Model years 2025-2026.');
  }
  if (isNacsYear(id, m)) {
    const srcN = m === 'gmc/sierra-ev' ? 'src-thechargeport-equinox-ev' : (m === 'cadillac/vistiq' ? 'thechargeport-cadillac-vistiq' : 'thechargeport-cadillac-optiq');
    port = F('nacs', null, 'estimated', srcN, m === 'gmc/sierra-ev'
      ? 'Estimated from the GM 2027 changeover: The Charge Port says the 2027 Equinox EV has native NACS (2024-2026 CCS1), and its 2027 Lyriq and Vistiq pages say the same; no page for the 2027 Sierra EV or Silverado EV states the port (gmc.com 403, Charge Port Sierra page silent). Weak: the truck is not confirmed.'
      : (m === 'cadillac/vistiq' ? 'The Charge Port: the 2027 Vistiq has a native NACS port. Model-year 2027.' : 'The Charge Port Optiq page describes the Optiq and Optiq-V trims as "native NACS" (no year split stated); the 2026 car uses CCS1 (Wikipedia). Model-year 2027.'));
    sc = F('yes', null, 'estimated', srcN, 'Native NACS port on the 2027 model year charges at Tesla Superchargers without an adapter (The Charge Port pages for Vistiq/Optiq/Equinox EV; Sierra EV inferred from the port estimate). US.');
  } else if (!sc) {
    if (hasCA(e) && hasUS(e)) sc = NA_ADAPTER_CA('Markets on this powertrain: CA and US; US reads InsideEVs\' list.');
    else if (hasCA(e)) sc = NA_ADAPTER_CA('Canada only.');
    else sc = NA_ADAPTER_US();
    if (m.startsWith('honda/') || m === 'acura/zdx') {
      // Honda/Acura programme (not GM): same logic, different adapter vendor
      sc.notes = sc.notes.replace('GM/Honda-approved', 'Honda/Acura-approved').replace('GM announced the NACS adapter for all GM EVs', 'GM\'s announcement covers GM brands; Honda and Acura announced their own Supercharger programmes (Acura-approved adapter $225, access since July 2025 per The Charge Port)');
    }
  }
  if (m.startsWith('honda/') || m === 'acura/zdx') {
    if (m === 'acura/zdx' || m === 'honda/prologue') {
      // US reads InsideEVs list; CA: Honda Canada programme not read
      if (hasCA(e)) { sc = F('via_adapter', null, 'estimated', 'insideevs-nontesla-supercharger-access-2026', 'US: listed on InsideEVs as Supercharger-compatible with the Honda/Acura adapter (The Charge Port for ZDX: Acura adapter $225, access since July 2025). Canada: no Honda Canada/Acura Canada page found; assumed the same adapter access for the Canadian car. Current state for this model year.'); }
      else sc = F('via_adapter', null, 'manufacturer', m === 'acura/zdx' ? 'thechargeport-acura-zdx' : 'insideevs-nontesla-supercharger-access-2026', 'US: CCS1 car, Supercharger access with the manufacturer-approved NACS adapter; listed on InsideEVs. Current state for this model year.');
    }
  }
  powertrains[id] = { fields, variant_fields: { charge_port: [port], supercharger_access: [sc] } };
  for (const v of e.variants) variants[v.id] = null;
}
for (const k of Object.keys(variants)) delete variants[k];
// Drop unused sources
const keep = new Set();
const walk = (o) => { if (o && typeof o === 'object') { if (o.source_id) keep.add(o.source_id); Object.values(o).forEach(walk); } };
walk(powertrains);
const outSources = sources.filter((s) => keep.has(s.id));
const missing = [...keep].filter((id) => !outSources.some((s) => s.id === id));
if (missing.length) throw new Error('missing sources: ' + missing.join(', '));
fs.writeFileSync('research/batch-2026-11-19-w2-gm-honda.json', JSON.stringify({ sources: outSources, powertrains }, null, 2) + '\n');
console.log('powertrains', Object.keys(powertrains).length, 'sources', outSources.length, 'expected', gaps.length);
