'use client';

import {useEffect, useRef} from 'react';
import {STEP_LIST, STEP_COUNT, type StepNo} from './model';
import {useTx} from './i18n';
import {CheckIcon} from './icons';

/** Labelled progress navigation. Current step has aria-current; done steps show a check. */
export default function ProgressNav({
  step,
  canLeaveType,
  typeStep,
  onGo,
}: {
  step: StepNo;
  canLeaveType: boolean;
  typeStep: StepNo;
  onGo: (s: StepNo) => void;
}) {
  const t = useTx();
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-current="step"]')
      ?.scrollIntoView({inline: 'center', block: 'nearest'});
  }, [step]);

  return (
    <nav aria-label={t('nav.label')} className="print:hidden">
      <ol ref={listRef} className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {STEP_LIST.map((n) => {
          const current = n === step;
          const done = n < step;
          const locked = n > typeStep && !canLeaveType;
          return (
            <li key={n} className="flex shrink-0 items-center gap-1.5 nav:flex-1 nav:last:flex-none">
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                aria-disabled={locked || undefined}
                aria-label={`${t('step_of', {n, total: STEP_COUNT})}: ${t(`flow.s${n}.short`)}`}
                onClick={() => {
                  if (!locked) onGo(n);
                }}
                className={`flex min-h-11 min-w-11 items-center justify-center rounded-pill border text-sm font-semibold transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${
                  current
                    ? 'border-amber bg-amber text-on-amber'
                    : done
                      ? 'border-border-amber bg-featured text-amber'
                      : 'border-border-ghost text-muted hover:border-amber'
                }`}
              >
                {done ? <CheckIcon className="size-4" /> : <span className="num">{n}</span>}
              </button>
              {n < STEP_COUNT ? <span aria-hidden className="hidden h-px flex-1 bg-border-card nav:block" /> : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-muted">
        <span className="num font-semibold text-ink">{t('step_of', {n: step, total: STEP_COUNT})}</span>
        {' · '}
        {t(`flow.s${step}.short`)}
      </p>
    </nav>
  );
}
