'use client';

import {STEP_LIST, STEP_COUNT, type StepNo} from './model';
import {useTx} from './i18n';
import {CheckIcon} from './icons';

/** Labelled progress navigation. Current step has aria-current; done steps show a check. */
export default function ProgressNav({
  step,
  canLeaveFirst,
  onGo,
}: {
  step: StepNo;
  canLeaveFirst: boolean;
  onGo: (s: StepNo) => void;
}) {
  const t = useTx();
  return (
    <nav aria-label={t('nav.label')} className="print:hidden">
      <ol className="flex items-center justify-between gap-1 nav:gap-2">
        {STEP_LIST.map((n) => {
          const current = n === step;
          const done = n < step;
          const locked = n > 1 && !canLeaveFirst;
          return (
            <li key={n} className="flex min-w-0 flex-1 items-center gap-1 nav:gap-2">
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                aria-disabled={locked || undefined}
                aria-label={`${t('step_of', {n, total: STEP_COUNT})}: ${t(`flow.s${n}.short`)}`}
                onClick={() => {
                  if (!locked) onGo(n);
                }}
                className={`flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-pill border text-sm font-semibold transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-50 nav:px-3 ${
                  current
                    ? 'border-amber bg-amber text-on-amber'
                    : done
                      ? 'border-border-amber bg-featured text-amber'
                      : 'border-border-ghost text-muted hover:border-amber'
                }`}
              >
                {done ? <CheckIcon className="size-4" /> : <span className="num">{n}</span>}
                <span className={`u-track hidden whitespace-nowrap nav:inline ${current ? 'font-semibold' : 'font-medium'}`}>
                  {t(`flow.s${n}.short`)}
                </span>
              </button>
              {n < STEP_COUNT ? <span aria-hidden className="h-px min-w-1 flex-1 bg-border-card" /> : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-muted nav:hidden">
        <span className="num font-semibold text-ink">{t('step_of', {n: step, total: STEP_COUNT})}</span>
        {' · '}
        {t(`flow.s${step}.short`)}
      </p>
    </nav>
  );
}
