// Shared types for the lead pipeline (calculators + contact form).

export const LEAD_SOURCES = ['website_estimate', 'automation_roi', 'contact'] as const;
export type CalculatorLeadSource = (typeof LEAD_SOURCES)[number];
/** Every value the DB `leads.source` column accepts. */
export type LeadSource = CalculatorLeadSource | 'chat';

export type PreferredContact = 'email' | 'phone' | 'whatsapp';

/** Row written to `public.leads` (snake_case = column names). */
export interface LeadInsert {
  lead_ref: string;
  idempotency_key: string | null;
  source: CalculatorLeadSource;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  request: string;
  locale: string;
  details: Record<string, unknown>;
  estimate_low: number | null;
  estimate_high: number | null;
  estimate_currency: string | null;
  preferred_contact: PreferredContact;
  consent_at: string;
  consent_version: string;
  ip_hash: string | null;
  user_agent: string | null;
  referrer: string | null;
  utm: Record<string, string> | null;
}

export interface LeadRef {
  id: string;
  leadRef: string;
}

export type InsertOutcome =
  | {ok: true; id: string}
  | {ok: false; conflict: 'idempotency_key' | 'lead_ref'}
  | {ok: false; conflict?: undefined; error: string};

export interface LeadsRepository {
  /** False when no persistence is wired (Supabase env missing). */
  isConfigured(): boolean;
  insert(row: LeadInsert): Promise<InsertOutcome>;
  findByIdempotencyKey(key: string): Promise<LeadRef | null>;
  /** Most recent lead for email+source created at/after `sinceMs`. */
  findRecent(email: string, source: LeadSource, sinceMs: number): Promise<LeadRef | null>;
  markEmail(id: string, result: {delivered: boolean; error?: string}): Promise<void>;
}

export interface OutgoingMail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}

export interface LeadMailer {
  isConfigured(): boolean;
  send(mail: OutgoingMail): Promise<{delivered: boolean}>;
}

export interface RateLimitResult {
  success: boolean;
  retryAfterSec?: number;
}

export interface RequestMeta {
  ip: string;
  /** `Host` / `X-Forwarded-Host` of this request */
  host: string | null;
  origin: string | null;
  referer: string | null;
  userAgent: string | null;
  /** true outside production: allows localhost origin/host variations */
  dev: boolean;
}

export interface SubmitDeps {
  repo: LeadsRepository;
  mailer: LeadMailer;
  now(): number;
  rateLimit(name: 'calculator' | 'calculator_email', id: string): Promise<RateLimitResult>;
  newLeadRef(nowMs: number): string;
  hashIp(ip: string): string;
  /** Run after the response (Next `after()`); tests pass a collector. */
  deferred(fn: () => Promise<void>): void;
  log?: {warn(...a: unknown[]): void; error(...a: unknown[]): void};
}

export interface SubmitInput {
  /** Parsed JSON body (route has already enforced the 64 KB limit). */
  body: unknown;
  meta: RequestMeta;
}

export type SubmitFailure =
  | {ok: false; status: 400; error: 'validation'; issues: {path: string; message: string}[]}
  | {ok: false; status: 403; error: 'origin'}
  | {ok: false; status: 413; error: 'too_large'}
  | {ok: false; status: 429; error: 'rate_limited'; retryAfterSec: number}
  | {ok: false; status: 503; error: 'unavailable'; retryable: true};

export interface SubmitSuccess {
  ok: true;
  status: 200;
  leadRef: string;
  duplicate?: true;
  /** saved in the database */
  persisted: boolean;
  /** notification email scheduled after the response */
  emailQueued: boolean;
  /** only set when the email was sent synchronously */
  emailDelivered?: boolean;
}

export type SubmitResult = SubmitSuccess | SubmitFailure;

export const MAX_BODY_BYTES = 64 * 1024;
export const MIN_FILL_MS = 3000;
export const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
export const CONSENT_VERSION = '2026-11-v1';
