// "Change ›" (owner 2026-11-20): the short way to say "change this" next to a value, as in the Trip
// settings card. The visible word is "Change"; `label` is the full name for screen readers and
// starts with that word ("Change plugs"), so voice control can still say what it sees.

import { t } from '../i18n/t.ts';

interface Props {
  label: string;
  onClick: () => void;
  className?: string;
}

export default function ChangeLink({ label, onClick, className = '' }: Props) {
  return (
    <button type="button" className={`link-go ${className}`.trim()} aria-label={label} onClick={onClick}>
      {t('trip.carChange')}
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </button>
  );
}
