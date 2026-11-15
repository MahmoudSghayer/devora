'use client';

import {useLocale, useTranslations} from 'next-intl';
import type {RoiResult} from '@/lib/roi/types';
import {ChevronIcon} from './icons';
import {money, num, percent} from './format';
import {rowHours, toNum, type CalcState} from './model';
import {Ltr} from './ui';

function Line({label, formula}: {label: string; formula: string}) {
  return (
    <li className="flex flex-col gap-1 border-b border-border-sub py-3 last:border-b-0">
      <span className="text-sm text-ink-2">{label}</span>
      <Ltr className="break-words font-mono text-[13px] leading-relaxed text-signal-hi">{formula}</Ltr>
    </li>
  );
}

export default function HowWeCalculate({state, result: r}: {state: CalcState; result: RoiResult}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  const a = r.assumptions;
  const n = (v: number, d = 1) => num(v, locale, d);
  const h = t('unit.h');
  const pct = (v: number) => percent(v, locale);
  const days = n(a.workingDays, 0);

  const perTask = state.tasks.map((task, i) => {
    const row = r.rows[i];
    const name = t(`task.${task.taskId}`);
    const sum = task.rows
      .map((x) => `${n(toNum(x.times) || 0, 2)} × ${n(toNum(x.minutes) || 0, 2)} × ${n(toNum(x.employees) || 0, 0)}`)
      .join(' + ');
    const grouped = task.rows.length > 1 ? `(${sum})` : sum;
    return {
      name,
      hours: `${grouped} ÷ 60 = ${n(task.rows.reduce((s, x) => s + rowHours(x), 0), 2)} ${h}/${t('unit.day')}`,
      month: `${n(row.hoursPerDay, 2)} × ${days} = ${n(row.monthlyHours)} ${h}`,
      saved: `${n(row.monthlyHours)} × ${pct(task.pct / 100)} = ${n(row.savedHours)} ${h}`,
    };
  });

  const laborFormula =
    a.laborMode === 'salary' && a.employerCostMultiplier !== null
      ? `${money(toNum(state.salary), locale)} × ${n(a.employerCostMultiplier, 2)} ÷ ${n(a.hoursPerMonthFte, 0)} = ${money(a.hourlyCost, locale)}`
      : money(a.hourlyCost, locale);
  const laborLabel =
    a.laborMode === 'salary' ? t('calc.laborSalary') : a.laborMode === 'hourly' ? t('calc.laborHourly') : t('calc.laborUnknown');

  const cost = money(r.implementationCost, locale);
  const run = money(r.runningMonthly, locale);
  const payF = (value: number, pay: number | null) =>
    `${cost} ÷ (${money(value, locale)} − ${run}) = ${pay === null ? t('results.na') : `${n(pay)} ${t('unit.month')}`}`;
  const roiF = (value: number, roi: number | null) =>
    `(12 × ${money(value, locale)} − 12 × ${run} − ${cost}) ÷ (${cost} + 12 × ${run}) = ${roi === null ? t('results.na') : pct(roi)}`;

  return (
    <details className="glass group rounded-panel p-5 nav:p-8">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {t('calc.title')}
        <ChevronIcon className="size-5 shrink-0 -rotate-90 transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-4 flex flex-col gap-6">
        <p className="max-w-[68ch] text-sm leading-relaxed text-muted">{t('calc.intro')}</p>

        <section>
          <h4 className="font-display text-base font-semibold text-ink">{t('calc.hoursTitle')}</h4>
          <ul>
            {perTask.map((p) => (
              <li key={p.name} className="border-b border-border-sub py-3 last:border-b-0">
                <p className="text-sm font-medium text-ink">{p.name}</p>
                <Ltr className="mt-1 block font-mono text-[13px] text-signal-hi">{p.hours}</Ltr>
                <Ltr className="block font-mono text-[13px] text-signal-hi">{p.month}</Ltr>
                <Ltr className="block font-mono text-[13px] text-signal-hi">{p.saved}</Ltr>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-2">
            {t('calc.hoursDay')} · {t('calc.hoursMonth')} · {t('calc.saved')}
          </p>
        </section>

        <section>
          <h4 className="font-display text-base font-semibold text-ink">{t('calc.laborTitle')}</h4>
          <ul>
            <Line label={laborLabel} formula={laborFormula} />
          </ul>
        </section>

        <section>
          <h4 className="font-display text-base font-semibold text-ink">{t('calc.valueTitle')}</h4>
          <ul>
            <Line
              label={t('calc.valueMonth')}
              formula={`${n(r.savedHoursMonthly)} ${h} × ${money(a.hourlyCost, locale)} = ${money(r.capacityValueMonthly, locale)}`}
            />
            <Line
              label={t('calc.valueYear')}
              formula={`${money(r.capacityValueMonthly, locale)} × 12 = ${money(r.annualValue, locale)}`}
            />
          </ul>
        </section>

        <section>
          <h4 className="font-display text-base font-semibold text-ink">{t('calc.splitTitle')}</h4>
          <ul>
            <Line
              label={t('calc.splitDirect')}
              formula={`${money(r.capacityValueMonthly, locale)} × ${pct(a.directShare)} = ${money(r.directReductionMonthly, locale)}`}
            />
            <Line
              label={t('calc.splitProductivity')}
              formula={`${money(r.capacityValueMonthly, locale)} − ${money(r.directReductionMonthly, locale)} = ${money(r.productivityValueMonthly, locale)}`}
            />
          </ul>
        </section>

        <section>
          <h4 className="font-display text-base font-semibold text-ink">{t('calc.fteTitle')}</h4>
          <ul>
            <Line
              label={t('calc.fte')}
              formula={`${n(r.savedHoursMonthly)} ÷ ${n(a.hoursPerMonthFte, 0)} = ${n(r.fteEquivalent, 2)} FTE`}
            />
          </ul>
        </section>

        <section>
          <h4 className="font-display text-base font-semibold text-ink">{t('calc.costTitle')}</h4>
          <ul>
            <Line
              label={t('calc.implementation')}
              formula={`${money(a.implementationBase, locale)} + ${money(a.implementationPerTask, locale)} × ${r.automatedTasks} = ${cost}`}
            />
            <Line
              label={t('calc.running')}
              formula={`${money(a.runningBase, locale)} + ${money(a.runningPerTask, locale)} × ${r.automatedTasks} = ${run}`}
            />
          </ul>
        </section>

        <section>
          <h4 className="font-display text-base font-semibold text-ink">{t('calc.roiTitle')}</h4>
          <ul>
            <Line label={t('calc.paybackDirect')} formula={payF(r.directReductionMonthly, r.paybackMonthsDirect)} />
            <Line label={t('calc.paybackCapacity')} formula={payF(r.capacityValueMonthly, r.paybackMonthsCapacity)} />
            <Line label={t('calc.roiDirect')} formula={roiF(r.directReductionMonthly, r.roi12Direct)} />
            <Line label={t('calc.roiCapacity')} formula={roiF(r.capacityValueMonthly, r.roi12Capacity)} />
          </ul>
        </section>

        <section>
          <h4 className="font-display text-base font-semibold text-ink">{t('calc.assumptionsTitle')}</h4>
          <ul className="mt-2 list-disc ps-5 text-sm leading-relaxed text-muted">
            <li>{t('calc.assumptions.a1')}</li>
            <li>{t('calc.assumptions.a2', {pct: pct(a.directShare)})}</li>
            <li>{t('calc.assumptions.a3')}</li>
            <li>{t('calc.assumptions.a4', {days, hours: n(a.hoursPerMonthFte, 0)})}</li>
          </ul>
        </section>
      </div>
    </details>
  );
}
