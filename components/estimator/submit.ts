// POST /api/estimate — envelope per docs/leads.md. Never throws.

import type {EstimatorAnswers} from '@/lib/estimator/schema';
import type {TimelineEntry} from './model';

export type ContactPref = 'email' | 'phone' | 'whatsapp';

export interface ContactForm {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  details: string;
  preferred: ContactPref;
  consent: boolean;
}

export const EMPTY_FORM: ContactForm = {
  name: '',
  businessName: '',
  email: '',
  phone: '',
  details: '',
  preferred: 'email',
  consent: false,
};

export type SubmitError = 'validation' | 'origin' | 'too_large' | 'rate_limited' | 'unavailable' | 'network';

export type SubmitOutcome =
  | {ok: true; leadRef: string; duplicate: boolean}
  | {ok: false; error: SubmitError; retryAfterSec?: number};

export interface SubmitInput {
  locale: string;
  idempotencyKey: string;
  startedAtMs: number;
  answers: EstimatorAnswers;
  form: ContactForm;
  notes: string | undefined;
  timeline: TimelineEntry[];
  /** value of the hidden honeypot input; a human leaves it empty */
  honeypot: string;
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

function readUtm(): Record<string, string> | undefined {
  try {
    const q = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = q.get(k);
      if (v) out[k] = v.slice(0, 200);
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}

const KNOWN: readonly SubmitError[] = ['validation', 'origin', 'too_large', 'rate_limited', 'unavailable'];

export async function submitEstimate(input: SubmitInput): Promise<SubmitOutcome> {
  const {form} = input;
  const body = {
    source: 'website_estimate',
    idempotencyKey: input.idempotencyKey,
    locale: input.locale === 'ar' ? 'ar' : 'en',
    startedAtMs: input.startedAtMs,
    contact: {
      name: form.name.trim(),
      businessName: form.businessName.trim() || undefined,
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      notes: input.notes,
      preferredContact: form.preferred,
      consent: true,
    },
    answers: input.answers,
    timeline: [...input.timeline, {step: 'submit', tsMs: Date.now()}].slice(-60),
    utm: readUtm(),
    website: input.honeypot,
  };
  try {
    const res = await fetch('/api/estimate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      | {ok?: boolean; leadRef?: string; duplicate?: boolean; error?: string; retryAfterSec?: number}
      | null;
    if (res.ok && data?.ok === true && typeof data.leadRef === 'string') {
      return {ok: true, leadRef: data.leadRef, duplicate: data.duplicate === true};
    }
    const header = Number(res.headers.get('Retry-After'));
    const retryAfterSec = data?.retryAfterSec ?? (Number.isFinite(header) && header > 0 ? header : undefined);
    const err = KNOWN.find((k) => k === data?.error);
    if (err) return {ok: false, error: err, retryAfterSec};
    if (res.status === 429) return {ok: false, error: 'rate_limited', retryAfterSec};
    if (res.status === 413) return {ok: false, error: 'too_large'};
    if (res.status === 403) return {ok: false, error: 'origin'};
    if (res.status === 400) return {ok: false, error: 'validation'};
    return {ok: false, error: 'unavailable', retryAfterSec};
  } catch {
    return {ok: false, error: 'network'};
  }
}
