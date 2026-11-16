// Estimated charging curves for variants with no measured curve (charging-curve-viewer.md §9).
// Each template is SoC → fraction of the car's peak DC kW. Calibrated 2026-11-16 (checklist 2.2,
// owner decision B41) against measured curves and published 10–80 % times: docs/plan/calibration-report.md.

import type { CurveOut } from './types.ts';
import { t, type MessageKey } from '../i18n/t.ts';

export type TemplateId = '400v-nmc' | '800v-nmc' | 'lfp';

export const TEMPLATE_SOC = [0, 10, 30, 50, 70, 80, 90, 100];
export const TEMPLATES: Record<TemplateId, number[]> = {
  '400v-nmc': [0.7, 1.0, 0.97, 0.71, 0.51, 0.43, 0.25, 0.08],
  '800v-nmc': [0.75, 1.0, 0.96, 0.9, 0.64, 0.42, 0.15, 0.05],
  lfp: [0.8, 1.0, 0.81, 0.63, 0.47, 0.42, 0.3, 0.1],
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
  if (!chemistry) caveats.push(t('curve.template.chemistryUnknown'));
  if (voltageClass === '800v') return { id: '800v-nmc', caveats };
  if (!voltageClass) caveats.push(t('curve.template.voltageUnknown'));
  return { id: '400v-nmc', caveats };
}

export function estimateCurve(input: EstimateInput): CurveOut {
  const { id, caveats } = chooseTemplate(input.chemistry, input.voltageClass);
  const peak = input.dcMaxKw;
  return {
    id: `estimated-${id}`,
    kind: 'estimated',
    source_id: input.sourceId,
    points: TEMPLATE_SOC.map((soc, i) => ({ soc_percent: soc, power_kw: Math.round(TEMPLATES[id][i] * peak * 10) / 10 })),
    is_display_default: false,
    basis: [t('curve.template.basis', { template: t(`curve.template.${id}` as MessageKey), peak }), ...caveats].join('; '),
  };
}
