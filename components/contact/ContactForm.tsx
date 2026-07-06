'use client';

import type {ReactNode} from 'react';
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import Magnetic from '@/components/motion/Magnetic';
import {validateContact, type ContactErrorKey} from '@/lib/validation';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const inputCls =
  'w-full rounded-[10px] border border-border-card bg-surface px-4 py-[15px] font-display text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:[outline:2px_solid_var(--color-amber)]';

function Field({
  label,
  error,
  full,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-2.5 ${full ? 'nav:col-span-2' : ''}`}>
      <span className="u-mono font-mono text-[11px] uppercase tracking-[0.18em] text-muted-2">
        {label}
      </span>
      {children}
      {error && <span className="text-xs text-[#e0715f]">{error}</span>}
    </label>
  );
}

export default function ContactForm() {
  const t = useTranslations('contact');
  const [errors, setErrors] = useState<
    Partial<Record<'name' | 'email' | 'details', ContactErrorKey>>
  >({});
  const [status, setStatus] = useState<Status>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;

    const errs = validateContact(data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setStatus('idle');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('bad status');
      setStatus('sent');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  const budgetOptions = ['o1', 'o2', 'o3', 'o4', 'o5'] as const;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-7 nav:grid-cols-2">
      <Field label={t('f_name')} error={errors.name && t(errors.name)}>
        <input name="name" type="text" autoComplete="name" className={inputCls} />
      </Field>
      <Field label={t('f_email')} error={errors.email && t(errors.email)}>
        <input name="email" type="email" autoComplete="email" className={inputCls} />
      </Field>
      <Field label={t('f_company')}>
        <input name="company" type="text" autoComplete="organization" className={inputCls} />
      </Field>
      <Field label={t('f_budget')}>
        <select name="budget" className={inputCls}>
          {budgetOptions.map((o) => (
            <option key={o} value={t(o)}>
              {t(o)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('f_details')} error={errors.details && t(errors.details)} full>
        <textarea name="details" rows={6} className={`${inputCls} resize-y`} />
      </Field>

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
        {status === 'sent' && (
          <p className="text-sm text-amber" role="status">
            {t('send_success')}
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm text-[#e0715f]" role="alert">
            {t('send_error')}
          </p>
        )}
      </div>
    </form>
  );
}
