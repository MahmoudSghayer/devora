'use client';

import {useLocale, useTranslations} from 'next-intl';
import type {RoiTaskRow} from '@/lib/roi/types';
import {money, num} from '../format';
import Bar from './Bar';
import ChartFrame from './ChartFrame';

export default function Contribution({rows}: {rows: readonly RoiTaskRow[]}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  const sorted = [...rows].sort((a, b) => b.savedHours - a.savedHours);
  const max = Math.max(1e-9, ...sorted.map((r) => r.savedHours));
  const sep = locale === 'ar' ? '، ' : ', ';
  const list = sorted.map((r) => `${t(`task.${r.taskId}`)} ${num(r.savedHours, locale, 1)}`).join(sep);

  return (
    <ChartFrame
      title={t('chart.contribution.title')}
      table={{
        caption: t('chart.contribution.caption'),
        head: [
          t('chart.contribution.colTask'),
          t('chart.contribution.colToday'),
          t('chart.contribution.colSaved'),
          t('chart.contribution.colValue'),
        ],
        rows: sorted.map((r) => [
          t(`task.${r.taskId}`),
          num(r.monthlyHours, locale, 1),
          num(r.savedHours, locale, 1),
          money(r.monthlyValue, locale),
        ]),
      }}
    >
      <div role="img" aria-label={t('chart.contribution.aria', {list})} className="flex flex-col gap-4">
        {sorted.map((r) => (
          <div key={r.taskId} className="flex flex-col gap-1.5">
            <p className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
              <span className="text-ink-2">{t(`task.${r.taskId}`)}</span>
              <span className="text-muted">
                {t('chart.contribution.row', {hours: num(r.savedHours, locale, 1), value: money(r.monthlyValue, locale)})}
              </span>
            </p>
            <Bar segments={[{from: 0, width: (r.savedHours / max) * 100, tone: 'signal'}]} />
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}
