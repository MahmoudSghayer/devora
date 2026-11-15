'use client';

import {useRef, useState, type FormEvent} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import Spotlight from '@/components/motion/Spotlight';
import {trackFunnel} from '@/lib/leads/track';
import type {RoiResult} from '@/lib/roi/types';
import {SITE} from '@/lib/site';
import {ErrorText, OptionGroup, inputCls, primaryBtn} from './ui';
import {money, num} from './format';
import {toAnswers, type CalcState} from './model';

export type Channel = 'email' | 'phone' | 'whatsapp';
export interface Submitted {
  leadRef: string;
  duplicate: boolean;
  channel: Channel;
  name: string;
}

type FieldKey = 'name' | 'email' | 'phone' | 'details' | 'business' | 'consent';
type Errors = Partial<Record<FieldKey, string>>;
type Fail = {kind: 'e400' | 'e403' | 'e413' | 'e429' | 'e503' | 'network' | 'unknown'; seconds?: number};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FIELD_ORDER: FieldKey[] = ['name', 'business', 'email', 'phone', 'details', 'consent'];
const fid = (k: FieldKey) => `lf-${k}`;

function Label({htmlFor, children, optional}: {htmlFor: string; children: string; optional?: string}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-snug text-ink-2">
      {children}
      {optional && <span className="ms-2 text-xs font-normal text-muted-2">({optional})</span>}
    </label>
  );
}

export default function LeadForm({
  state,
  result,
  onSuccess,
}: {
  state: CalcState;
  result: RoiResult;
  onSuccess: (s: Submitted) => void;
}) {
  const t = useTranslations('roi');
  const locale = useLocale();
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [channel, setChannel] = useState<Channel>('email');
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [fail, setFail] = useState<Fail | null>(null);
  const [attempted, setAttempted] = useState(false);

  const read = (k: string): string => {
    const el = formRef.current?.elements.namedItem(k);
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value.trim() : '';
  };

  function validate(): Errors {
    const e: Errors = {};
    if (!read('name')) e.name = t('form.err.name');
    if (read('business').length > 160) e.business = t('form.err.long');
    if (!EMAIL_RE.test(read('email')) || read('email').length > 254) e.email = t('form.err.email');
    if (channel !== 'email' && !read('phone')) e.phone = t('form.err.phone');
    if (read('phone').length > 40) e.phone = t('form.err.long');
    if (read('details').length > 2000) e.details = t('form.err.long');
    if (!(formRef.current?.elements.namedItem('consent') as HTMLInputElement | null)?.checked) e.consent = t('form.err.consent');
    return e;
  }

  const mailto = () => {
    const tasks = state.tasks.map((x) => t(`task.${x.taskId}`)).join(', ');
    const body = t('form.mailBody', {
      tasks,
      hours: num(result.savedHoursMonthly, locale, 1),
      value: money(result.capacityValueMonthly, locale),
      name: read('name'),
    });
    return `mailto:${SITE.email}?subject=${encodeURIComponent(t('form.mailSubject'))}&body=${encodeURIComponent(body)}`;
  };

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (inFlight.current) return;
    const e = validate();
    setAttempted(true);
    setErrors(e);
    const first = FIELD_ORDER.find((k) => e[k]);
    if (first) {
      document.getElementById(fid(first))?.focus();
      return;
    }
    inFlight.current = true;
    setStatus('sending');
    setFail(null);
    const business = read('business');
    const phone = read('phone');
    const notes = read('details');
    const body = {
      idempotencyKey: state.key,
      locale,
      startedAtMs: state.startedAt ?? Date.now() - 60_000,
      contact: {
        name: read('name'),
        ...(business ? {businessName: business} : {}),
        email: read('email'),
        ...(phone ? {phone} : {}),
        ...(notes ? {notes} : {}),
        preferredContact: channel,
        consent: true as const,
      },
      answers: toAnswers(state),
      timeline: state.timeline,
      ...(Object.keys(state.utm).length > 0 ? {utm: state.utm} : {}),
      website: read('website'),
      result: {
        savedHoursMonthly: result.savedHoursMonthly,
        capacityValueMonthly: result.capacityValueMonthly,
        directReductionMonthly: result.directReductionMonthly,
        implementationCost: result.implementationCost,
      },
    };
    try {
      const res = await fetch('/api/automation-roi', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const data: {ok?: boolean; leadRef?: string; duplicate?: boolean; retryAfterSec?: number} = await res
        .json()
        .catch(() => ({}));
      if (res.ok && data.ok && data.leadRef) {
        trackFunnel('roi_submitted', {
          tasks: state.tasks.length,
          hoursMonthly: Math.round(result.savedHoursMonthly),
          duplicate: Boolean(data.duplicate),
        });
        onSuccess({leadRef: data.leadRef, duplicate: Boolean(data.duplicate), channel, name: body.contact.name});
        return;
      }
      const kind: Fail['kind'] =
        res.status === 400 ? 'e400' : res.status === 403 ? 'e403' : res.status === 413 ? 'e413' : res.status === 429 ? 'e429' : res.status === 503 ? 'e503' : 'unknown';
      setFail({kind, seconds: (data.retryAfterSec ?? Number(res.headers.get('Retry-After'))) || 60});
      setStatus('error');
    } catch {
      setFail({kind: 'network'});
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }

  const live = attempted ? errors : {};
  const errCount = Object.keys(live).length;
  const sending = status === 'sending';
  const field = (k: FieldKey) => ({
    id: fid(k),
    name: k,
    'aria-invalid': live[k] ? (true as const) : undefined,
    'aria-describedby': live[k] ? `${fid(k)}-err` : undefined,
    className: inputCls,
  });

  return (
    <Spotlight tone="signal" className="glass rounded-panel">
      <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6 rounded-panel p-5 nav:p-8 print:hidden">
        <h3 className="font-display text-xl font-semibold text-ink">{t('form.title')}</h3>

        {errCount > 0 && (
          <p role="alert" className="rounded-card border border-amber p-4 text-sm text-amber-hi">
            {t('form.err.summary', {count: errCount})}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 min-[620px]:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={fid('name')}>{t('form.name')}</Label>
            <input {...field('name')} type="text" autoComplete="name" maxLength={120} required aria-required="true" />
            {live.name && <ErrorText id={`${fid('name')}-err`}>{live.name}</ErrorText>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={fid('business')} optional={t('form.optional')}>{t('form.business')}</Label>
            <input {...field('business')} type="text" autoComplete="organization" />
            {live.business && <ErrorText id={`${fid('business')}-err`}>{live.business}</ErrorText>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={fid('email')}>{t('form.email')}</Label>
            <input {...field('email')} type="email" autoComplete="email" dir="ltr" required aria-required="true" />
            {live.email && <ErrorText id={`${fid('email')}-err`}>{live.email}</ErrorText>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={fid('phone')} optional={channel === 'email' ? t('form.optional') : undefined}>{t('form.phone')}</Label>
            <input {...field('phone')} type="tel" autoComplete="tel" dir="ltr" inputMode="tel" aria-required={channel !== 'email' ? 'true' : undefined} />
            {live.phone && <ErrorText id={`${fid('phone')}-err`}>{live.phone}</ErrorText>}
          </div>
        </div>

        <OptionGroup
          name="preferred"
          legend={t('form.preferred')}
          options={(['email', 'phone', 'whatsapp'] as const).map((c) => ({value: c, label: t(`form.channel.${c}`)}))}
          value={channel}
          onSelect={(v) => setChannel(v as Channel)}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor={fid('details')} optional={t('form.optional')}>{t('form.details')}</Label>
          <textarea {...field('details')} rows={4} maxLength={2100} className={`${inputCls} resize-y`} />
          <p className="text-xs text-muted-2">{t('form.detailsHint')}</p>
          {live.details && <ErrorText id={`${fid('details')}-err`}>{live.details}</ErrorText>}
        </div>

        {/* honeypot: real visitors never see or fill it */}
        <div aria-hidden className="sr-only">
          <label>
            {t('form.honeypot')}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber">
            <input
              id={fid('consent')}
              name="consent"
              type="checkbox"
              required
              aria-required="true"
              aria-invalid={live.consent ? true : undefined}
              aria-describedby={live.consent ? `${fid('consent')}-err` : undefined}
              className="mt-0.5 size-5 shrink-0 accent-signal"
            />
            <span>{t('form.consent')}</span>
          </label>
          {live.consent && <ErrorText id={`${fid('consent')}-err`}>{live.consent}</ErrorText>}
        </div>

        {fail && (
          <div role="alert" className="flex flex-col gap-3 rounded-card border border-amber p-4 text-sm text-amber-hi">
            <p>{t(`form.err.${fail.kind}`, {seconds: fail.seconds ?? 60})}</p>
            <div className="text-ink-2">
              <p className="font-semibold">{t('form.fallbackTitle')}</p>
              <p className="mt-1 text-muted">{t('form.fallbackBody')}</p>
              <a href={mailto()} className="mt-2 inline-flex min-h-11 items-center font-semibold text-signal underline underline-offset-4">
                {t('form.mailto')}
              </a>
            </div>
          </div>
        )}

        <div>
          <button type="submit" className={primaryBtn} disabled={sending} aria-disabled={sending}>
            {sending ? t('form.sending') : status === 'error' ? t('form.retry') : t('form.submit')}
          </button>
        </div>
      </form>
    </Spotlight>
  );
}
