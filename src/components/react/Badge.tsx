// React version of SourceBadge (database-ui.md §7) for islands: kind label that opens to
// the source, date, notes, other figures and "sources differ". Uses <details>.
import { t } from '../../i18n/t.ts';
import { display, kindLabel } from '../../lib/format.ts';
import type { Field, Source } from '../../lib/types.ts';
import type { DistanceUnit } from '../../lib/units.ts';

interface Props { field: Field; sources: Source[]; label: string; unit: DistanceUnit }

export function Badge({ field, sources, label, unit }: Props) {
  if (!field) return null;
  const main = field.value;
  const src = (id: string) => sources.find((s) => s.id === id);
  const mainSource = src(main.source_id);
  const cls = ['badge', `kind-${main.kind}`, main.low_confidence ? 'low' : ''].filter(Boolean).join(' ');
  return (
    <details className={cls}>
      <summary aria-label={t('badge.open', { label })}>
        {kindLabel(main.kind)}
        {field.conflict && <span className="differ" title={t('badge.differ')} aria-label={t('badge.differ')}>⚠</span>}
      </summary>
      <div className="pop">
        <p className="pop-title">{t('badge.source')}</p>
        {mainSource ? (
          <p>
            <a href={mainSource.url} rel="noopener" target="_blank">{mainSource.title}</a>
            <br />
            <span className="muted small">{t('badge.accessed', { date: mainSource.accessed_on })}</span>
          </p>
        ) : <p className="muted">{main.source_id}</p>}
        {main.notes && <p className="small">{main.notes}</p>}
        {main.low_confidence && <p className="small"><strong>{t('badge.lowConfidence')}.</strong> {t('badge.lowConfidenceHelp')}</p>}
        {field.conflict && <p className="small"><strong>⚠ {t('badge.differ')}.</strong> {t('badge.differHelp')}</p>}
        {field.others.length > 0 && (
          <>
            <p className="pop-title">{t('badge.others')}</p>
            <ul>
              {field.others.map((o, i) => {
                const s = src(o.source_id);
                return (
                  <li key={i}>
                    {display(o, unit).text} · {kindLabel(o.kind)}
                    {s && <> · <a href={s.url} rel="noopener" target="_blank">{s.title}</a></>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}

/** A figure with its badge, or grey "Unknown". */
export function Value({ field, sources, label, unit, approx = false }: Props & { approx?: boolean }) {
  if (!field) return <span className="unknown">{t('badge.unknown')}</span>;
  return (
    <span className="fv">
      <span className="v">{approx ? '~' : ''}{display(field.value, unit).text}</span> <Badge field={field} sources={sources} label={label} unit={unit} />
    </span>
  );
}
