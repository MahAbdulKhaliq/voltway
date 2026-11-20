// Fact-check fixes for the Tesla W2 batch; called by gen-w2-tesla.cjs with the `out` powertrain map.
const sid = (x) => 'src-' + x;
module.exports = function patchAll(out) {
  for (const [id, p] of Object.entries(out)) {
    const model = id.split('/').slice(0, 2).join('/');
    const m = id.split('/')[2];
    const year = +m.slice(0, 4);
    const lab = m.slice(5).replace(/-\d$/, '').replace(/-us$/, '');
    const X = model === 'tesla/model-x';
    const f = p.fields;
    const n = (lab.match(/^p?(\d+)/) || [])[1];
    const P = /^p/.test(lab);
    const set = (o, kind, src, notes) => {
      o.kind = kind;
      if (src) o.source_id = sid(src);
      if (notes) o.notes = notes;
      if (kind === 'estimated' && !o.notes.startsWith('Estimated')) o.notes = 'Estimated: ' + o.notes;
    };
    const dc = f.dc_max_kw[0], ac = f.ac_max_kw[0], us = f['battery.capacity_usable_kwh'][0], gr = f['battery.capacity_gross_kwh'][0], pc = f['battery.preconditioning'][0];

    if (model === 'tesla/cybertruck') {
      const rwd = /long-range-rwd/.test(lab);
      f.dc_max_kw[0] = { value: 250, unit: 'kW', kind: 'manufacturer', source_id: sid('arenaev-cybertruck-awd-2026'), low_confidence: true, notes: "Tesla's stated Cybertruck DC spec of 250 kW as relayed on ArenaEV's 2026 Dual Motor AWD page (InsideEVs also: stated spec 250 kW). Higher peaks occur only on a few V4-post trial stations: one owner-posted clip reached 325 kW at 18 % SoC (InsideEVs 2024-08-05; Green Cars Compare lists 325 kW). iFixit lists up to 350 kW at 800 V." };
      us.kind = rwd ? 'community' : 'estimated';
      us.source_id = sid('gcc-cybertruck-lr-rwd');
      us.notes = rwd
        ? 'Green Cars Compare Cybertruck Long Range RWD: 117 kWh usable of 122.4 gross. ArenaEV Dual Motor AWD lists 111.9 usable of 123 (4.5 % lower): sources conflict. Tesla does not publish usable.'
        : 'Estimated: Green Cars Compare states 117 kWh usable for the Long Range RWD; the AWD trims share the 123 kWh 4680 pack. ArenaEV lists 111.9 kWh usable for the Dual Motor AWD (4.5 % lower): sources conflict.';
      pc.source_id = sid('notebookcheck-tesla-precond-season');
      pc.notes = "Estimated: Notebookcheck says Tesla's Trip Planner warms the battery before a Supercharger and names the Cybertruck only in passing (as an 800 V, 4680 example); the same software feature runs on the whole Tesla line (Electrek: 2020.24.6 release note for Model S/X). Whether a manual battery-warming control exists is not shown by any page opened (tesla.com manuals 403).";
      continue;
    }

    if (year <= 2017) {
      pc.source_id = sid('manualslib-tesla-s-owners-manual-p145');
      pc.notes = 'Estimated: a Model S owner\'s manual (ManualsLib page 145, undated edition, quoted: "When navigating to a Supercharger location, Model S may allocate energy to pre-heat the Battery"); Electrek (2020.24.6 release note) gives the same behaviour for Model S/X in 2020 software. No page says whether every MCU1-era car (2012-2017) runs it, and cars ordered without navigation (Tech Package; TMC thread 2019-03-07) probably do not. No manual battery control found. tesla.com manuals are 403.';
    }

    if (n === '90') {
      gr.value = 85.8; gr.source_id = sid('arenaev-model-x-90d'); gr.kind = X ? 'community' : 'estimated';
      gr.notes = (X ? '' : 'Estimated: same 90 kWh pack as the Model X 90D. ') + 'ArenaEV Model X 90D: 85.8 kWh total (gross), 81.8 kWh usable. ArenaEV\'s Model S 90D page and EVSpecifications call the pack "90 kWh" (marketing size); one value kept for both models.';
      us.notes = (X ? '' : 'Estimated: same pack as the Model X 90D. ') + 'ArenaEV Model X 90D: 81.8 kWh usable (81.8 / 85.8 = 0.953).';
    }
    if (n === '85') us.notes += ' Basis is not same-cell: the 90 pack uses newer cells with the same 7,104 count.';
    if (n === '60' && year <= 2015) us.notes += ' Basis is not the same pack (the X 60D is a 75 kWh pack software-limited to 60): weak.';
    if (n === '70') us.notes += ' Weak: no page shows the 70 kWh pack shares the 75 pack hardware (EVSpecifications gives 5,880 cells and 302 V only for the 75).';
    if (n === '60' && year >= 2016) {
      us.notes += ' Early-2016 "60" cars may carry the real 60 kWh pack rather than the limited 75.';
      if (!X) { gr.kind = 'estimated'; gr.notes = 'Estimated: ' + gr.notes; }
    }

    const raven = /long-range|performance/.test(lab) && year >= 2019;
    const palladium = year >= 2022 || /plaid/.test(lab) || (year === 2021 && lab === 'long-range');
    const sr = /standard-range/.test(lab);

    if (!raven && !palladium && !sr && year >= 2013) {
      if (X) {
        if (year === 2018 && lab === 'p100d') set(dc, 'community', 'evspecs-model-s-2018-100d-compare', 'EVSpecifications 2018 Model X P100D: DC 145 kW (a 72 kW DC line is also listed). The Model S rows on the same compare page give 120 kW.');
        else if (n === '100') set(dc, 'estimated', 'evspecs-model-s-2018-100d-compare', 'EVSpecifications 2018 Model X P100D lists DC 145 kW; same 100 kWh pack and charger on the other 2016-2019 Model X 100D/P100D (year differs from the page 2018).');
        else set(dc, 'estimated', 'evspecs-model-s-2018-100d-compare', 'Same-year Model S figure (EVSpecifications S 75D/90D/100D: 120 kW); no Model X page for this pack gives its own DC limit (the X P100D page says 145 kW).');
        if (n === '100') dc.value = 145;
      } else {
        const exact = (year === 2017 && (n === '90' || n === '75')) || (year === 2018 && (n === '75' || n === '100'));
        if (exact) set(dc, 'community', year === 2017 ? 'evspecs-model-s-2017-90d-75d-compare' : 'evspecs-model-s-2018-100d-compare', 'EVSpecifications ' + year + ' Model S ' + n + ' kWh: DC max 120 kW (ArenaEV 150, EV Database about 145 for the 100 kWh pack; European listings).');
        else if (year === 2014 && n === '85' && !P && !/d$/.test(lab)) { /* exact page */ }
        else if (year === 2013) set(dc, 'estimated', 'evspecs-model-s-2014-85', 'EVSpecifications gives 90 kW for 2012 and 120 kW for 2014 (85 kWh); 2013 carried over from 2014 (unproven: 2012 was lower).');
        else set(dc, 'estimated', year >= 2017 ? 'evspecs-model-s-2018-100d-compare' : 'evspecs-model-s-2014-85', 'EVSpecifications gives 120 kW for the 2014 85 kWh, 2015 85D, 2017 75D/90D and 2018 75D/100D/P100D Model S; carried to ' + year + ' ' + (n || lab) + ' (other year or pack than the cited page). No page shows a pack-specific limit.');
      }
    }

    if (!X && year <= 2013) ac.notes = 'Tesla 2012-2020 Model S service manual VIN reference, 2012-2013 digit 7 "Charger Type": "A" = "10 kW Charger", "B" = "20 kW Charger", "C"/"D" the same with DC fast charge. The single 10 kW charger is the standard fitment, the 20 kW dual charger an option (Wikipedia: two onboard chargers optional before 2016); not a Signature-specific finding. EVSpecifications lists 11.5 kW (240 V 48 A) for 2012 but that looks generic.';
    if (year >= 2014 && year <= 2015) ac.notes += ' Low confidence: EVSpecifications MY14/15 pages list 11.5 kW (240 V, 48 A); the 10 kW is the 2012-13 standard single charger carried forward.';
    if (X) set(ac, 'estimated', 'evspecs-model-s-2018-100d-compare', 'No Model X page states the standard onboard charger: ArenaEV X pages list 11 kW or 16.5 kW, EVSpecifications 2018 X P100D lists 17.28 kW and X Plaid pages 7.4 / 16.5 kW. Standard 48 A / 11.5 kW taken from the same-year Model S (EVSpecifications 2017-2018 S, 2023/2025 S Plaid); higher-amperage chargers were optional.');

    if (X && year === 2019 && raven) {
      gr.notes = 'ArenaEV Model X Long Range (2019-2021): 100 kWh total.';
      us.value = 95; us.kind = 'estimated'; us.source_id = sid('arenaev-model-x-100d');
      us.notes = 'Estimated: ArenaEV Model X 100D page lists 95 kWh usable for the 100 kWh pack. No page dates a Raven-hardware Model X in 2019, so these ids are kept on the 100D hardware.';
      set(dc, 'estimated', 'evspecs-model-s-2018-100d-compare', 'No page dates a Raven-hardware Model X in 2019 (ArenaEV X Long Range 2019-21 lists V2 150 kW). Kept on the 2018 Model X P100D hardware: EVSpecifications DC 145 kW.');
      dc.value = 145;
    }

    if (raven && year >= 2020) set(dc, 'estimated', 'insideevs-s-x-250kw-wires', 'InsideEVs: Tesla lists up to 250 kW for newly ordered Model S/X (2020, undated page), after 225 kW by software 2020.24.6 (Electrek) and 200 kW at launch; cars built before mid-2020 may still be 225 kW.' + (X ? ' No Model X page; same Raven charger family as the Model S.' : ''));
    if (raven && year === 2021 && !X) { gr.kind = 'estimated'; gr.notes = 'Estimated: ' + gr.notes + ' (2020 page applied to 2021).'; }

    if (palladium) {
      const plaidPage = !X && /plaid/.test(lab) && (year === 2021 || year === 2025);
      if (!plaidPage) {
        for (const o of [gr, us]) {
          o.kind = 'estimated';
          if (!o.notes.startsWith('Estimated')) o.notes = 'Estimated: Palladium-pack sibling (Model S Plaid, ArenaEV page: 100 kWh total, 92.3 kWh usable; EVSpecifications 99 kWh) applied to this trim, year or model. ' + o.notes;
        }
      }
      const exact = (!X && (year === 2023 || year === 2025)) || (X && year === 2023);
      const src = X ? 'evspecs-model-x-2023-plaid' : (year === 2025 ? 'evspecs-model-s-2025-plaid' : 'evspecs-model-s-2023-plaid');
      set(dc, exact ? 'community' : 'estimated', src, 'EVSpecifications 2023/2025 Model S and X Plaid: DC max 250 kW' + (exact ? '.' : '; carried to ' + year + ' (another year of the same hardware). The EVSpecifications 2021 Plaid page says 200 kW; InsideEVs 2021 gives 250 kW for Model S/X Long Range and a 15-minute 187-mile Plaid claim.'));
      if (!X) set(ac, exact ? 'community' : 'estimated', src, 'EVSpecifications Model S Plaid (2023, 2025): AC 11.5 kW (240 V, 48 A); ' + (exact ? '' : 'carried to ' + year + '. ') + 'a higher-amperage charger was optional on some cars; standard recorded.');
      else { ac.source_id = sid('evspecs-model-s-2023-plaid'); ac.notes = 'Estimated: no Model X page states the standard onboard charger; EVSpecifications X Plaid pages list 7.4 kW and 16.5 kW AC, ArenaEV X pages 11 / 16.5 kW. Standard 48 A / 11.5 kW taken from the same-year Model S (EVSpecifications 2023/2025 S Plaid: 11.5 kW, 240 V 48 A); higher-amperage charger optional.'; }
    }
    if (X && sr) { gr.kind = 'estimated'; gr.notes = 'Estimated: Model S Standard Range pack (ArenaEV 2019: 75 kWh total); no Model X Standard Range page opened.'; }
  }
};
