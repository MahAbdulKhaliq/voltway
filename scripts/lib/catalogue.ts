// Catalogue suggestions from regulator rows (B90, B91, DESIGN-9 §2): which of our models a row
// belongs to, how a model year's rows group into variants, and how Canadian (NRCan) and US (EPA)
// groups pair up. Suggestions only; the owner approves every row.

import { drivetrainFrom, normalizeMake, parseName, similarity, slugify, tokenize, type Drivetrain } from './match.ts';

export interface ModelMap { models: { id: string; nrcan: string[]; epa: string[] }[] }

export interface RegRow {
  source: 'nrcan' | 'epa';
  market: 'CA' | 'US';
  source_key: string;
  year: number;
  make: string;
  label: string;          // NRCan Model / EPA model column
  base_model?: string;    // EPA baseModel
  drive?: string;         // EPA drive column
  motor_kw: number | null;
  model_id?: string;
}

export interface Proposal {
  id: string;
  model_id: string;
  year: number;
  variant_id: string;
  existing: boolean;      // adds a market to a variant we already have
  markets: ('CA' | 'US')[];
  drivetrain?: Drivetrain;
  powertrain: string;     // an existing powertrain id, or "new"
  names: Partial<Record<'CA' | 'US', string>>;
  wheels: number[];
  named: boolean;         // every row's name comes from crosswalk/trim-names.csv
  flags: string[];
  rows: RegRow[];
}

const makeSlug = (make: string) => slugify(normalizeMake(make));
const startsWithWord = (label: string, prefix: string) =>
  label.toLowerCase().startsWith(prefix.toLowerCase()) && !/[a-z0-9]/i.test(label.charAt(prefix.length));

/** Our model for a regulator row, by the longest listed prefix (NRCan) or base model (EPA); null if none. */
export function assignModel(r: RegRow, map: ModelMap): string | null {
  let best: { id: string; len: number } | null = null;
  for (const m of map.models) {
    if (m.id.split('/')[0] !== makeSlug(r.make)) continue;
    const names = r.source === 'nrcan' ? m.nrcan : m.epa;
    for (const n of names) {
      const hit = r.source === 'nrcan' ? startsWithWord(r.label, n) : (r.base_model ?? '').toLowerCase() === n.toLowerCase() || startsWithWord(r.label, n);
      if (hit && (!best || n.length > best.len)) best = { id: m.id, len: n.length };
    }
  }
  return best?.id ?? null;
}

const DRIVE: Record<string, Drivetrain> = { 'all-wheel drive': 'awd', '4-wheel drive': 'awd', 'part-time 4-wheel drive': 'awd', 'rear-wheel drive': 'rwd', 'front-wheel drive': 'fwd' };

/** The trim part of a regulator label: the label minus the model name, parsed for hints. */
export function trimPart(r: RegRow, map: ModelMap) {
  const m = map.models.find((x) => x.id === r.model_id);
  const prefixes = [...(r.source === 'nrcan' ? m?.nrcan ?? [] : [...(m?.epa ?? []), r.base_model ?? ''])].filter(Boolean).sort((a, b) => b.length - a.length);
  let rest = r.label;
  const pre = prefixes.find((p) => startsWithWord(rest, p));
  if (pre) rest = rest.slice(pre.length);
  else if (r.base_model && startsWithWord(rest, r.base_model)) rest = rest.slice(r.base_model.length);
  rest = rest.replace(/^[\s-]+/, '').replace(/^(EV|Electric|Recharge)\b\s*/i, '');
  // Bracketed hints, by kind: wheels/tires and chargers group together; a battery or range
  // ("(Long Range)", "(77.4 kWh)") is part of the name, so it splits cars; anything else is a note.
  const wheels: number[] = [];
  const notes: string[] = [];
  const kept: string[] = [];
  let charger_kw: number | undefined;
  let date_note: string | undefined;
  for (const [all, inner] of [...rest.matchAll(/\(([^)]*)\)/g)]) {
    rest = rest.replace(all, ' ');
    const sizes = [...inner.matchAll(/(?<!\d)(1[4-9]|2[0-4])(?!\d)/g)].map((m) => Number(m[1]));
    if (sizes.length && /wheel|tire|tyre|inch|\d{2}\s*in\b|\d{2}\s*("|''|″)|\bAT\b|UHP/i.test(inner)) wheels.push(...sizes);
    else if (/kw\s*(charger|chgr)|^\s*\d+(\.\d+)?\s*kw\s*$/i.test(inner)) charger_kw = Number(inner.match(/\d+(\.\d+)?/)![0]);
    else if (/^(pre|post)-/i.test(inner.trim())) date_note = inner.trim();
    else if (/kwh|kw-hr|\bah\b|battery|range/i.test(inner)) kept.push(inner.trim());
    else notes.push(inner.trim());
  }
  const p = parseName([rest, ...kept].join(' '));
  const drivetrain = p.drivetrain ?? (r.drive ? DRIVE[r.drive.toLowerCase()] : undefined);
  const words = p.base.replace(/^\s*-\s*/, '').trim();
  return { ...p, wheels: [...new Set(wheels)].sort((a, b) => a - b), wheel_in: wheels[0], charger_kw, date_note, drivetrain, name: words, tokens: tokenize(words), notes };
}

/** Key of a regulator label in crosswalk/trim-names.csv. */
export const trimNameKey = (source: string, year: number | string, label: string) => `${source}|${year}|${label.replace(/\s+/g, ' ').trim()}`;

/** EPA's motor text ("74 and 165 kW PMSM") as total kW, comparable with NRCan's motor_kw; null if unknown. */
export function epaMotorKw(motor: string | undefined): number | null {
  const kw = motor?.match(/^(.*?)\bkw\b/i)?.[1];
  const nums = kw ? [...kw.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0])) : [];
  return nums.length ? nums.reduce((a, b) => a + b, 0) : null;
}

const DRIVE_WORDS = new Set(['awd', 'rwd', 'fwd', '4wd', '2wd', '4x4']);
const trimWords = (tokens: string[]) => { const t = tokens.filter((x) => !DRIVE_WORDS.has(x)); return t.length ? t : ['(base)']; };

const motorClose = (a: number | null | undefined, b: number | null | undefined) => Boolean(a && b && Math.abs(a - b) / Math.max(a, b) <= 0.03);

function cleanName(name: string, drivetrain?: Drivetrain): string {
  if (name) return name;
  return drivetrain ? drivetrain.toUpperCase() : 'Standard';
}

/**
 * Groups one wave's rows into variant proposals. Within a model year and market, rows that differ
 * only by wheel size, onboard charger, NRCan letter code or a date note share a proposal. A Canadian
 * and a US group pair into one two-market proposal when their trim words agree (Dice ≥ 0.6) and the
 * drivetrain matches; anything else stays market-specific (B91).
 */
export function groupRegulatorRows(
  rows: RegRow[],
  existing: Map<string, { id: string; model_id: string; year: number; drivetrain: string; powertrain_id?: string; markets?: string[]; motor_kw?: number | null; trims?: { names?: Record<string, string> }[] }>,
  _crosswalk: Record<string, string>[],
  map: ModelMap = { models: [] },
  generationOf: (modelId: string, year: number) => string | undefined = () => undefined,
  trimNames: Map<string, string> = new Map(),
): Proposal[] {
  type G = { model_id: string; year: number; market: 'CA' | 'US'; key: string; name: string; tokens: string[]; drivetrain?: Drivetrain; motor_kw: number | null; named: boolean; wheels: Set<number>; flags: Set<string>; rows: RegRow[] };
  const groups = new Map<string, G>();
  for (const r of rows) {
    if (!r.model_id) continue;
    const parsed = trimPart(r, map.models.length ? map : { models: [{ id: r.model_id, nrcan: [], epa: [] }] });
    // A researched buyer-facing name (crosswalk/trim-names.csv) replaces the regulator's wording.
    const mapped = trimNames.get(trimNameKey(r.source, r.year, r.label));
    const t = mapped ? { ...parsed, name: mapped, tokens: tokenize(mapped), drivetrain: drivetrainFrom(mapped) ?? parsed.drivetrain, pack_kwh: undefined } : parsed;
    const key = [r.model_id, r.year, r.market, t.tokens.join(' '), t.drivetrain ?? '-', t.pack_kwh ?? '-', r.source === 'nrcan' ? r.motor_kw ?? '-' : '-'].join('|');
    const g = groups.get(key) ?? { model_id: r.model_id, year: r.year, market: r.market, key, name: t.name, tokens: t.tokens, drivetrain: t.drivetrain, motor_kw: r.motor_kw, named: true, wheels: new Set<number>(), flags: new Set<string>(), rows: [] };
    for (const w of t.wheels) g.wheels.add(w);
    g.motor_kw ??= r.motor_kw;
    if (t.code) g.flags.add(`code: NRCan "-${t.code}"`);
    if (t.date_note) g.flags.add(`date: "${t.date_note}"`);
    if (t.charger_kw) g.flags.add(`charger ${t.charger_kw} kW on one row (trim onboard charger)`);
    for (const n of t.notes) g.flags.add(`note: "(${n})"`);
    if (!mapped && !t.tokens.length) g.flags.add('name: no trim words in the regulator label');
    if (!mapped) g.named = false;
    g.rows.push(r);
    groups.set(key, g);
  }

  // Pair CA and US groups per model year.
  const byYear = new Map<string, G[]>();
  for (const g of groups.values()) byYear.set(`${g.model_id}|${g.year}`, [...(byYear.get(`${g.model_id}|${g.year}`) ?? []), g]);
  const out: Proposal[] = [];
  for (const [, gs] of [...byYear].sort(([a], [b]) => a.localeCompare(b))) {
    const ca = gs.filter((g) => g.market === 'CA');
    const us = gs.filter((g) => g.market === 'US');
    const used = new Set<G>();
    const pairs: [G | null, G | null, boolean | 'motor'][] = [];
    for (const c of ca) {
      const dtOk = (a?: Drivetrain, b?: Drivetrain) => !a || !b || a === b;
      const cands = us.filter((u) => !used.has(u) && dtOk(u.drivetrain, c.drivetrain));
      // Words without drivetrain words; NRCan names AWD explicitly, so an unmarked Canadian row leans 2WD.
      const lean = (u: G) => (c.drivetrain || !u.drivetrain ? 0 : u.drivetrain === 'awd' ? -0.1 : 0.1);
      const scored = cands.map((u) => ({ u, s: similarity(trimWords(c.tokens), trimWords(u.tokens)) })).sort((a, b) => b.s + lean(b.u) - (a.s + lean(a.u)));
      const best = scored[0];
      // Motor power is a fallback only (EPA's motor text is sometimes one motor of two, or "TBD").
      // Two researched names that share no trim word are different cars, whatever the motor says.
      const byMotor = cands.filter((u) => motorClose(u.motor_kw, c.motor_kw) && (c.drivetrain ? c.drivetrain === u.drivetrain : u.drivetrain !== 'awd') &&
        (!(c.named && u.named) || similarity(trimWords(c.tokens), trimWords(u.tokens)) > 0));
      if (best && best.s >= 0.6) { used.add(best.u); pairs.push([c, best.u, false]); }
      else if (byMotor.length === 1) { used.add(byMotor[0]); pairs.push([c, byMotor[0], 'motor']); }
      else if (cands.length === 1 && ca.filter((x) => dtOk(x.drivetrain, c.drivetrain)).length === 1 &&
        (!(c.named && cands[0].named) || similarity(trimWords(c.tokens), trimWords(cands[0].tokens)) > 0)) { used.add(cands[0]); pairs.push([c, cands[0], true]); }
      else pairs.push([c, null, false]);
    }
    for (const u of us) if (!used.has(u)) pairs.push([null, u, false]);

    const slugs = new Set<string>();
    // A motor-power join to an existing variant counts only when it is unambiguous: one variant has
    // that power and drivetrain, and no other group of this year has the same power.
    const powerOf = (p: (typeof pairs)[number]) => p[0]?.motor_kw ?? p[1]?.motor_kw;
    for (const [c, u, guessed] of pairs) {
      const flagsExtra: string[] = [];
      const g = { ...(c ?? u)!, drivetrain: c?.drivetrain ?? u?.drivetrain };
      const markets = [c && 'CA', u && 'US'].filter(Boolean) as ('CA' | 'US')[];
      const names: Proposal['names'] = {};
      if (c) names.CA = cleanName(c.name, c.drivetrain);
      if (u) names.US = cleanName(u.name, u.drivetrain);
      // An existing variant of this model year with the same name and drivetrain takes the new market.
      // An existing variant of this model year takes the new market: same words, or (when the names
      // differ by market, e.g. Kia "Wind" in Canada = "Long Range RWD" in the US) the same motor power.
      const motor = c?.motor_kw ?? u?.motor_kw;
      const sameYear = [...existing.values()].filter((v) => v.model_id === g.model_id && v.year === g.year && (v.drivetrain === 'unknown' || !g.drivetrain || v.drivetrain === g.drivetrain));
      const exByName = sameYear
        .map((v) => ({ v, s: similarity(trimWords(tokenize(v.trims?.[0]?.names?.CA ?? v.id.split('/')[3].replace(/-/g, ' '))), trimWords(g.tokens)) }))
        .filter((x) => x.s >= 0.6).sort((a, b) => b.s - a.s)[0]?.v;
      const exByMotor = exByName ? undefined : sameYear.filter((v) => motorClose(motor, v.motor_kw));
      const motorUnique = pairs.filter((p) => motorClose(powerOf(p), motor) && (p[0] ?? p[1])!.drivetrain === g.drivetrain).length === 1;
      const ex = exByName ?? (exByMotor?.length === 1 && motorUnique ? exByMotor[0] : undefined);
      if (!ex && exByMotor?.length && !motorUnique) flagsExtra.push(`existing?: same motor power as ${exByMotor.map((v) => v.id).join(', ')}, but another ${g.year} row has it too`);
      let slug = ex ? ex.id.split('/')[3] : slugify(names.CA ?? names.US ?? 'standard') || 'standard';
      if (!ex && markets.length === 1 && slugs.has(slug)) slug = `${slug}-${markets[0].toLowerCase()}`;
      slugs.add(slug);
      // Powertrain: the same-named variant from another year of this model, when there is one.
      // Never across a generation boundary (B92/B95: a new generation is new hardware); nearest year first.
      const gen = generationOf(g.model_id, g.year);
      const sibling = [...existing.values()]
        .filter((v) => v.model_id === g.model_id && v.year !== g.year && v.id.split('/')[3] === slug && v.powertrain_id && gen !== undefined && generationOf(v.model_id, v.year) === gen)
        .sort((a, b) => Math.abs(a.year - g.year) - Math.abs(b.year - g.year))[0];
      const flags = new Set<string>([...(c?.flags ?? []), ...(u?.flags ?? []), ...flagsExtra]);
      if (guessed === 'motor') flags.add(`pair: names differ, same motor power (${c?.motor_kw} kW)`);
      else if (guessed) flags.add('pair: only one candidate each side, words differ');
      if (ex && !exByName) flags.add(`existing: joins ${ex.id} by motor power (${motor} kW); names differ`);
      if (sibling) flags.add(`powertrain: same name as ${sibling.id}; check the pack didn't change`);
      out.push({
        id: `${g.model_id}/${g.year}/${slug}`,
        model_id: g.model_id,
        year: g.year,
        variant_id: `${g.model_id}/${g.year}/${slug}`,
        existing: Boolean(ex),
        markets,
        drivetrain: g.drivetrain,
        powertrain: ex?.powertrain_id ?? sibling?.powertrain_id ?? 'new',
        names,
        wheels: [...new Set([...(c?.wheels ?? []), ...(u?.wheels ?? [])])].sort((a, b) => a - b),
        named: Boolean((!c || c.named) && (!u || u.named)),
        flags: [...flags],
        rows: [...(c?.rows ?? []), ...(u?.rows ?? [])],
      });
    }
  }
  return out;
}
