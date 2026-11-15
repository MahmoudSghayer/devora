'use client';

import type {StepNo} from './model';
import type {SummarySection} from './summary';
import {useTx} from './i18n';

/** Read-only summary of choices; `onEdit` adds a per-section jump back to its step. */
export default function SummaryList({
  sections,
  onEdit,
}: {
  sections: SummarySection[];
  onEdit?: (step: StepNo) => void;
}) {
  const t = useTx();
  return (
    <dl className="grid gap-x-8 gap-y-6 nav:grid-cols-2">
      {sections.map((s) => (
        <div key={s.id} className="min-w-0 break-inside-avoid">
          <dt className="flex items-center justify-between gap-3">
            <span className="u-mono font-mono text-[11px] uppercase tracking-[0.18em] text-amber">{t(`sum.${s.id}`)}</span>
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(s.step)}
                aria-label={t('sum.edit_section', {section: t(`sum.${s.id}`)})}
                className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-amber underline underline-offset-4 print:hidden"
              >
                {t('sum.edit')}
              </button>
            ) : null}
          </dt>
          <dd>
            <ul className="space-y-1 text-[14px] leading-snug text-ink-2">
              {s.items.map((item) => (
                <li key={item} className="flex gap-2 [overflow-wrap:anywhere]">
                  <span aria-hidden className="text-faint">
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}
