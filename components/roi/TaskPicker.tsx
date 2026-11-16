'use client';

import {useTranslations} from 'next-intl';
import Spotlight from '@/components/motion/Spotlight';
import {ROI_TASKS} from '@/lib/pricing/config';
import type {AutomationPotential, RoiTaskId} from '@/lib/roi/types';
import {CheckIcon, TaskIcon} from './icons';
import {TASKS_FIELD_ID} from './model';
import {ErrorText} from './ui';

const DOTS: Record<AutomationPotential, number> = {high: 3, medium: 2, low: 1};

/** Potential badge: text + filled dots (never colour alone). */
export function PotentialBadge({potential}: {potential: AutomationPotential}) {
  const t = useTranslations('roi');
  return (
    <span className="inline-flex items-center gap-2 rounded-pill border border-border-chip px-3 py-1 text-xs font-medium text-ink-2">
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`size-1.5 rounded-pill ${i <= DOTS[potential] ? 'bg-signal' : 'bg-border-ghost'}`}
          />
        ))}
      </span>
      {t(`potential.${potential}`)}
    </span>
  );
}

export default function TaskPicker({
  selected,
  onToggle,
  error,
}: {
  selected: RoiTaskId[];
  onToggle: (id: RoiTaskId) => void;
  error?: string;
}) {
  const t = useTranslations('roi');
  return (
    <fieldset
      id={TASKS_FIELD_ID}
      tabIndex={-1}
      aria-describedby={error ? `${TASKS_FIELD_ID}-err` : undefined}
      className="min-w-0 outline-none"
    >
      <legend className="mb-5 text-base text-muted">{t('tasks.legend')}</legend>
      <ul className="grid grid-cols-1 gap-4 min-[620px]:grid-cols-2 nav:grid-cols-3">
        {ROI_TASKS.map((task) => {
          const checked = selected.includes(task.id);
          return (
            <li key={task.id} className="flex">
              <Spotlight tone="signal" className="glass flex w-full rounded-card">
                <label
                  className={`relative flex w-full cursor-pointer flex-col gap-3 rounded-card border p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber ${
                    checked ? 'border-signal bg-signal-lo/40' : 'border-transparent hover:border-border-ghost'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={() => onToggle(task.id)}
                  />
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-input border border-border-card bg-surface text-signal">
                      <TaskIcon id={task.id} />
                    </span>
                    <span
                      aria-hidden
                      className={`flex size-6 items-center justify-center rounded-pill border ${
                        checked ? 'border-signal bg-signal text-on-amber' : 'border-border-ghost'
                      }`}
                    >
                      {checked && <CheckIcon className="size-3.5" />}
                    </span>
                  </span>
                  <span className="font-display text-lg font-semibold leading-snug text-ink">
                    {t(`task.${task.id}`)}
                  </span>
                  <span className="text-sm leading-relaxed text-muted">{t(`why.${task.id}`)}</span>
                  <span className="mt-auto pt-1">
                    <PotentialBadge potential={task.potential} />
                  </span>
                </label>
              </Spotlight>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-sm text-muted-2" role="status">
        {t('tasks.selected', {count: selected.length})}
      </p>
      {error && (
        <div className="mt-3">
          <ErrorText id={`${TASKS_FIELD_ID}-err`}>{error}</ErrorText>
        </div>
      )}
    </fieldset>
  );
}
