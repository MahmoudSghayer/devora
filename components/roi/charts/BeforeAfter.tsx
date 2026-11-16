'use client';

import {useLocale, useTranslations} from 'next-intl';
import {num} from '../format';
import {Ltr} from '../ui';
import Bar from './Bar';
import ChartFrame from './ChartFrame';

export default function BeforeAfter({today, saved}: {today: number; saved: number}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  const left = Math.max(0, today - saved);
  const freedPct = today > 0 ? (saved / today) * 100 : 0;
  const leftPct = 100 - freedPct;
  const f = (n: number) => num(n, locale, 1);
  const unit = t('unit.hMonth');

  return (
    <ChartFrame
      title={t('chart.beforeAfter.title')}
      table={{
        caption: t('chart.beforeAfter.caption'),
        head: [t('chart.beforeAfter.colScenario'), t('chart.beforeAfter.colManual'), t('chart.beforeAfter.colFreed')],
        rows: [
          [t('chart.beforeAfter.today'), f(today), '0'],
          [t('chart.beforeAfter.after'), f(left), f(saved)],
        ],
      }}
      legend={
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <li className="flex items-center gap-2">
            <span aria-hidden className="size-3 rounded-chip bg-border-ghost" />
            {t('chart.beforeAfter.manual')}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="size-3 rounded-chip bg-signal" />
            {t('chart.beforeAfter.freed')}
          </li>
        </ul>
      }
    >
      <div
        role="img"
        aria-label={t('chart.beforeAfter.aria', {today: f(today), left: f(left), saved: f(saved)})}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <p className="flex items-baseline justify-between gap-3 text-sm text-ink-2">
            <span>{t('chart.beforeAfter.today')}</span>
            <Ltr className="font-semibold text-ink">{f(today)} {unit}</Ltr>
          </p>
          <Bar height={28} segments={[{from: 0, width: 100, tone: 'muted'}]} />
        </div>
        <div className="flex flex-col gap-2">
          <p className="flex items-baseline justify-between gap-3 text-sm text-ink-2">
            <span>{t('chart.beforeAfter.after')}</span>
            <Ltr className="font-semibold text-ink">{f(left)} {unit}</Ltr>
          </p>
          <Bar
            height={28}
            segments={[
              {from: 0, width: leftPct, tone: 'muted'},
              {from: leftPct, width: freedPct, tone: 'signal'},
            ]}
          />
        </div>
      </div>
    </ChartFrame>
  );
}
