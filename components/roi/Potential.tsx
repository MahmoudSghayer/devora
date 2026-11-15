'use client';

import type {Dispatch} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import Spotlight from '@/components/motion/Spotlight';
import {ROI_CONFIG, ROI_TASKS} from '@/lib/pricing/config';
import {TaskIcon} from './icons';
import type {Action, TaskEntry} from './model';
import {percent} from './format';
import {PotentialBadge} from './TaskPicker';
import {STANDARDISATION_LEVELS, defaultAutomationPct, type StandardisationLevel} from '@/lib/roi/buckets';
import {OptionGroup, RangeField, ghostBtn} from './ui';

/** The "directShare" assumption slider — used on step 4 and on the results page. */
export function DirectShareSlider({
  id,
  pct,
  dispatch,
}: {
  id: string;
  pct: number;
  dispatch: Dispatch<Action>;
}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-3">
      <p className="inline-flex w-fit items-center gap-2 rounded-pill border border-signal px-3 py-1 text-xs font-semibold uppercase tracking-wide text-signal u-mono">
        {t('direct.badge')}
      </p>
      <RangeField
        id={id}
        label={t('direct.label')}
        value={pct}
        display={percent(pct / 100, locale)}
        valueText={t('direct.valueText', {pct})}
        describedBy={`${id}-desc`}
        onChange={(v) => dispatch({type: 'setDirect', pct: v})}
      />
      <p id={`${id}-desc`} className="max-w-[68ch] text-sm leading-relaxed text-muted">
        {t('direct.desc', {pct: percent(ROI_CONFIG.defaultDirectShare, locale)})}
      </p>
    </div>
  );
}

export default function Potential({
  tasks,
  directPct,
  level,
  dispatch,
}: {
  level: StandardisationLevel;
  tasks: TaskEntry[];
  directPct: number;
  dispatch: Dispatch<Action>;
}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-6">
      <Spotlight tone="signal" className="glass rounded-panel">
        <div className="rounded-panel p-5 nav:p-8">
          <OptionGroup
            name="level"
            legend={t('level.title')}
            hint={t('level.desc')}
            options={STANDARDISATION_LEVELS.map((l) => ({value: l.id, label: t(l.i18nKey.replace(/^roi\./, ''))}))}
            value={level}
            onSelect={(value) => dispatch({type: 'setLevel', level: value as StandardisationLevel})}
          />
        </div>
      </Spotlight>
      <p className="max-w-[68ch] text-base leading-relaxed text-muted">{t('potential.intro')}</p>
      <ul className="grid grid-cols-1 gap-5 nav:grid-cols-2">
        {tasks.map((task) => {
          const def = ROI_TASKS.find((d) => d.id === task.taskId);
          const name = t(`task.${task.taskId}`);
          const typical = defaultAutomationPct(task.taskId, level);
          const changed = typical !== task.pct;
          return (
            <li key={task.taskId} className="flex">
              <Spotlight tone="signal" className="glass flex w-full rounded-panel">
                <div className="flex w-full flex-col gap-4 rounded-panel p-5 nav:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="flex items-center gap-3 font-display text-lg font-semibold text-ink">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-input border border-border-card bg-surface text-signal">
                        <TaskIcon id={task.taskId} className="size-5" />
                      </span>
                      {name}
                    </h3>
                    {def && <PotentialBadge potential={def.potential} />}
                  </div>
                  <p id={`why-${task.taskId}`} className="text-sm leading-relaxed text-muted">
                    {t(`why.${task.taskId}`)}
                  </p>
                  <RangeField
                    id={`pct-${task.taskId}`}
                    label={t('potential.sliderLabel', {task: name})}
                    value={task.pct}
                    display={percent(task.pct / 100, locale)}
                    valueText={t('potential.valueText', {pct: task.pct, task: name})}
                    describedBy={`why-${task.taskId}`}
                    onChange={(v) => dispatch({type: 'setPct', taskId: task.taskId, pct: v})}
                  />
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-xs text-muted-2">
                    <span>{t('potential.typical', {pct: percent(typical / 100, locale)})}</span>
                    {changed && (
                      <button
                        type="button"
                        className={ghostBtn}
                        aria-label={t('potential.resetLabel', {task: name})}
                        onClick={() => dispatch({type: 'resetPct', taskId: task.taskId})}
                      >
                        {t('potential.reset')}
                      </button>
                    )}
                  </div>
                </div>
              </Spotlight>
            </li>
          );
        })}
      </ul>

      <Spotlight tone="signal" className="glass rounded-panel">
        <section aria-labelledby="direct-title" className="flex flex-col gap-4 rounded-panel p-5 nav:p-8">
          <h3 id="direct-title" className="font-display text-xl font-semibold text-ink">
            {t('direct.title')}
          </h3>
          <DirectShareSlider id="direct-share" pct={directPct} dispatch={dispatch} />
        </section>
      </Spotlight>
    </div>
  );
}
