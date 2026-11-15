'use client';

import type {Dispatch, ReactNode} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import CountUp from '@/components/motion/CountUp';
import Spotlight from '@/components/motion/Spotlight';
import {formatMoney} from '@/lib/pricing/config';
import type {RoiResult} from '@/lib/roi/types';
import BeforeAfter from './charts/BeforeAfter';
import Contribution from './charts/Contribution';
import Cumulative from './charts/Cumulative';
import {FTE_OPTS, HOURS_OPTS, MONEY_OPTS, money, num, percent} from './format';
import HowWeCalculate from './HowWeCalculate';
import type {Action, CalcState} from './model';
import {DirectShareSlider} from './Potential';
import {Eyebrow, Ltr} from './ui';

function Card({children, className = ''}: {children: ReactNode; className?: string}) {
  return (
    <Spotlight tone="signal" className={`glass flex rounded-panel ${className}`}>
      <div className="flex w-full min-w-0 flex-col gap-3 rounded-panel p-5 nav:p-7">{children}</div>
    </Spotlight>
  );
}

function Big({children}: {children: ReactNode}) {
  return (
    <p className="num flex flex-wrap items-baseline gap-x-2 font-display text-[clamp(32px,5vw,56px)] font-semibold leading-none tracking-tight text-ink [direction:ltr] rtl:justify-end">
      {children}
    </p>
  );
}

export default function Results({
  state,
  result,
  dispatch,
}: {
  state: CalcState;
  result: RoiResult;
  dispatch: Dispatch<Action>;
}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  const r = result;
  const directPct = percent(r.assumptions.directShare, locale);
  const rich = {n: (chunks: ReactNode) => <Ltr className="font-semibold text-ink">{chunks}</Ltr>};
  const noAuto = r.automatedTasks === 0;

  const basis = (kind: 'direct' | 'capacity') => {
    const roi = kind === 'direct' ? r.roi12Direct : r.roi12Capacity;
    const pay = kind === 'direct' ? r.paybackMonthsDirect : r.paybackMonthsCapacity;
    return (
      <Card>
        <h4 className="font-display text-lg font-semibold text-ink">{t(`results.basis.${kind}`)}</h4>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted-2">{t('results.roi')}</dt>
            <dd className="num mt-1 font-display text-3xl font-semibold text-signal">
              <Ltr>{roi === null ? t('results.na') : percent(roi, locale)}</Ltr>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-2">{t('results.payback')}</dt>
            <dd className="num mt-1 font-display text-3xl font-semibold text-signal">
              {pay === null ? (
                t('results.na')
              ) : (
                <span>
                  <Ltr>{num(pay, locale, 1)}</Ltr>
                  <span className="ms-1.5 text-base font-medium text-muted">{t('unit.month')}</span>
                </span>
              )}
            </dd>
          </div>
        </dl>
        <p className="text-sm leading-relaxed text-muted">{t(kind === 'direct' ? 'results.noteDirect' : 'results.noteCapacity')}</p>
        <p className="text-sm leading-relaxed text-ink-2">
          {roi === null
            ? t('results.noPayback')
            : roi > 0
              ? t('results.plain', {back: formatMoney(1 + roi, locale, {maximumFractionDigits: 2})})
              : t('results.plainLoss')}
          {pay === null && roi !== null ? ` ${t('results.noPayback')}` : ''}
        </p>
      </Card>
    );
  };

  return (
    <div className="aura aura-signal flex flex-col gap-8 print:gap-6">
      <p className="sr-only" role="status" aria-live="polite">
        {t('results.live', {hours: num(r.savedHoursMonthly, locale, 1), value: money(r.capacityValueMonthly, locale)})}
      </p>
      <p className="max-w-[68ch] text-base leading-relaxed text-muted">{t('results.intro')}</p>
      {noAuto && (
        <p role="alert" className="rounded-card border border-amber p-4 text-sm text-amber-hi">
          {t('results.noAutomation')}
        </p>
      )}

      <section aria-label={t('results.hoursMonth')} className="grid grid-cols-1 gap-5 nav:grid-cols-3">
        {(
          [
            ['hoursDay', r.savedHoursPerDay],
            ['hoursMonth', r.savedHoursMonthly],
            ['hoursYear', r.savedHoursAnnual],
          ] as const
        ).map(([key, v]) => (
          <Card key={key}>
            <Eyebrow>{t(`results.${key}`)}</Eyebrow>
            <Big>
              <CountUp value={v} locale={locale} options={HOURS_OPTS} spring />
              <span className="text-lg font-medium text-muted">{t('unit.h')}</span>
            </Big>
          </Card>
        ))}
      </section>
      <p className="max-w-[68ch] text-base leading-relaxed text-ink-2">
        {t.rich('results.today', {
          ...rich,
          hours: num(r.monthlyHours, locale, 1),
          left: num(Math.max(0, r.monthlyHours - r.savedHoursMonthly), locale, 1),
        })}
      </p>

      <Card>
        <h3 className="font-display text-xl font-semibold text-ink">{t('results.totalTitle')}</h3>
        <div className="grid grid-cols-1 gap-5 min-[560px]:grid-cols-2">
          <div>
            <Big>
              <CountUp value={r.capacityValueMonthly} locale={locale} options={MONEY_OPTS} spring />
            </Big>
            <p className="mt-2 text-sm text-muted">{t('results.perMonth')}</p>
          </div>
          <div>
            <Big>
              <CountUp value={r.annualValue} locale={locale} options={MONEY_OPTS} spring />
            </Big>
            <p className="mt-2 text-sm text-muted">{t('results.perYear')}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted">{t('results.totalNote')}</p>
      </Card>

      <section aria-labelledby="three-title" className="flex flex-col gap-5">
        <h3 id="three-title" className="font-display text-xl font-semibold text-ink">
          {t('results.threeTitle')}
        </h3>
        <div className="grid grid-cols-1 gap-5 nav:grid-cols-3">
          <Card>
            <h4 className="font-display text-lg font-semibold text-ink">{t('results.direct.title')}</h4>
            <Big>
              <CountUp value={r.directReductionMonthly} locale={locale} options={MONEY_OPTS} spring />
              <span className="text-sm font-medium text-muted">{t('results.perMonth')}</span>
            </Big>
            <p className="num text-sm text-ink-2">
              <Ltr>{money(r.annualDirect, locale)}</Ltr> {t('results.perYear')}
            </p>
            <p className="text-sm leading-relaxed text-muted">{t('results.direct.desc', {pct: directPct})}</p>
          </Card>
          <Card>
            <h4 className="font-display text-lg font-semibold text-ink">{t('results.productivity.title')}</h4>
            <Big>
              <CountUp value={r.productivityValueMonthly} locale={locale} options={MONEY_OPTS} spring />
              <span className="text-sm font-medium text-muted">{t('results.perMonth')}</span>
            </Big>
            <p className="num text-sm text-ink-2">
              <Ltr>{money(r.productivityValueMonthly * 12, locale)}</Ltr> {t('results.perYear')}
            </p>
            <p className="text-sm leading-relaxed text-muted">{t('results.productivity.desc')}</p>
          </Card>
          <Card>
            <h4 className="font-display text-lg font-semibold text-ink">{t('results.growth.title')}</h4>
            <Big>
              <CountUp value={r.fteEquivalent} locale={locale} options={FTE_OPTS} spring />
              <span className="text-sm font-medium text-muted">FTE</span>
            </Big>
            <p className="text-sm text-ink-2">
              {t('results.growth.fte', {fte: num(r.fteEquivalent, locale, 2)})} ·{' '}
              {t('results.growth.hoursLine', {hours: num(r.savedHoursMonthly, locale, 1)})}
            </p>
            <p className="text-sm leading-relaxed text-muted">
              {t('results.growth.desc', {hours: num(r.assumptions.hoursPerMonthFte, locale, 0)})}
            </p>
          </Card>
        </div>
      </section>

      <section aria-labelledby="roi-title" className="flex flex-col gap-5">
        <h3 id="roi-title" className="font-display text-xl font-semibold text-ink">
          {t('results.roiTitle')}
        </h3>
        <div className="grid grid-cols-1 gap-5 nav:grid-cols-2">
          {basis('direct')}
          {basis('capacity')}
        </div>
      </section>

      <Card>
        <h3 className="font-display text-xl font-semibold text-ink">{t('results.costTitle')}</h3>
        <dl className="grid grid-cols-1 gap-5 min-[560px]:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">{t('results.implementation')}</dt>
            <dd className="num mt-1 font-display text-3xl font-semibold text-ink">
              <Ltr>{money(r.implementationCost, locale)}</Ltr>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t('results.running')}</dt>
            <dd className="num mt-1 font-display text-3xl font-semibold text-ink">
              <Ltr>{money(r.runningMonthly, locale)}</Ltr>
              <span className="ms-2 text-sm font-medium text-muted">{t('results.perMonth')}</span>
            </dd>
          </div>
        </dl>
        <p className="text-sm leading-relaxed text-muted">{t('results.costNote', {count: r.automatedTasks})}</p>
      </Card>

      {!noAuto && (
        <div className="grid grid-cols-1 gap-5">
          <BeforeAfter today={r.monthlyHours} saved={r.savedHoursMonthly} />
          <Contribution rows={r.rows} />
          <Cumulative result={r} />
        </div>
      )}

      <Card>
        <h3 className="font-display text-xl font-semibold text-ink">{t('results.assumptionTitle')}</h3>
        <DirectShareSlider id="direct-share-results" pct={state.directPct} dispatch={dispatch} />
      </Card>

      <HowWeCalculate state={state} result={r} />
    </div>
  );
}
