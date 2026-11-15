'use client';

import {useEffect, useRef, useState, type Dispatch, type SetStateAction} from 'react';
import {useLocale} from 'next-intl';
import {formatMoney} from '@/lib/pricing/config';
import type {EstimateResult} from '@/lib/estimator/types';
import {NOTES_MAX, type StepNo} from '../model';
import SummaryList from '../SummaryList';
import {RangeFigures, weeksText} from '../EstimatePanel';
import {useTx, type Tx} from '../i18n';
import type {SummarySection} from '../summary';
import type {ContactForm, ContactPref, SubmitError} from '../submit';
import {BTN_PRIMARY, FIELD, Field, Group, Choice} from '../ui';

export interface Failure {
  error: SubmitError;
  retryAfterSec?: number;
}

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'consent', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREFS: readonly ContactPref[] = ['email', 'phone', 'whatsapp'];

function validate(f: ContactForm, t: Tx): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = t('err.name');
  if (!EMAIL_RE.test(f.email.trim())) e.email = t('err.email');
  if (f.preferred !== 'email' && !f.phone.trim()) e.phone = t('err.phone');
  if (!f.consent) e.consent = t('err.consent');
  return e;
}

function failureText(t: Tx, f: Failure): string {
  if (f.error === 'rate_limited') {
    return f.retryAfterSec ? t('err.rate', {sec: f.retryAfterSec}) : t('err.rate_generic');
  }
  return t(`err.${f.error}`);
}

/** Step 7: read-only summary, then the contact form and the CTA. */
export default function SummaryStep({
  sections,
  est,
  form,
  setForm,
  submitting,
  failure,
  mailto,
  onSubmit,
  onEdit,
}: {
  sections: SummarySection[];
  est: EstimateResult;
  form: ContactForm;
  setForm: Dispatch<SetStateAction<ContactForm>>;
  submitting: boolean;
  failure: Failure | null;
  mailto: string;
  onSubmit: (honeypot: string) => void;
  onEdit: (step: StepNo) => void;
}) {
  const t = useTx();
  const locale = useLocale();
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const set = <K extends keyof ContactForm>(k: K, v: ContactForm[K]) => setForm((f) => ({...f, [k]: v}));

  useEffect(() => {
    if (failure) alertRef.current?.focus();
  }, [failure]);

  const submit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (submitting) return;
    const found = validate(form, t);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = (['name', 'email', 'phone', 'consent'] as const).find((k) => found[k]);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus());
      return;
    }
    const hp = formRef.current?.elements.namedItem('website');
    onSubmit(hp instanceof HTMLInputElement ? hp.value : '');
  };

  const errorList = Object.values(errors).filter(Boolean);

  return (
    <div className="space-y-10">
      <section aria-labelledby="est-sum" className="glass rounded-panel p-5 nav:p-8">
        <h3 id="est-sum" className="mb-5 font-display text-lg font-semibold text-ink">
          {t('sum.title')}
        </h3>
        <SummaryList sections={sections} onEdit={onEdit} />
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-hairline pt-5">
          <div>
            <p className="text-sm text-muted">{t('panel.range_label')}</p>
            <p className="font-display text-2xl font-semibold text-ink">
              <RangeFigures est={est} />
            </p>
          </div>
          <div className="text-sm text-ink-2">
            <p>{weeksText(t, est.weeksLow, est.weeksHigh)}</p>
            <p>
              {t('panel.maintenance')}:{' '}
              <span dir="ltr" className="num">
                {formatMoney(est.maintenanceMonthly, locale)}
              </span>{' '}
              {t('panel.per_month')}
            </p>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted">{t('disclaimer')}</p>
      </section>

      <form ref={formRef} onSubmit={submit} noValidate aria-labelledby="est-form-h" className="space-y-6">
        <h3 id="est-form-h" className="font-display text-lg font-semibold text-ink">
          {t('f.title')}
        </h3>

        {errorList.length > 0 ? (
          <div role="alert" className="rounded-card border border-danger p-4 text-sm text-ink-2">
            <p className="font-semibold text-danger">{t('err.summary')}</p>
            <ul className="mt-1 list-disc ps-5">
              {errorList.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-5 nav:grid-cols-2">
          <Field label={t('f.name')} error={errors.name}>
            {({id, describedBy, invalid}) => (
              <input
                id={id}
                data-field="name"
                name="name"
                autoComplete="name"
                required
                aria-required="true"
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={FIELD}
                value={form.name}
                maxLength={120}
                onChange={(e) => set('name', e.target.value)}
              />
            )}
          </Field>
          <Field label={t('f.business')} optionalText={t('optional')}>
            {({id, describedBy}) => (
              <input
                id={id}
                name="organization"
                autoComplete="organization"
                aria-describedby={describedBy}
                className={FIELD}
                value={form.businessName}
                maxLength={160}
                onChange={(e) => set('businessName', e.target.value)}
              />
            )}
          </Field>
          <Field label={t('f.email')} error={errors.email}>
            {({id, describedBy, invalid}) => (
              <input
                id={id}
                data-field="email"
                name="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                inputMode="email"
                required
                aria-required="true"
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={`${FIELD} text-start`}
                value={form.email}
                maxLength={254}
                onChange={(e) => set('email', e.target.value)}
              />
            )}
          </Field>
          <Field
            label={t('f.phone')}
            optionalText={form.preferred === 'email' ? t('optional') : undefined}
            error={errors.phone}
          >
            {({id, describedBy, invalid}) => (
              <input
                id={id}
                data-field="phone"
                name="tel"
                type="tel"
                dir="ltr"
                autoComplete="tel"
                inputMode="tel"
                aria-required={form.preferred !== 'email'}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className={`${FIELD} text-start`}
                value={form.phone}
                maxLength={40}
                onChange={(e) => set('phone', e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field label={t('f.details')} optionalText={t('optional')} hint={t('f.details_hint')}>
          {({id, describedBy}) => (
            <textarea
              id={id}
              name="details"
              rows={4}
              aria-describedby={describedBy}
              className={`${FIELD} resize-y`}
              value={form.details}
              maxLength={NOTES_MAX}
              onChange={(e) => set('details', e.target.value)}
            />
          )}
        </Field>

        <Group legend={t('f.preferred')}>
          <div className="grid grid-cols-1 gap-3 nav:grid-cols-3">
            {PREFS.map((p) => (
              <Choice
                key={p}
                kind="radio"
                name="preferred"
                value={p}
                checked={form.preferred === p}
                onChange={() => set('preferred', p)}
                label={t(`pref.${p}`)}
              />
            ))}
          </div>
        </Group>

        {/* Honeypot: invisible to people and assistive tech, never filled. */}
        <div aria-hidden="true" className="sr-only">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              data-field="consent"
              name="consent"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? 'est-consent-e' : undefined}
              checked={form.consent}
              onChange={(e) => set('consent', e.target.checked)}
              className="mt-0.5 size-6 shrink-0 accent-amber"
            />
            <span className="text-sm leading-relaxed text-ink-2">{t('f.consent')}</span>
          </label>
          {errors.consent ? (
            <p id="est-consent-e" className="mt-1.5 flex gap-1.5 ps-9 text-[13px] font-medium text-danger">
              <span aria-hidden>!</span>
              <span>{errors.consent}</span>
            </p>
          ) : null}
        </div>

        {failure ? (
          <div
            ref={alertRef}
            tabIndex={-1}
            role="alert"
            className="space-y-3 rounded-card border border-danger p-4 text-sm leading-relaxed text-ink-2"
          >
            <p>{failureText(t, failure)}</p>
            <p>
              <a href={mailto} className="font-semibold text-amber underline underline-offset-4">
                {t('err.mailto')}
              </a>
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" aria-disabled={submitting} className={BTN_PRIMARY}>
            {submitting ? t('submitting') : failure ? t('retry') : t('cta')}
          </button>
          <p aria-live="polite" className="sr-only">
            {submitting ? t('submitting') : ''}
          </p>
        </div>
      </form>
    </div>
  );
}
