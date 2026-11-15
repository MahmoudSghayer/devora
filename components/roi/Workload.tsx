'use client';

import type {Dispatch} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import Spotlight from '@/components/motion/Spotlight';
import {TaskIcon} from './icons';
import {MAX_ROWS, fieldId, newId, rowHours, type Action, type FieldErrors, type FieldError, type RowField, type TaskEntry} from './model';
import {num} from './format';
import {NumField, ghostBtn} from './ui';

function focusSoon(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

export default function Workload({
  tasks,
  errors,
  workingDays,
  dispatch,
}: {
  tasks: TaskEntry[];
  errors: FieldErrors;
  workingDays: number;
  dispatch: Dispatch<Action>;
}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  const err = (e: FieldError | undefined) => (e ? t(`err.${e.key}`, e.params) : undefined);

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-[68ch] text-base leading-relaxed text-muted">{t('workload.intro')}</p>
      {tasks.map((task) => {
        const name = t(`task.${task.taskId}`);
        const teamDay = task.rows.reduce((s, r) => s + rowHours(r), 0);
        return (
          <Spotlight key={task.taskId} tone="signal" className="glass rounded-panel">
            <section aria-labelledby={`wl-${task.taskId}`} className="rounded-panel p-5 nav:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 id={`wl-${task.taskId}`} className="flex items-center gap-3 font-display text-xl font-semibold text-ink">
                  <span className="flex size-10 items-center justify-center rounded-input border border-border-card bg-surface text-signal">
                    <TaskIcon id={task.taskId} className="size-5" />
                  </span>
                  {name}
                </h3>
                <p className="text-sm text-muted">
                  {t('workload.teamTotal', {
                    day: num(teamDay, locale, 2),
                    month: num(teamDay * (Number.isFinite(workingDays) ? workingDays : 0), locale, 1),
                  })}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-5">
                {task.rows.map((row, i) => {
                  const idFor = (f: RowField) => fieldId(task.taskId, row.id, f);
                  const n = i + 1;
                  const perGroup = rowHours(row);
                  return (
                    <fieldset key={row.id} className="min-w-0 rounded-card border border-border-card bg-surface/60 p-4 nav:p-5">
                      <legend className="px-2 text-sm font-semibold text-ink-2">{t('workload.group', {n})}</legend>
                      <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-3">
                        <NumField
                          id={idFor('times')}
                          label={t('workload.times')}
                          hint={t('workload.timesHint')}
                          value={row.times}
                          error={err(errors[idFor('times')])}
                          onChange={(value) => dispatch({type: 'setRow', taskId: task.taskId, rowId: row.id, field: 'times', value})}
                        />
                        <NumField
                          id={idFor('minutes')}
                          label={t('workload.minutes')}
                          hint={t('workload.minutesHint')}
                          value={row.minutes}
                          error={err(errors[idFor('minutes')])}
                          onChange={(value) => dispatch({type: 'setRow', taskId: task.taskId, rowId: row.id, field: 'minutes', value})}
                        />
                        <NumField
                          id={idFor('employees')}
                          label={t('workload.employees')}
                          hint={t('workload.employeesHint')}
                          value={row.employees}
                          step="1"
                          inputMode="numeric"
                          error={err(errors[idFor('employees')])}
                          onChange={(value) => dispatch({type: 'setRow', taskId: task.taskId, rowId: row.id, field: 'employees', value})}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted">
                          {t('workload.groupTotal', {hours: num(perGroup, locale, 2)})}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={ghostBtn}
                            aria-label={t('workload.dupLabel', {n, task: name})}
                            disabled={task.rows.length >= MAX_ROWS}
                            onClick={() => {
                              const rowId = newId();
                              dispatch({type: 'dupRow', taskId: task.taskId, fromId: row.id, rowId});
                              focusSoon(fieldId(task.taskId, rowId, 'times'));
                            }}
                          >
                            {t('workload.dup')}
                          </button>
                          <button
                            type="button"
                            className={ghostBtn}
                            aria-label={t('workload.removeLabel', {n, task: name})}
                            disabled={task.rows.length <= 1}
                            onClick={() => {
                              dispatch({type: 'removeRow', taskId: task.taskId, rowId: row.id});
                              focusSoon(`add-${task.taskId}`);
                            }}
                          >
                            {t('workload.remove')}
                          </button>
                        </div>
                      </div>
                    </fieldset>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <button
                  id={`add-${task.taskId}`}
                  type="button"
                  className={ghostBtn}
                  aria-label={t('workload.addLabel', {task: name})}
                  disabled={task.rows.length >= MAX_ROWS}
                  onClick={() => {
                    const rowId = newId();
                    dispatch({type: 'addRow', taskId: task.taskId, rowId});
                    focusSoon(fieldId(task.taskId, rowId, 'times'));
                  }}
                >
                  {t('workload.add')}
                </button>
                <p className="max-w-[56ch] text-xs leading-relaxed text-muted-2">{t('workload.addHint')}</p>
              </div>
              <p className="mt-4 text-xs text-muted-2">
                {t('workload.formula')}
              </p>
            </section>
          </Spotlight>
        );
      })}
    </div>
  );
}
