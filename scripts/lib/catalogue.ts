// Catalogue suggestions from regulator rows (B90, B91, DESIGN-9 §2): which of our models a row
// belongs to, how a model year's rows group into variants, and how Canadian (NRCan) and US (EPA)
// groups pair up. Suggestions only; the owner approves every row.

import { normalizeMake, parseName, similarity, slugify, tokenize, type Drivetrain } from './match.ts';

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
  const notes = [...rest.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]).filter((n) => !/wheel|kw|kwh|\d{2}\s*("|in)|pre-|post-/i.test(n));
  for (const n of notes) rest = rest.replace(`(${n})`, ' ');
  const p = parseName(rest);
  const drivetrain = p.drivetrain ?? (r.drive ? DRIVE[r.drive.toLowerCase()] : undefined);
  const words = p.base.replace(/^\s*-\s*/, '').trim();
  return { ...p, drivetrain, name: words, tokens: tokenize(words), notes };
}

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
  existing: Map<string, { id: string; model_id: string; year: number; drivetrain: string; powertrain_id?: string; markets?: string[]; trims?: { names?: Record<string, string> }[] }>,
  _crosswalk: Record<string, string>[],
  map: ModelMap = { models: [] },
  generationOf: (modelId: string, year: number) => string | undefined = () => undefined,
): Proposal[] {
  type G = { model_id: string; year: number; market: 'CA' | 'US'; key: string; name: string; tokens: string[]; drivetrain?: Drivetrain; wheels: Set<number>; flags: Set<string>; rows: RegRow[] };
  const groups = new Map<string, G>();
  for (const r of rows) {
    if (!r.model_id) continue;
    const t = trimPart(r, map.models.length ? map : { models: [{ id: r.model_id, nrcan: [], epa: [] }] });
    const key = [r.model_id, r.year, r.market, t.tokens.join(' '), t.drivetrain ?? '-', t.pack_kwh ?? '-'].join('|');
    const g = groups.get(key) ?? { model_id: r.model_id, year: r.year, market: r.market, key, name: t.name, tokens: t.tokens, drivetrain: t.drivetrain, wheels: new Set<number>(), flags: new Set<string>(), rows: [] };
    if (t.wheel_in) g.wheels.add(t.wheel_in);
    if (t.code) g.flags.add(`code: NRCan "-${t.code}"`);
    if (t.date_note) g.flags.add(`date: "${t.date_note}"`);
    if (t.charger_kw) g.flags.add(`charger ${t.charger_kw} kW on one row (trim onboard charger)`);
    for (const n of t.notes) g.flags.add(`note: "(${n})"`);
    if (!t.tokens.length) g.flags.add('name: no trim words in the regulator label');
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
    const pairs: [G | null, G | null, boolean][] = [];
    for (const c of ca) {
      const dtOk = (a?: Drivetrain, b?: Drivetrain) => !a || !b || a === b;
      const cands = us.filter((u) => !used.has(u) && dtOk(u.drivetrain, c.drivetrain));
      const scored = cands.map((u) => ({ u, s: similarity(c.tokens, u.tokens) })).sort((a, b) => b.s - a.s);
      const best = scored[0];
      if (best && best.s >= 0.6) { used.add(best.u); pairs.push([c, best.u, false]); }
      else if (cands.length === 1 && ca.filter((x) => dtOk(x.drivetrain, c.drivetrain)).length === 1) { used.add(cands[0]); pairs.push([c, cands[0], true]); }
      else pairs.push([c, null, false]);
    }
    for (const u of us) if (!used.has(u)) pairs.push([null, u, false]);

    const slugs = new Set<string>();
    for (const [c, u, guessed] of pairs) {
      const g = { ...(c ?? u)!, drivetrain: c?.drivetrain ?? u?.drivetrain };
      const markets = [c && 'CA', u && 'US'].filter(Boolean) as ('CA' | 'US')[];
      const names: Proposal['names'] = {};
      if (c) names.CA = cleanName(c.name, c.drivetrain);
      if (u) names.US = cleanName(u.name, u.drivetrain);
      // An existing variant of this model year with the same name and drivetrain takes the new market.
      const ex = [...existing.values()].find((v) => v.model_id === g.model_id && v.year === g.year && (v.drivetrain === (g.drivetrain ?? 'unknown')) &&
        similarity(tokenize(v.trims?.[0]?.names?.CA ?? v.id.split('/')[3].replace(/-/g, ' ')), g.tokens) >= 0.6);
      let slug = ex ? ex.id.split('/')[3] : slugify(names.CA ?? names.US ?? 'standard') || 'standard';
      if (!ex && markets.length === 1 && slugs.has(slug)) slug = `${slug}-${markets[0].toLowerCase()}`;
      slugs.add(slug);
      // Powertrain: the same-named variant from another year of this model, when there is one.
      // Never across a generation boundary (B92/B95: a new generation is new hardware); nearest year first.
      const gen = generationOf(g.model_id, g.year);
      const sibling = [...existing.values()]
        .filter((v) => v.model_id === g.model_id && v.year !== g.year && v.id.split('/')[3] === slug && v.powertrain_id && gen !== undefined && generationOf(v.model_id, v.year) === gen)
        .sort((a, b) => Math.abs(a.year - g.year) - Math.abs(b.year - g.year))[0];
      const flags = new Set<string>([...(c?.flags ?? []), ...(u?.flags ?? [])]);
      if (guessed) flags.add('pair: only one candidate each side, words differ');
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
        flags: [...flags],
        rows: [...(c?.rows ?? []), ...(u?.rows ?? [])],
      });
    }
  }
  return out;
}
