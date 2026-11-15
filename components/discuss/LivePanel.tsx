'use client';

import {useLocale} from 'next-intl';
import CountUp from '@/components/motion/CountUp';
import {formatMoney} from '@/lib/pricing/config';
import type {DiscussResult} from '@/lib/discuss/types';
import {useTx, type Tx} from './i18n';

const MONEY: Intl.NumberFormatOptions = {style: 'currency', currency: 'ILS', maximumFractionDigits: 0};

export function weeksText(t: Tx, low: number, high: number): string {
  return low === high ? t('range.weeks_one', {n: low}) : t('range.weeks', {low, high});
}

/** "typical starting range" as an animated range. Digits and symbols stay LTR. */
export function RangeFigures({result, className = ''}: {result: DiscussResult; className?: string}) {
  const locale = useLocale();
  return (
    <span dir="ltr" className={`num inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <CountUp value={result.startingLow} locale={locale} options={MONEY} spring />
      <span aria-hidden>–</span>
      <CountUp value={result.startingHigh} locale={locale} options={MONEY} spring />
    </span>
  );
}

/** Honest note about the chosen budget band vs the typical starting range. */
export function FitNote({result}: {result: DiscussResult}) {
  const t = useTx();
  if (result.budgetFit === 'unknown') return null;
  return (
    <p className="rounded-card border border-border-card p-3 text-[13px] leading-relaxed text-ink-2">
      {t(`fit.${result.budgetFit}`)}
    </p>
  );
}

/** Side panel: compact running range, timeline, fit note and the standing disclaimer. */
export default function LivePanel({result, headingLevel = 2}: {result: DiscussResult; headingLevel?: 2 | 3}) {
  const t = useTx();
  const locale = useLocale();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="space-y-5">
      <div>
        <Heading className="u-mono font-mono text-xs uppercase tracking-[0.2em] text-pillar-soft">{t('range.title')}</Heading>
        <p className="mt-3 font-display text-[clamp(26px,3.2vw,34px)] font-semibold leading-tight tracking-tight text-ink">
          <RangeFigures result={result} />
        </p>
        <p className="mt-1 text-[13px] text-muted">{t('range.indicative')}</p>
      </div>
      <dl className="space-y-1.5 text-sm text-ink-2">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">{t('range.timeline')}</dt>
          <dd className="num">{weeksText(t, result.weeks.low, result.weeks.high)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted">{t('range.maintenance')}</dt>
          <dd>
            <span dir="ltr" className="num">
              {formatMoney(result.maintenanceMonthly, locale)}
            </span>{' '}
            {t('range.per_month')}
          </dd>
        </div>
      </dl>
      <FitNote result={result} />
      <p className="border-t border-hairline pt-4 text-[13px] leading-relaxed text-muted">{t('disclaimer')}</p>
    </div>
  );
}

/** Mobile: a slim bar pinned to the bottom with the running range. Hidden at `nav:`. */
export function MobileBar({result}: {result: DiscussResult}) {
  const t = useTx();
  return (
    <div
      className="glass-hi fixed inset-x-0 bottom-0 rounded-t-panel px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 nav:hidden print:hidden"
      style={{zIndex: 'var(--z-sheet)'}}
    >
      <p className="text-[12px] leading-none text-muted">{t('range.title')}</p>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 font-display text-lg font-semibold leading-none text-ink">
        <RangeFigures result={result} />
        <span className="text-[12px] font-normal text-muted">{t('range.indicative_short')}</span>
      </p>
    </div>
  );
}
