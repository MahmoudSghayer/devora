'use client';

import {useRef} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {motion, useInView, useReducedMotion} from 'motion/react';
import CountUp from '@/components/motion/CountUp';
import Spotlight from '@/components/motion/Spotlight';
import TiltCard from '@/components/motion/TiltCard';
import ArrowButton from '@/components/ui/ArrowButton';
import {EASE} from '@/lib/motion';
import {computeRoi} from '@/lib/roi/engine';
import {ROI_TASKS, formatMoney, formatNumber} from '@/lib/pricing/config';

const W = 320;
const H = 120;
const PAD = 8;

// Example: the catalogue's WhatsApp row at its default volume, one person.
const EXAMPLE = (() => {
  const row = ROI_TASKS.find((t) => t.id === 'whatsappReplies');
  if (!row) throw new Error('ROI_TASKS is missing whatsappReplies');
  return row;
})();
const ROI = computeRoi({
  tasks: [
    {
      taskId: EXAMPLE.id,
      timesPerDay: EXAMPLE.defaultTimesPerDay,
      minutesEach: EXAMPLE.defaultMinutes,
      employees: 1,
      automationPct: EXAMPLE.defaultAutomationPct,
    },
  ],
});

/** Cumulative freed capacity per month (months 0..12) as an SVG path. */
const POINTS = Array.from({length: 13}, (_, m) => {
  const x = PAD + (m / 12) * (W - 2 * PAD);
  const y = H - PAD - ((ROI.capacityValueMonthly * m) / ROI.annualValue) * (H - 2 * PAD);
  return [x, y] as const;
});
const LINE = POINTS.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
const AREA = `${LINE} L${W - PAD} ${H - PAD} L${PAD} ${H - PAD} Z`;

export default function RoiCard() {
  const t = useTranslations('homeB.calc');
  const locale = useLocale();
  const reduced = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, {once: true, amount: 0.5});
  const show = reduced || inView;
  const value = formatMoney(ROI.annualValue, locale);

  return (
    <TiltCard className="h-full" max={4}>
      <Spotlight tone="signal" className="glass aura aura-signal flex h-full flex-col overflow-clip rounded-panel p-6 nav:p-8">
        <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-signal">
          <span aria-hidden>{'// '}</span>
          {t('roi_kicker')}
        </p>
        <h3 className="u-track mt-4 font-display text-h3 font-semibold leading-[1.1] tracking-[-0.02em]">
          {t('roi_title')}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{t('roi_desc')}</p>

        <div className="mt-6 rounded-card border border-border-card bg-bg/50 p-5">
          <p className="text-[13px] text-muted">
            {t('roi_example', {pct: `${formatNumber(EXAMPLE.defaultAutomationPct, locale)}%`})}
          </p>
          <p className="mt-2 font-display text-[32px] font-semibold leading-none text-signal" dir="ltr">
            <CountUp
              value={ROI.annualValue}
              locale={locale}
              options={{style: 'currency', currency: ROI.currency, maximumFractionDigits: 0}}
            />
          </p>
          <p className="mt-2 text-[13px] text-muted">{t('roi_value')}</p>
          <div dir="ltr" className="mt-4">
          <svg
            ref={ref}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={t('roi_chart_alt', {value})}
            className="block h-auto w-full"
          >
            <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--color-border-card)" strokeWidth="1" />
            <motion.path
              d={AREA}
              fill="var(--color-signal)"
              initial={{opacity: 0}}
              animate={{opacity: show ? 0.12 : 0}}
              transition={reduced ? {duration: 0} : {duration: 0.8, delay: 1, ease: EASE}}
            />
            <motion.path
              d={LINE}
              fill="none"
              stroke="var(--color-signal)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={{pathLength: reduced ? 1 : 0}}
              animate={{pathLength: show ? 1 : 0}}
              transition={reduced ? {duration: 0} : {duration: 1.6, ease: EASE}}
            />
          </svg>
          </div>
          <div className="u-mono mt-1 flex justify-between font-mono text-xs text-faint">
            <span>{t('roi_axis_start')}</span>
            <span>{t('roi_axis_end')}</span>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">{t('roi_note')}</p>

        <div className="mt-auto pt-6">
          <ArrowButton href="/automation-roi" label={t('roi_cta')} className="min-h-12 px-7 py-3 text-[15px]" />
          <p className="u-mono mt-4 font-mono text-xs text-faint">{t('free')}</p>
        </div>
      </Spotlight>
    </TiltCard>
  );
}
