'use client';

import {useId, type ReactNode} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import CountUp from '@/components/motion/CountUp';
import ArrowButton from '@/components/ui/ArrowButton';
import {formatMoney, formatNumber} from '@/lib/pricing/config';
import {WORKDAY_HOURS, useSimulator} from './useSimulator';

function Slider({
  label,
  value,
  shown,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  shown: string;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[14px] leading-snug text-ink-2">
          {label}
        </label>
        <output htmlFor={id} className="num shrink-0 font-display text-lg font-semibold text-signal" dir="ltr">
          {shown}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block h-11 w-full cursor-pointer accent-signal"
      />
    </div>
  );
}

function Bar({title, children}: {title: string; children: ReactNode}) {
  return (
    <div>
      <p className="u-mono font-mono text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
      <div className="mt-3 flex h-12 w-full overflow-hidden rounded-card border border-border-card bg-surface-2" aria-hidden>
        {children}
      </div>
    </div>
  );
}

const seg = 'h-full transition-[width] duration-500 ease-out motion-reduce:transition-none';

export default function SimulatorPanel() {
  const t = useTranslations('homeB.sim');
  const locale = useLocale();
  const s = useSimulator();
  const {result: r} = s;

  const n = (v: number, d = 0) => formatNumber(v, locale, d);
  const money = (v: number) => formatMoney(v, locale);
  const pct = (v: number) => `${n(v)}%`;

  const chat = Math.min(s.hours, WORKDAY_HOURS);
  const reclaimed = (chat * s.automationPct) / 100;
  const left = chat - reclaimed;
  const w = (v: number) => `${(v / WORKDAY_HOURS) * 100}%`;
  const currency = {style: 'currency', currency: r.currency, maximumFractionDigits: 0} as const;
  const whole = {maximumFractionDigits: 0} as const;

  return (
    <div className="aura aura-signal grid gap-6 nav:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] nav:gap-8">
      <div className="glass rounded-panel p-6 nav:p-8">
        <h3 className="u-mono font-mono text-xs uppercase tracking-[0.2em] text-faint">{t('controls_label')}</h3>
        <div className="mt-4 space-y-3">
          <Slider label={t('hours')} value={s.hours} shown={n(s.hours, 1)} min={0.5} max={WORKDAY_HOURS} step={0.5} onChange={s.setHours} />
          <Slider label={t('people')} value={s.people} shown={n(s.people)} min={1} max={20} step={1} onChange={s.setPeople} />
          <Slider label={t('cost')} value={s.hourlyCost} shown={money(s.hourlyCost)} min={30} max={200} step={5} onChange={s.setHourlyCost} />
          <Slider label={t('auto')} value={s.automationPct} shown={pct(s.automationPct)} min={10} max={90} step={5} onChange={s.setAutomationPct} />
        </div>
        <div className="mt-6 border-t border-border pt-5">
          <h4 className="u-mono font-mono text-xs uppercase tracking-[0.2em] text-faint">{t('assumptions_title')}</h4>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            {t('assumptions', {
              days: n(r.assumptions.workingDays),
              pct: pct(s.automationPct),
              cost: money(r.assumptions.hourlyCost),
            })}
          </p>
        </div>
      </div>

      <div className="glass rounded-panel p-6 nav:p-8">
        <p className="text-[13px] text-muted">{t('workday', {hours: n(WORKDAY_HOURS)})}</p>
        <div className="mt-4 space-y-6">
          <Bar title={t('before_title')}>
            <div className={`${seg} bg-signal/40`} style={{width: w(chat)}} />
          </Bar>
          <Bar title={t('after_title')}>
            <div className={`${seg} bg-signal/40`} style={{width: w(left)}} />
            <div
              className={`${seg} bg-signal`}
              style={{
                width: w(reclaimed),
                backgroundImage:
                  'repeating-linear-gradient(135deg, transparent 0 6px, rgb(0 0 0 / 0.22) 6px 8px)',
              }}
            />
          </Bar>
        </div>

        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-2">
          <li className="flex items-center gap-2">
            <span aria-hidden className="size-3 rounded-sm bg-signal/40" />
            {t('legend_chat')} / {t('legend_left')}
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-3 rounded-sm bg-signal"
              style={{backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 3px, rgb(0 0 0 / 0.25) 3px 4px)'}}
            />
            {t('legend_reclaimed')}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="size-3 rounded-sm border border-border-card bg-surface-2" />
            {t('legend_other')}
          </li>
        </ul>
        <p className="sr-only">
          {t('bars_alt', {
            workday: n(WORKDAY_HOURS),
            chat: n(chat, 1),
            left: n(left, 1),
            saved: n(reclaimed, 1),
          })}
        </p>

        <dl className="mt-8 grid gap-4 nav:grid-cols-3">
          <div className="rounded-card border border-border-card bg-bg/50 p-4">
            <dt className="text-[13px] text-muted">{t('res_hours')}</dt>
            <dd className="mt-2 font-display text-[32px] font-semibold leading-none text-signal" dir="ltr">
              <CountUp value={r.savedHoursMonthly} locale={locale} options={whole} spring />
              <span className="ms-2 text-sm font-medium text-muted">{t('hours_unit')}</span>
            </dd>
          </div>
          <div className="rounded-card border border-border-card bg-bg/50 p-4">
            <dt className="text-[13px] text-muted">{t('res_month')}</dt>
            <dd className="mt-2 font-display text-[32px] font-semibold leading-none text-ink" dir="ltr">
              <CountUp value={r.capacityValueMonthly} locale={locale} options={currency} spring />
            </dd>
          </div>
          <div className="rounded-card border border-border-card bg-bg/50 p-4">
            <dt className="text-[13px] text-muted">{t('res_year')}</dt>
            <dd className="mt-2 font-display text-[32px] font-semibold leading-none text-ink" dir="ltr">
              <CountUp value={r.annualValue} locale={locale} options={currency} spring />
            </dd>
          </div>
        </dl>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {t('summary', {
            hours: n(chat, 1),
            pct: pct(s.automationPct),
            saved: n(r.savedHoursMonthly),
            month: money(r.capacityValueMonthly),
            year: money(r.annualValue),
          })}
        </p>

        <p className="mt-6 text-[14px] leading-relaxed text-muted">{t('honesty')}</p>
        <div className="mt-6">
          <ArrowButton href="/automation-roi" label={t('cta')} className="min-h-12 px-7 py-3 text-[15px]" />
        </div>
      </div>
    </div>
  );
}
