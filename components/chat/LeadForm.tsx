'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {validateLead, type LeadErrorKey} from '@/lib/validation';
import type {ChatLocale} from '@/lib/chat/types';

export default function LeadForm({
  locale,
  conversationId,
  token,
  onCancel,
}: {
  locale: ChatLocale;
  conversationId: string | null;
  token: string | null;
  onCancel: () => void;
}) {
  const t = useTranslations('chat');
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    request: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<'name' | 'email' | 'request', LeadErrorKey>>
  >({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [website, setWebsite] = useState(''); // honeypot

  const set = (k: keyof typeof values) => (v: string) =>
    setValues((prev) => ({...prev, [k]: v}));

  const submit = async () => {
    const errs = validateLead(values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          token: token ?? undefined,
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          company: values.company || undefined,
          request: values.request,
          locale,
          website,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // brief success, then hand back to the chat
        setStatus('idle');
        onCancel();
        alertSuccess(t('lead_success'));
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const inputCls =
    'w-full rounded-[10px] border border-border-card bg-surface-2 px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-faint focus:border-border-ghost';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-2.5 border-t border-border-sub bg-surface p-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink">{t('lead_prompt')}</p>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t('close_aria')}
          className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* honeypot — hidden from users, tempting to bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="sr-only"
      />

      <div>
        <input
          className={inputCls}
          placeholder={t('f_name')}
          value={values.name}
          onChange={(e) => set('name')(e.target.value)}
        />
        {errors.name && <p className="mt-1 text-[12px] text-red-400">{t('err_name')}</p>}
      </div>
      <div>
        <input
          className={inputCls}
          type="email"
          dir="ltr"
          placeholder={t('f_email')}
          value={values.email}
          onChange={(e) => set('email')(e.target.value)}
        />
        {errors.email && <p className="mt-1 text-[12px] text-red-400">{t('err_email')}</p>}
      </div>
      <input
        className={inputCls}
        dir="ltr"
        placeholder={t('f_phone')}
        value={values.phone}
        onChange={(e) => set('phone')(e.target.value)}
      />
      <input
        className={inputCls}
        placeholder={t('f_company')}
        value={values.company}
        onChange={(e) => set('company')(e.target.value)}
      />
      <div>
        <textarea
          className={`${inputCls} min-h-[64px] resize-none`}
          placeholder={t('f_request')}
          value={values.request}
          onChange={(e) => set('request')(e.target.value)}
        />
        {errors.request && (
          <p className="mt-1 text-[12px] text-red-400">{t('err_request')}</p>
        )}
      </div>

      {status === 'error' && (
        <p role="alert" className="text-[12px] text-red-400">
          {t('lead_error')}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="rounded-[10px] bg-amber py-2.5 text-[14px] font-semibold text-on-amber transition-colors hover:bg-amber-hi disabled:opacity-50"
      >
        {status === 'sending' ? t('lead_sending') : t('lead_send')}
      </button>
    </form>
  );
}

// Tiny toast so the success message survives the form unmounting.
function alertSuccess(message: string) {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.textContent = message;
  el.setAttribute('role', 'status');
  el.style.cssText =
    'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:70;background:#141414;color:#f2f2ef;border:1px solid #2a2a28;border-radius:12px;padding:12px 16px;font-size:13px;max-width:320px;text-align:center';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}
