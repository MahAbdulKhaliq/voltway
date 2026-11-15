import { describe, expect, it } from 'vitest';
import { t, type MessageKey } from '../src/i18n/t';

describe('t()', () => {
  it('returns the English message', () => {
    expect(t('site.name')).toBe('Voltway');
  });

  it('fills placeholders', () => {
    expect(t('nav.compareCount', { count: 3 })).toBe('Compare (3)');
  });

  it('leaves a placeholder visible when its param is missing', () => {
    expect(t('nav.compareCount')).toBe('Compare ({count})');
  });

  it('throws on a missing key', () => {
    expect(() => t('does.not.exist' as MessageKey)).toThrow(/Missing i18n key/);
  });
});
