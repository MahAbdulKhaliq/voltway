// Estimated charging curves for variants with no measured curve (charging-curve-viewer.md §9).
// Each template is SoC → fraction of the car's peak DC kW. UNCALIBRATED placeholders until
// checklist 2.2 tunes them against published 10–80 % times (target ±15 %).

import type { CurveOut } from './types.ts';

export type TemplateId = '400v-nmc' | '800v-nmc' | 'lfp';

const SOC = [0, 10, 30, 50, 70, 80, 90, 100];
export const TEMPLATES: Record<TemplateId, number[]> = {
  '400v-nmc': [0.7, 1.0, 1.0, 0.75, 0.55, 0.45, 0.25, 0.08],
  '800v-nmc': [0.75, 1.0, 1.0, 0.95, 0.7, 0.45, 0.15, 0.05],
  lfp: [0.8, 1.0, 0.9, 0.75, 0.6, 0.5, 0.3, 0.1],
};

const LABEL: Record<TemplateId, string> = {
  '400v-nmc': '400V NMC',
  '800v-nmc': '800V NMC',
  lfp: 'LFP',
};

export interface EstimateInput {
  dcMaxKw: number;
  chemistry: string | null;   // nmc / nca / lfp / lmfp / other / null (unknown)
  voltageClass: string | null; // 400v / 800v / other / null (unknown)
  sourceId: string;           // the source of the DC peak it is built from
}

/** Picks the template (§9): LFP by chemistry, else NMC for the voltage class. Unknowns are said in `basis`. */
export function chooseTemplate(chemistry: string | null, voltageClass: string | null): { id: TemplateId; caveats: string[] } {
  const caveats: string[] = [];
  if (chemistry === 'lfp' || chemistry === 'lmfp') return { id: 'lfp', caveats };
  if (!chemistry) caveats.push('chemistry unknown, NMC template used');
  if (voltageClass === '800v') return { id: '800v-nmc', caveats };
  if (!voltageClass) caveats.push('voltage class unknown, 400V template used');
  return { id: '400v-nmc', caveats };
}

export function estimateCurve(input: EstimateInput): CurveOut {
  const { id, caveats } = chooseTemplate(input.chemistry, input.voltageClass);
  const peak = input.dcMaxKw;
  return {
    id: `estimated-${id}`,
    kind: 'estimated',
    source_id: input.sourceId,
    points: SOC.map((soc, i) => ({ soc_percent: soc, power_kw: Math.round(TEMPLATES[id][i] * peak * 10) / 10 })),
    is_display_default: false,
    basis: [`Typical ${LABEL[id]} curve × this car's ${peak} kW peak`, ...caveats, 'template not yet calibrated'].join('; '),
  };
}
