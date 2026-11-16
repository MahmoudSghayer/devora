'use client';

import type {ReactNode} from 'react';
import {useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {budgetParams} from '@/lib/pricing/budget';
import Magnetic from '@/components/motion/Magnetic';
import {SITE} from '@/lib/site';
import {validateContact, type ContactErrorKey} from '@/lib/validation';

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'rate';
type FieldKey = 'name' | 'email' | 'details' | 'consent';

const inputCls =
  'w-full rounded-input border border-border-card bg-surface px-4 py-[15px] font-display text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-amber';

function Field({
  id,
  label,
  error,
  full,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2.5 ${full ? 'nav:col-span-2' : ''}`}>
      <label
        htmlFor={id}
        className="u-mono font-mono text-[11px] uppercase tracking-[0.18em] text-muted-2"
      >
        {label}
      </label>
      {children}
      {error && (
        <span id={`${id}-err`} className="text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

export default function ContactForm() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const bp = budgetParams(locale);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, ContactErrorKey>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [ref, setRef] = useState<string | null>(null);
  // One idempotency key per form session; a retry after an error reuses it.
  const key = useRef<string>('');
  const startedAt = useRef<number>(0);
  useEffect(() => {
    key.current = crypto.randomUUID();
    startedAt.current = Date.now();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const val = (k: string) => String(fd.get(k) ?? '').trim();
    const consent = fd.get('consent') === 'on';

    const errs = validateContact({
      name: val('name'),
      email: val('email'),
      details: val('details'),
      consent,
    });
    setErrors(errs);
    const first = (Object.keys(errs) as FieldKey[])[0];
    if (first) {
      setStatus('idle');
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          source: 'contact',
          idempotencyKey: key.current,
          locale,
          startedAtMs: startedAt.current,
          website: val('website'),
          contact: {
            name: val('name'),
            businessName: val('company') || undefined,
            email: val('email'),
            phone: val('phone') || undefined,
            preferredContact: 'email',
            consent: true,
          },
          answers: {message: val('details'), budget: val('budget') || undefined},
        }),
      });
      if (res.status === 429) {
        setStatus('rate');
        return;
      }
      const json = (await res.json().catch(() => null)) as {ok?: boolean; leadRef?: string} | null;
      if (!res.ok || !json?.ok) throw new Error('bad status');
      setRef(json.leadRef ?? null);
      setStatus('sent');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  const budgetOptions = ['o1', 'o2', 'o3', 'o4', 'o5'] as const;

  const err = (k: FieldKey) => (errors[k] ? t(errors[k]) : undefined);
  const a11y = (k: FieldKey) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `c-${k}-err` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-7 nav:grid-cols-2">
      <Field id="c-name" label={t('f_name')} error={err('name')}>
        <input id="c-name" name="name" type="text" autoComplete="name" className={inputCls} {...a11y('name')} />
      </Field>
      <Field id="c-email" label={t('f_email')} error={err('email')}>
        <input id="c-email" name="email" type="email" autoComplete="email" dir="ltr" className={`${inputCls} text-start`} {...a11y('email')} />
      </Field>
      <Field id="c-company" label={t('f_company')}>
        <input id="c-company" name="company" type="text" autoComplete="organization" className={inputCls} />
      </Field>
      <Field id="c-phone" label={t('f_phone')}>
        <input id="c-phone" name="phone" type="tel" autoComplete="tel" dir="ltr" className={`${inputCls} text-start`} />
      </Field>
      <Field id="c-budget" label={t('f_budget')} full>
        <select id="c-budget" name="budget" className={inputCls}>
          {budgetOptions.map((o) => (
            <option key={o} value={t(o, bp)}>
              {t(o, bp)}
            </option>
          ))}
        </select>
      </Field>
      <Field id="c-details" label={t('f_details')} error={err('details')} full>
        <textarea id="c-details" name="details" rows={6} className={`${inputCls} resize-y`} {...a11y('details')} />
      </Field>

      {/* Honeypot: real users never see or fill it. */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-2 nav:col-span-2">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-2">
          <input
            name="consent"
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 accent-amber"
            {...a11y('consent')}
          />
          <span>{t('f_consent')}</span>
        </label>
        {errors.consent && (
          <span id="c-consent-err" className="text-xs text-danger">
            {t(errors.consent)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 nav:col-span-2">
        <Magnetic>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="rounded-pill bg-amber px-10 py-[17px] font-display text-base font-semibold text-on-amber transition-colors hover:bg-amber-hi disabled:opacity-70"
          >
            {status === 'sending' ? t('sending') : t('f_send')}
          </button>
        </Magnetic>
        <div aria-live="polite" className="text-sm">
          {status === 'sent' && (
            <p className="text-amber">
              {t('send_success')}
              {ref && (
                <>
                  {' '}
                  {t('sent_ref')}: <span dir="ltr" className="num font-mono">{ref}</span>
                </>
              )}
            </p>
          )}
          {status === 'rate' && <p className="text-danger" role="alert">{t('err_rate')}</p>}
          {status === 'error' && (
            <p className="text-danger" role="alert">
              {t('send_error')}{' '}
              <a href={`mailto:${SITE.email}`} dir="ltr" className="underline">
                {SITE.email}
              </a>
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
