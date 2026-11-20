import { describe, expect, it } from 'vitest';
import { curveChoices, curveYear } from '../src/lib/curve-choice.ts';
import type { CurveOut } from '../src/lib/types.ts';

const c = (id: string, kind: CurveOut['kind'], extra: Partial<CurveOut> = {}): CurveOut =>
  ({ id, kind, source_id: 'src-x', points: [{ soc_percent: 0, power_kw: 1 }, { soc_percent: 100, power_kw: 1 }], is_display_default: false, ...extra });

describe('curveChoices (B92)', () => {
  it('offers no dropdown for one measured curve plus the template', () => {
    expect(curveChoices([c('outofspec-2025', 'tested', { is_display_default: true }), c('estimated-400v-nmc', 'estimated')])).toEqual([]);
  });
  it('offers no dropdown when the template is the only curve', () => {
    expect(curveChoices([c('estimated-lfp', 'estimated', { is_display_default: true })])).toEqual([]);
  });
  it('lists only measured curves, default first, when there are two or more', () => {
    const list = curveChoices([c('estimated-800v-nmc', 'estimated'), c('a-2024', 'community'), c('b-2025', 'tested', { is_display_default: true })]);
    expect(list.map((x) => x.id)).toEqual(['b-2025', 'a-2024']);
  });
  it('leaves out a warned curve nobody has cleared (B95)', () => {
    const warned = c('cp-2021', 'community', { issues: [{ level: 'warning', code: 'sparse', message: '' }] });
    expect(curveChoices([c('b-2025', 'tested', { is_display_default: true }), warned])).toEqual([]);
    expect(curveChoices([c('b-2025', 'tested', { is_display_default: true }), { ...warned, reviewed_note: 'ok' }])).toHaveLength(2);
  });
  it('reads the year from the curve id', () => {
    expect(curveYear(c('insideevs-2024', 'tested'))).toBe('2024');
    expect(curveYear(c('borrowed-ev9-gt-line-2026', 'estimated'))).toBe('2026');
    expect(curveYear(c('outofspec', 'tested'))).toBeNull();
  });
});
