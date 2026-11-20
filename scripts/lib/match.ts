// Suggests matches between NRCan rows and other sources (vehicle-data-model.md §6):
// make + year first, then model-name similarity, then drivetrain and power as tie-breakers.
// Suggestions only: a person confirms every crosswalk row.

export type Drivetrain = 'fwd' | 'rwd' | 'awd';

export interface ParsedName {
  base: string;          // model text with wheel / charger / pack hints removed
  tokens: string[];      // normalized tokens of `base`
  drivetrain?: Drivetrain;
  wheel_in?: number;     // e.g. (20" Wheels)
  charger_kw?: number;   // e.g. (11.5 kW Charger)
  pack_kwh?: number;     // e.g. (131 kWh)
  code?: string;         // NRCan's trailing letter code, e.g. "Model 3 Premium-I" → "I" (B90: not a trim name)
  date_note?: string;    // e.g. "(pre-6/11/25)": a mid-year change, not a trim name
}

const MAKE_ALIASES: Record<string, string> = {
  'mercedes-benz': 'mercedes',
  'mercedes benz': 'mercedes',
  'mini': 'mini',
  'smart eq': 'smart',
  'bugatti rimac': 'rimac', // Rimac Nevera is sold as a Rimac
  'coda automotive': 'coda',
  'volkswagen': 'volkswagen',
  'vw': 'volkswagen',
  'chevy': 'chevrolet',
};

export function normalizeMake(make: string): string {
  const m = make.trim().toLowerCase();
  return MAKE_ALIASES[m] ?? m;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.+]+/g, ' ')
    .split(' ')
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter(Boolean);
}

/** Drivetrain words as different sources write them. */
export function drivetrainFrom(text: string): Drivetrain | undefined {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
  if (/ (awd|4wd|4x4|all wheel drive|dual motor|tri motor|quad motor|twin|e 4orce|xdrive\d*|quattro|4matic|dual) /.test(t)) return 'awd';
  if (/ (rwd|rear wheel drive|edrive\d*|single motor) /.test(t)) return 'rwd';
  if (/ (fwd|front wheel drive) /.test(t)) return 'fwd';
  return undefined;
}

export function parseName(model: string): ParsedName {
  let base = model;
  const grab = (re: RegExp): number | undefined => {
    const m = base.match(re);
    if (!m) return undefined;
    base = base.replace(m[0], ' ');
    return Number(m[1]);
  };
  const wheel_in = grab(/\((\d{2})(?:"|''|″|-inch| inch|inch|-in| in|in)\s*(?:Wheels?)?\)/i);
  const charger_kw = grab(/\((\d+(?:\.\d+)?)\s*kW(?:\s*Charger)?\)/i);
  const pack_kwh = grab(/\((\d+(?:\.\d+)?)\s*kWh\)/i);
  const dateNote = base.match(/\(((?:pre|post)-[^)]*)\)/i);
  if (dateNote) base = base.replace(dateNote[0], ' ');
  base = base.replace(/\s+/g, ' ').trim();
  const code = base.match(/-([A-Z])$/);
  if (code) base = base.slice(0, -2).trim();
  return {
    base,
    tokens: tokenize(base),
    drivetrain: drivetrainFrom(model),
    ...(wheel_in ? { wheel_in } : {}),
    ...(charger_kw ? { charger_kw } : {}),
    ...(pack_kwh ? { pack_kwh } : {}),
    ...(code ? { code: code[1] } : {}),
    ...(dateNote ? { date_note: dateNote[1] } : {}),
  };
}

/** Dice coefficient on token sets: 1 = same words, 0 = nothing shared. */
export function similarity(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  return (2 * shared) / (A.size + B.size);
}

export interface Candidate {
  source: 'openev' | 'chargeprice';
  source_key: string;
  year: number;
  make: string;
  label: string;          // model + trim/variant text as the source writes it
  drivetrain?: Drivetrain;
  motor_kw?: number;
  usable_kwh?: number;
  has_curve?: boolean;
}

export interface NrcanTarget {
  source_key: string;
  year: number;
  make: string;
  model: string;
  motor_kw: number;
}

export interface Suggestion {
  candidate: Candidate;
  score: number;          // 0–1
  reasons: string[];
}

/**
 * Score one candidate against an NRCan row. Make must match; a candidate from a later
 * model year is never suggested (it can't describe an earlier car). Earlier years are
 * allowed (carry-over) but cost points, and the year gap is always listed as a reason.
 */
export function scoreCandidate(target: NrcanTarget, c: Candidate, modelTokens?: string[]): Suggestion | undefined {
  if (normalizeMake(c.make) !== normalizeMake(target.make)) return undefined;
  if (c.year > target.year) return undefined;

  const t = parseName(target.model);
  const cTokens = tokenize(c.label);
  // Every word of the model name (e.g. "model" + "y", or "ioniq" + "5") must appear,
  // or it's a different model. Without a model name, require the first word.
  const required = modelTokens?.length ? modelTokens : t.tokens.slice(0, 1);
  if (!required.every((w) => cTokens.includes(w))) return undefined;

  const reasons: string[] = [];
  let score = similarity(t.tokens, cTokens) * 0.6;
  reasons.push(`name ${Math.round(similarity(t.tokens, cTokens) * 100)}% similar`);
  // Every NRCan word present (e.g. the "N" in "IONIQ 5 N") beats a shorter, generic name.
  if (t.tokens.length > required.length && t.tokens.every((w) => cTokens.includes(w))) {
    score += 0.15;
    reasons.push('all NRCan name words present');
  }

  const powerDiff = c.motor_kw && target.motor_kw ? Math.abs(c.motor_kw - target.motor_kw) / target.motor_kw : undefined;
  const powerClose = powerDiff !== undefined && powerDiff <= 0.05;

  const cDrive = c.drivetrain ?? drivetrainFrom(c.label);
  const tDrive = t.drivetrain ?? 'unstated';
  if (cDrive && t.drivetrain) {
    if (cDrive === t.drivetrain) { score += 0.2; reasons.push(`drivetrain ${cDrive} matches`); }
    else { score -= 0.3; reasons.push(`drivetrain differs (${tDrive} vs ${cDrive})`); }
  } else if (cDrive && !t.drivetrain) {
    // NRCan usually omits "RWD"/"FWD" for base cars and names AWD explicitly, but not
    // always (e.g. Tesla "Performance"). Matching motor power outweighs the missing word.
    if (cDrive === 'awd' && !powerClose) { score -= 0.2; reasons.push('candidate is AWD, NRCan row is not marked AWD'); }
    else if (cDrive === 'awd') reasons.push('candidate is AWD; NRCan row not marked, but power matches');
    else { score += 0.1; reasons.push(`candidate ${cDrive}, NRCan row not marked AWD`); }
  }

  if (t.pack_kwh && c.usable_kwh && Math.abs(c.usable_kwh - t.pack_kwh) / t.pack_kwh > 0.05) {
    score -= 0.1;
    reasons.push(`pack differs (${c.usable_kwh} vs ${t.pack_kwh} kWh)`);
  }
  if (powerDiff !== undefined) {
    if (powerClose) { score += 0.2; reasons.push(`motor power ${c.motor_kw} kW ≈ ${target.motor_kw} kW`); }
    else if (powerDiff > 0.2) { score -= 0.1; reasons.push(`motor power differs (${c.motor_kw} vs ${target.motor_kw} kW)`); }
  }

  const gap = target.year - c.year;
  if (gap > 0) { score -= Math.min(0.05 * gap, 0.3); reasons.push(`${gap} model year${gap > 1 ? 's' : ''} older`); }
  else reasons.push('same model year');

  return { candidate: c, score: Math.max(0, Math.min(1, Math.round(score * 100) / 100)), reasons };
}

export function suggest(target: NrcanTarget, candidates: Candidate[], limit = 3, modelTokens?: string[]): Suggestion[] {
  return candidates
    .map((c) => scoreCandidate(target, c, modelTokens))
    .filter((s): s is Suggestion => s !== undefined && s.score > 0.2)
    .sort((a, b) => b.score - a.score || b.candidate.year - a.candidate.year)
    .slice(0, limit);
}

/**
 * Proposed variant grouping for NRCan rows (vehicle-data-model.md §2): rows that differ
 * only by wheel size or onboard charger share a variant; anything else (motor power,
 * drivetrain, pack size, name) splits. A person confirms the grouping.
 */
export function variantGroupKey(row: NrcanTarget): string {
  const p = parseName(row.model);
  return [normalizeMake(row.make), row.year, p.tokens.join(' '), p.drivetrain ?? '-', row.motor_kw, p.pack_kwh ?? '-'].join('|');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\+/g, '-plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
