'use client';

import {AnimatePresence, LayoutGroup, motion, useReducedMotion} from 'motion/react';
import {useLocale} from 'next-intl';
import CountUp from '@/components/motion/CountUp';
import {formatMoney} from '@/lib/pricing/config';
import {LINE_GROUPS, type EstimateResult, type LineGroup} from '@/lib/estimator/types';
import {useTx} from './i18n';

const MONEY: Intl.NumberFormatOptions = {style: 'currency', currency: 'ILS', maximumFractionDigits: 0};
const TIMELINE_SCALE_MIN = 12;

export function weeksText(t: ReturnType<typeof useTx>, low: number, high: number): string {
  return low === high ? t('panel.weeks_one', {n: low}) : t('panel.weeks', {low, high});
}

/** One-time total as an animated range. Digits and symbols stay LTR. */
export function RangeFigures({est, className = ''}: {est: EstimateResult; className?: string}) {
  const locale = useLocale();
  return (
    <span dir="ltr" className={`num inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <CountUp value={est.low} locale={locale} options={MONEY} spring />
      <span aria-hidden>–</span>
      <CountUp value={est.high} locale={locale} options={MONEY} spring />
    </span>
  );
}

function Timeline({est}: {est: EstimateResult}) {
  const t = useTx();
  const scale = Math.max(TIMELINE_SCALE_MIN, est.weeksHigh + 2);
  const start = ((est.weeksLow - 1) / scale) * 100;
  const width = Math.max(4, ((est.weeksHigh - est.weeksLow + 1) / scale) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-ink-2">{t('panel.timeline')}</h3>
        <p className="num text-sm font-semibold text-ink">{weeksText(t, est.weeksLow, est.weeksHigh)}</p>
      </div>
      <div aria-hidden className="mt-3 h-2 overflow-hidden rounded-pill bg-surface-2">
        <div
          className="h-full rounded-pill bg-amber transition-[margin,width] duration-500 motion-reduce:transition-none"
          style={{marginInlineStart: `${start}%`, width: `${Math.min(width, 100 - start)}%`}}
        />
      </div>
    </div>
  );
}

function Breakdown({est}: {est: EstimateResult}) {
  const t = useTx();
  const locale = useLocale();
  const reduced = useReducedMotion();
  const groups = LINE_GROUPS.filter((g: LineGroup) => est.groups[g].items.length > 0);
  const lay = reduced ? false : 'position';
  return (
    <div>
      <h3 className="text-sm font-medium text-ink-2">{t('panel.breakdown')}</h3>
      <LayoutGroup>
        <motion.div layout={lay} className="mt-3 space-y-5">
          <AnimatePresence initial={false}>
            {groups.map((g) => (
              <motion.section
                key={g}
                layout={lay}
                initial={reduced ? false : {opacity: 0}}
                animate={{opacity: 1}}
                exit={reduced ? undefined : {opacity: 0}}
                aria-labelledby={`est-g-${g}`}
              >
                <div className="flex items-baseline justify-between gap-3 border-b border-hairline pb-1.5">
                  <h4 id={`est-g-${g}`} className="u-mono font-mono text-[11px] uppercase tracking-[0.18em] text-amber">
                    {t(`group.${g}`)}
                  </h4>
                  <span dir="ltr" className="num text-sm text-ink-2">
                    {formatMoney(est.groups[g].subtotal, locale)}
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  <AnimatePresence initial={false}>
                    {est.groups[g].items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout={lay}
                        initial={reduced ? false : {opacity: 0, y: 6}}
                        animate={{opacity: 1, y: 0}}
                        exit={reduced ? undefined : {opacity: 0}}
                        className="flex items-baseline justify-between gap-3 text-[13px] leading-snug"
                      >
                        <span className="min-w-0 text-muted">{t(`item.${item.id}`)}</span>
                        <span dir="ltr" className="num shrink-0 text-ink-2">
                          {item.amount < 0 ? '−' : ''}
                          {formatMoney(Math.abs(item.amount), locale)}
                        </span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </motion.section>
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </div>
  );
}

/**
 * The live estimate: range, timeline, breakdown, care plan (shown separately)
 * and the persistent "not a quotation" line. Pure view of `est`.
 */
export default function EstimatePanel({
  est,
  hasTypes,
  headingLevel = 2,
  className = '',
}: {
  est: EstimateResult;
  hasTypes: boolean;
  headingLevel?: 2 | 3;
  className?: string;
}) {
  const t = useTx();
  const locale = useLocale();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <Heading className="u-mono font-mono text-xs uppercase tracking-[0.2em] text-amber">{t('panel.title')}</Heading>
        {hasTypes ? (
          <>
            <p className="mt-3 text-sm text-muted">{t('panel.range_label')}</p>
            <p className="mt-1 font-display text-[clamp(26px,3.2vw,36px)] font-semibold leading-tight tracking-tight text-ink">
              <RangeFigures est={est} />
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">{t('panel.empty')}</p>
        )}
      </div>

      {hasTypes ? (
        <>
          {est.needsDiscovery ? (
            <p className="rounded-card border border-border-amber bg-featured p-3 text-[13px] leading-relaxed text-ink-2">
              {t('panel.discovery')}
            </p>
          ) : null}
          <Timeline est={est} />
          <Breakdown est={est} />
          <div className="rounded-card border border-border-card p-4">
            <h3 className="text-sm font-medium text-ink-2">{t('panel.maintenance')}</h3>
            <p className="mt-1 text-lg font-semibold text-ink">
              <span dir="ltr" className="num inline-block">
                {formatMoney(est.maintenanceMonthly, locale)}
              </span>
              <span className="ms-1.5 text-sm font-normal text-muted">{t('panel.per_month')}</span>
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              {t('panel.maintenance_note', {plan: t(`plan.${est.maintenancePlan}`)})}
            </p>
          </div>
        </>
      ) : null}

      <p className="border-t border-hairline pt-4 text-[13px] leading-relaxed text-muted">{t('disclaimer')}</p>
    </div>
  );
}
