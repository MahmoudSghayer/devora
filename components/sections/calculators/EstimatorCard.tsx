'use client';

import {useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import CountUp from '@/components/motion/CountUp';
import Spotlight from '@/components/motion/Spotlight';
import TiltCard from '@/components/motion/TiltCard';
import ArrowButton from '@/components/ui/ArrowButton';
import {estimateProject} from '@/lib/estimator/engine';
import type {ProjectType} from '@/lib/estimator/types';
import {formatNumber} from '@/lib/pricing/config';

const TYPES = [
  {id: 'landing', key: 'type_landing'},
  {id: 'business', key: 'type_business'},
  {id: 'ecommerce', key: 'type_ecommerce'},
  {id: 'webapp', key: 'type_webapp'},
] as const satisfies readonly {id: ProjectType; key: string}[];

export default function EstimatorCard() {
  const t = useTranslations('homeB.calc');
  const locale = useLocale();
  const [type, setType] = useState<ProjectType>('business');
  const est = useMemo(() => estimateProject({types: [type]}), [type]);
  const money = {style: 'currency', currency: est.currency, maximumFractionDigits: 0} as const;

  return (
    <TiltCard className="h-full" max={4}>
      <Spotlight className="glass aura flex h-full flex-col rounded-panel p-6 nav:p-8">
        <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
          <span aria-hidden>{'// '}</span>
          {t('web_kicker')}
        </p>
        <h3 className="u-track mt-4 font-display text-h3 font-semibold leading-[1.1] tracking-[-0.02em]">
          {t('web_title')}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{t('web_desc')}</p>

        <fieldset className="mt-6">
          <legend className="text-[13px] text-ink-2">{t('chooser_label')}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {TYPES.map((o) => (
              <label key={o.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="estimator-type"
                  value={o.id}
                  checked={type === o.id}
                  onChange={() => setType(o.id)}
                  className="peer absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <span className="flex min-h-11 items-center rounded-pill border border-border-chip px-4 text-[14px] text-ink-2 transition-colors peer-checked:border-amber peer-checked:bg-amber/10 peer-checked:text-amber peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber hover:border-border-ghost">
                  {t(o.key)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 rounded-card border border-border-card bg-bg/50 p-5" aria-live="polite">
          <p className="text-[13px] text-muted">{t('range_label')}</p>
          <p className="mt-2 font-display text-[32px] font-semibold leading-none text-ink" dir="ltr">
            <CountUp value={est.low} locale={locale} options={money} spring />
            <span className="mx-2 text-muted">–</span>
            <CountUp value={est.high} locale={locale} options={money} spring />
          </p>
          <p className="mt-3 text-[13px] text-muted">
            {t('timeline', {low: formatNumber(est.weeksLow, locale), high: formatNumber(est.weeksHigh, locale)})}
          </p>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">{t('web_note')}</p>

        <div className="mt-auto pt-6">
          <ArrowButton href="/estimate" label={t('web_cta')} className="min-h-12 px-7 py-3 text-[15px]" />
          <p className="u-mono mt-4 font-mono text-xs text-faint">{t('free')}</p>
        </div>
      </Spotlight>
    </TiltCard>
  );
}
