'use client';

import type {Dispatch} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import Spotlight from '@/components/motion/Spotlight';
import {ROI_CONFIG} from '@/lib/pricing/config';
import {LABOR_FIELD_ID, toNum, type Action, type CalcState, type FieldError, type FieldErrors, type LaborMode} from './model';
import {money, num} from './format';
import {NumField} from './ui';

const MODES: LaborMode[] = ['hourly', 'salary', 'unknown'];

export default function Labor({
  state,
  errors,
  dispatch,
}: {
  state: CalcState;
  errors: FieldErrors;
  dispatch: Dispatch<Action>;
}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  const err = (e: FieldError | undefined) => (e ? t(`err.${e.key}`, e.params) : undefined);
  const params = {
    hourly: money(ROI_CONFIG.defaultHourlyCost, locale),
    multiplier: num(ROI_CONFIG.defaultEmployerCostMultiplier, locale, 2),
    days: num(ROI_CONFIG.defaultWorkingDays, locale, 0),
    hours: num(ROI_CONFIG.hoursPerMonthFte, locale, 0),
  };
  const gross = toNum(state.salary);
  const mult = toNum(state.multiplier);
  const derived = Number.isFinite(gross) && Number.isFinite(mult) ? (gross * mult) / ROI_CONFIG.hoursPerMonthFte : null;

  return (
    <div className="flex flex-col gap-6">
      <Spotlight tone="signal" className="glass rounded-panel">
        <fieldset className="min-w-0 rounded-panel p-5 nav:p-8">
          <legend className="px-2 text-lg font-semibold text-ink">{t('labor.legend')}</legend>
          <div className="mt-4 grid grid-cols-1 gap-3 nav:grid-cols-3">
            {MODES.map((m) => {
              const checked = state.laborMode === m;
              return (
                <label
                  key={m}
                  className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber ${
                    checked ? 'border-signal bg-signal-lo/40' : 'border-border-card hover:border-border-ghost'
                  }`}
                >
                  <input
                    type="radio"
                    name="laborMode"
                    value={m}
                    checked={checked}
                    onChange={() => dispatch({type: 'setLaborMode', mode: m})}
                    className="mt-1 size-4 shrink-0 accent-signal"
                  />
                  <span>
                    <span className="block font-semibold text-ink">{t(`labor.mode.${m}`)}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{t(`labor.modeDesc.${m}`, params)}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-6" aria-live="polite">
            {state.laborMode === 'hourly' && (
              <NumField
                id={LABOR_FIELD_ID.hourly}
                label={t('labor.hourly')}
                hint={t('labor.hourlyHint')}
                suffix={t('labor.perHour')}
                value={state.hourly}
                error={err(errors[LABOR_FIELD_ID.hourly])}
                onChange={(value) => dispatch({type: 'setLabor', field: 'hourly', value})}
                className="max-w-sm"
              />
            )}
            {state.laborMode === 'salary' && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2">
                  <NumField
                    id={LABOR_FIELD_ID.salary}
                    label={t('labor.salary')}
                    hint={t('labor.salaryHint')}
                    suffix={t('labor.perMonth')}
                    value={state.salary}
                    error={err(errors[LABOR_FIELD_ID.salary])}
                    onChange={(value) => dispatch({type: 'setLabor', field: 'salary', value})}
                  />
                  <NumField
                    id={LABOR_FIELD_ID.multiplier}
                    label={t('labor.multiplier')}
                    hint={t('labor.multiplierHint', params)}
                    suffix="×"
                    step="0.01"
                    value={state.multiplier}
                    error={err(errors[LABOR_FIELD_ID.multiplier])}
                    onChange={(value) => dispatch({type: 'setLabor', field: 'multiplier', value})}
                  />
                </div>
                {derived !== null && derived > 0 && (
                  <p className="rounded-card border border-border-card bg-surface/60 p-4 text-sm leading-relaxed text-ink-2">
                    {t('labor.derived', {
                      gross: money(gross, locale),
                      mult: num(mult, locale, 2),
                      hours: params.hours,
                      hourly: money(derived, locale),
                    })}
                  </p>
                )}
                <details className="rounded-card border border-border-card bg-surface/60 p-4">
                  <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-ink">{t('labor.grossTitle')}</summary>
                  <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-muted">
                    <p>{t('labor.grossBody1')}</p>
                    <p>{t('labor.grossBody2', params)}</p>
                  </div>
                </details>
              </div>
            )}
            {state.laborMode === 'unknown' && (
              <p className="rounded-card border border-border-card bg-surface/60 p-4 text-sm leading-relaxed text-ink-2">
                {t('labor.unknownNote', params)}
              </p>
            )}
          </div>
        </fieldset>
      </Spotlight>

      <Spotlight tone="signal" className="glass rounded-panel">
        <div className="rounded-panel p-5 nav:p-8">
          <NumField
            id={LABOR_FIELD_ID.workingDays}
            label={t('labor.days')}
            hint={t('labor.daysHint', params)}
            suffix={t('labor.perMonth')}
            step="1"
            inputMode="numeric"
            value={state.workingDays}
            error={err(errors[LABOR_FIELD_ID.workingDays])}
            onChange={(value) => dispatch({type: 'setLabor', field: 'workingDays', value})}
            className="max-w-sm"
          />
        </div>
      </Spotlight>
    </div>
  );
}
