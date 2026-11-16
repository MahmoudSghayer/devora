'use client';

import type {ReactNode} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import Spotlight from '@/components/motion/Spotlight';
import {ROI_CONFIG} from '@/lib/pricing/config';
import {STANDARDISATION_LEVELS} from '@/lib/roi/buckets';
import {money, num, percent} from './format';
import {rowHours, toNum, type CalcState} from './model';
import {ghostBtn} from './ui';

function Section({
  id,
  title,
  step,
  onEdit,
  children,
}: {
  id: string;
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: ReactNode;
}) {
  const t = useTranslations('roi');
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 border-b border-border-sub py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <h3 id={id} className="font-display text-lg font-semibold text-ink">
          {title}
        </h3>
        <button
          type="button"
          className={ghostBtn}
          aria-label={t('summary.editLabel', {section: title})}
          onClick={() => onEdit(step)}
        >
          {t('summary.edit')}
        </button>
      </div>
      {children}
    </section>
  );
}

/** Read-only recap of every choice, with an Edit button per section. */
export default function Summary({state, onEdit}: {state: CalcState; onEdit: (step: number) => void}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  const n = (v: number, d = 1) => num(v, locale, d);
  const lvl = STANDARDISATION_LEVELS.find((l) => l.id === state.level);
  const hours = ROI_CONFIG.hoursPerMonthFte;
  const hourlyDerived = (toNum(state.salary) * toNum(state.multiplier)) / hours;

  return (
    <Spotlight tone="signal" className="glass rounded-panel">
      <div className="rounded-panel p-5 nav:p-8">
        <h3 className="font-display text-xl font-semibold text-ink">{t('summary.title')}</h3>
        <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-muted">{t('summary.intro')}</p>
        <div className="mt-5 flex flex-col">
          <Section id="sum-tasks" title={t('summary.tasks')} step={1} onEdit={onEdit}>
            <ul className="flex flex-wrap gap-2">
              {state.tasks.map((x) => (
                <li key={x.taskId} className="rounded-pill border border-border-chip px-3 py-1 text-sm text-ink-2">
                  {t(`task.${x.taskId}`)}
                </li>
              ))}
            </ul>
          </Section>
          <Section id="sum-workload" title={t('summary.workload')} step={2} onEdit={onEdit}>
            <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
              {state.tasks.flatMap((x) =>
                x.rows.map((r) => (
                  <li key={`${x.taskId}-${r.id}`}>
                    {t('summary.workLine', {
                      task: t(`task.${x.taskId}`),
                      times: n(toNum(r.times), 2),
                      minutes: n(toNum(r.minutes), 2),
                      people: n(toNum(r.employees), 0),
                      hours: n(rowHours(r), 2),
                    })}
                  </li>
                )),
              )}
            </ul>
          </Section>
          <Section id="sum-labor" title={t('summary.labor')} step={3} onEdit={onEdit}>
            <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
              <li>
                {state.laborMode === 'hourly'
                  ? t('summary.laborHourly', {hourly: money(toNum(state.hourly), locale)})
                  : state.laborMode === 'salary'
                    ? t('summary.laborSalary', {
                        gross: money(toNum(state.salary), locale),
                        mult: n(toNum(state.multiplier), 2),
                        hours: n(hours, 0),
                        hourly: money(hourlyDerived, locale),
                      })
                    : t('summary.laborUnknown', {hourly: money(ROI_CONFIG.defaultHourlyCost, locale)})}
              </li>
              <li>{t('summary.days', {days: n(toNum(state.workingDays), 0)})}</li>
            </ul>
          </Section>
          <Section id="sum-potential" title={t('summary.automation')} step={4} onEdit={onEdit}>
            <ul className="flex flex-col gap-1.5 text-sm text-ink-2">
              {lvl && <li>{t('summary.level', {level: t(lvl.i18nKey.replace(/^roi\./, ''))})}</li>}
              {state.tasks.map((x) => (
                <li key={x.taskId}>{t('summary.pctLine', {task: t(`task.${x.taskId}`), pct: percent(x.pct / 100, locale)})}</li>
              ))}
              <li>{t('summary.direct', {pct: percent(state.directPct / 100, locale)})}</li>
            </ul>
          </Section>
        </div>
      </div>
    </Spotlight>
  );
}
