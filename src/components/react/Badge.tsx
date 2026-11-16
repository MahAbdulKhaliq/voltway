// React version of SourceBadge (database-ui.md §7) for islands: kind label that opens to
// the source, date, notes, other figures and "sources differ". Uses <details>.
import { t } from '../../i18n/t.ts';
import { display, kindLabel } from '../../lib/format.ts';
import type { Field, Source } from '../../lib/types.ts';
import type { DistanceUnit } from '../../lib/units.ts';

interface Props { field: Field; sources: Source[]; label: string; unit: DistanceUnit }

/** Wikipedia-style reference numbers (B18): a source's number is its place in the page's source list. */
export const sourceNumber = (sources: { id: string }[], id: string) => sources.findIndex((s) => s.id === id) + 1;

/** Opens the Sources section, scrolls to source n and highlights it. */
export function openSource(n: number) {
  const box = document.getElementById('sources-acc') as HTMLDetailsElement | null;
  if (box) box.open = true;
  const item = document.getElementById(`source-${n}`);
  if (!item) return;
  item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  item.classList.remove('flash');
  void item.offsetWidth; // restart the highlight animation
  item.classList.add('flash');
  item.querySelector('a')?.focus({ preventScroll: true });
}

/** "[n]" link to source n in the Sources section. */
export function SourceRef({ n }: { n: number }) {
  if (n < 1) return null;
  return (
    <a className="ref" href={`#source-${n}`} aria-label={t('badge.ref', { n })} onClick={(e) => { e.preventDefault(); openSource(n); }}>
      [{n}]
    </a>
  );
}

export function Badge({ field, sources, label, unit }: Props) {
  if (!field) return null;
  const main = field.value;
  const src = (id: string) => sources.find((s) => s.id === id);
  const mainSource = src(main.source_id);
  const n = sourceNumber(sources, main.source_id);
  const cls = ['badge', `kind-${main.kind}`, main.low_confidence ? 'low' : ''].filter(Boolean).join(' ');
  return (
    <span className="cite">
    <details className={cls}>
      <summary aria-label={t('badge.open', { label })}>
        {kindLabel(main.kind)}
        {field.conflict && <span className="differ" title={t('badge.differ')} aria-label={t('badge.differ')}>⚠</span>}
      </summary>
      <div className="pop">
        <p className="pop-title">{t('badge.source')}</p>
        {mainSource ? (
          <p>
            {n > 0 && <>[{n}] </>}<a href={mainSource.url} rel="noopener" target="_blank">{mainSource.title}</a>
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
                    {s && <> · <SourceRef n={sourceNumber(sources, s.id)} /> <a href={s.url} rel="noopener" target="_blank">{s.title}</a></>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </details>
    <SourceRef n={n} />
    </span>
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
