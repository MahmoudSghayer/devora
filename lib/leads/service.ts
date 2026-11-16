import {estimateProject} from '@/lib/estimator/engine';
import {computeRoi} from '@/lib/roi/engine';
import {estimateDiscuss} from '@/lib/discuss/engine';
import {PRICING_CONFIG_VERSION} from '@/lib/pricing/config';
import {
  automationRoiEmail,
  contactEmail,
  softwareDiscoveryEmail,
  websiteEstimateEmail,
  type BuiltEmail,
  type CalcEmailBase,
} from '@/lib/email/templates';
import {envelopeSchema, type Envelope} from './schema';
import {
  CONSENT_VERSION,
  DEDUPE_WINDOW_MS,
  MIN_FILL_MS,
  type LeadInsert,
  type RequestMeta,
  type SubmitDeps,
  type SubmitInput,
  type SubmitResult,
} from './types';

// The lead pipeline. Everything with side effects is injected through `deps`,
// so the whole thing is unit-testable without network, DB or SMTP.
//
// Order (strict):
//   envelope (zod, strict) → honeypot → min fill time → same-origin →
//   rate limits (IP, email) → idempotency / 10-min dedupe →
//   SERVER recompute → lead_ref → insert → email.

const MAX_REF_ATTEMPTS = 4;

function silentOk(deps: SubmitDeps): SubmitResult {
  // Plausible success that persists nothing and sends nothing.
  return {
    ok: true,
    status: 200,
    leadRef: deps.newLeadRef(deps.now()),
    persisted: false,
    emailQueued: true,
  };
}

/** Rate-limit key for an address: lowercase, strip +tag (and dots for gmail) so
 *  plus-addressing can't mint unlimited quotas. */
export function normaliseEmailKey(email: string): string {
  const [local = '', domain = ''] = email.toLowerCase().split('@');
  const base = local.split('+')[0];
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
  return `${isGmail ? base.replace(/\./g, '') : base}@${domain}`;
}

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/;
const stripPort = (h: string) => h.replace(/:\d+$/, '');

/** Same-origin check: Origin (else Referer) host must equal the request Host. */
export function isSameOrigin(meta: RequestMeta): boolean {
  const claimed = hostOf(meta.origin) ?? hostOf(meta.referer);
  const host = meta.host?.toLowerCase() ?? null;
  if (!claimed || !host) return meta.dev; // non-browser clients only in dev
  if (claimed === host) return true;
  return meta.dev && LOCAL.test(stripPort(claimed)) && LOCAL.test(stripPort(host));
}

function summaryRequest(env: Envelope, computed: Computed): string {
  switch (env.source) {
    case 'contact':
      return env.answers.message;
    case 'website_estimate':
      return `Website estimate: ${env.answers.types.join(', ')}${
        computed.kind === 'estimate' ? ` — ${computed.result.low}–${computed.result.high} ${computed.result.currency}` : ''
      }${env.answers.problem ? `\n${env.answers.problem}` : ''}`;
    case 'software_discovery':
      return `Software discovery: ${env.answers.purpose.join(', ')}${
        computed.kind === 'discuss'
          ? ` — from ${computed.result.startingLow}–${computed.result.startingHigh} ${computed.result.estimate.currency}`
          : ''
      }${env.contact.notes ? `\n${env.contact.notes}` : ''}`;
    case 'automation_roi':
      return `Automation ROI: ${env.answers.tasks.length} task type(s)${
        computed.kind === 'roi'
          ? ` — ~${Math.round(computed.result.savedHoursMonthly)} h/month saved`
          : ''
      }`;
  }
}

type Computed =
  | {kind: 'estimate'; result: ReturnType<typeof estimateProject>}
  | {kind: 'roi'; result: ReturnType<typeof computeRoi>}
  | {kind: 'discuss'; result: ReturnType<typeof estimateDiscuss>}
  | {kind: 'contact'};

function compute(env: Envelope): Computed {
  if (env.source === 'website_estimate')
    return {kind: 'estimate', result: estimateProject(env.answers)};
  if (env.source === 'automation_roi') return {kind: 'roi', result: computeRoi(env.answers)};
  if (env.source === 'software_discovery')
    return {kind: 'discuss', result: estimateDiscuss(env.answers)};
  return {kind: 'contact'};
}

function buildEmail(env: Envelope, computed: Computed, leadRef: string, nowMs: number): BuiltEmail {
  const base: CalcEmailBase = {
    leadRef,
    contact: env.contact,
    locale: env.locale,
    submittedAt: new Date(nowMs).toISOString(),
    timeline: env.timeline,
  };
  if (env.source === 'website_estimate' && computed.kind === 'estimate')
    return websiteEstimateEmail({
      ...base,
      answers: env.answers,
      result: computed.result,
      pricingConfigVersion: PRICING_CONFIG_VERSION,
    });
  if (env.source === 'automation_roi' && computed.kind === 'roi')
    return automationRoiEmail({
      ...base,
      answers: env.answers,
      result: computed.result,
      pricingConfigVersion: PRICING_CONFIG_VERSION,
    });
  if (env.source === 'software_discovery' && computed.kind === 'discuss')
    return softwareDiscoveryEmail({
      ...base,
      answers: env.answers,
      result: computed.result,
      pricingConfigVersion: PRICING_CONFIG_VERSION,
    });
  if (env.source === 'contact')
    return contactEmail({...base, message: env.answers.message, budget: env.answers.budget});
  throw new Error('unreachable: source/result mismatch');
}

/** Mark an email as a possible resubmission of an earlier lead (subject + body). */
function flagResubmission(mail: BuiltEmail, previousRef: string): BuiltEmail {
  const note = `Possible resubmission of ${previousRef} (same email and form within 10 minutes) — compare the answers.`;
  return {
    ...mail,
    subject: `[Possible resubmission of ${previousRef}] ${mail.subject}`,
    text: `${note}\n\n${mail.text}`,
    html: `<p style="margin:0 0 16px;padding:10px 14px;border:1px solid #c9a227;border-radius:8px;font-family:sans-serif;font-size:14px">${note}</p>${mail.html}`,
  };
}

function buildRow(
  env: Envelope,
  computed: Computed,
  leadRef: string,
  nowMs: number,
  deps: SubmitDeps,
  meta: RequestMeta,
  possibleDuplicateOf: string | null = null
): LeadInsert {
  let low: number | null = null;
  let high: number | null = null;
  let currency: string | null = null;
  if (computed.kind === 'estimate') {
    low = computed.result.low;
    high = computed.result.high;
    currency = computed.result.currency;
  } else if (computed.kind === 'roi') {
    // ROI has no range: store the one-time implementation cost in both.
    low = high = computed.result.implementationCost;
    currency = computed.result.currency;
  } else if (computed.kind === 'discuss') {
    low = computed.result.startingLow;
    high = computed.result.startingHigh;
    currency = computed.result.estimate.currency;
  }
  return {
    lead_ref: leadRef,
    idempotency_key: env.idempotencyKey ?? null,
    source: env.source,
    name: env.contact.name,
    email: env.contact.email,
    phone: env.contact.phone ?? null,
    company: env.contact.businessName ?? null,
    request: summaryRequest(env, computed),
    locale: env.locale,
    details: {
      answers: env.answers,
      result: computed.kind === 'contact' ? null : computed.result,
      pricing_config_version: PRICING_CONFIG_VERSION,
      timeline: env.timeline,
      notes: env.contact.notes ?? null,
      started_at_ms: env.startedAtMs ?? null,
      possibleDuplicateOf,
    },
    estimate_low: low,
    estimate_high: high,
    estimate_currency: currency,
    preferred_contact: env.contact.preferredContact,
    consent_at: new Date(nowMs).toISOString(),
    consent_version: CONSENT_VERSION,
    ip_hash: meta.ip ? deps.hashIp(meta.ip) : null,
    user_agent: meta.userAgent ? meta.userAgent.slice(0, 300) : null,
    referrer: meta.referer ? meta.referer.slice(0, 500) : null,
    utm: env.utm ?? null,
  };
}

export async function submitLead(input: SubmitInput, deps: SubmitDeps): Promise<SubmitResult> {
  const log = deps.log ?? console;
  const {meta} = input;
  const nowMs = deps.now();

  // 1. envelope (strict) ----------------------------------------------------
  const parsed = envelopeSchema.safeParse(input.body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: 'validation',
      issues: parsed.error.issues.slice(0, 10).map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    };
  }
  const env = parsed.data;

  // 2. honeypot -------------------------------------------------------------
  if (env.website && env.website.trim() !== '') {
    log.warn('[leads] honeypot tripped — dropping silently');
    return silentOk(deps);
  }

  // 3. minimum fill time (a human needs more than a few seconds) ------------
  if (env.startedAtMs !== undefined) {
    const elapsed = nowMs - env.startedAtMs;
    // elapsed < 0 means the visitor's clock is ahead of ours: treat as unknown
    // (never penalise skew). A genuinely too-fast submit gets an HONEST
    // retryable 429 instead of a fake success, so a real visitor whose clock is
    // slightly off just retries a few seconds later and is never silently lost.
    if (elapsed >= 0 && elapsed < MIN_FILL_MS) {
      log.warn('[leads] submitted too fast — asking to retry', {elapsed});
      return {
        ok: false,
        status: 429,
        error: 'rate_limited',
        retryAfterSec: Math.ceil((MIN_FILL_MS - elapsed) / 1000) + 1,
      };
    }
  } else if (env.source !== 'contact') {
    // Calculators always report when they started; absence means a script.
    return {
      ok: false,
      status: 400,
      error: 'validation',
      issues: [{path: 'startedAtMs', message: 'required'}],
    };
  }

  // 4. same-origin ----------------------------------------------------------
  if (!isSameOrigin(meta)) return {ok: false, status: 403, error: 'origin'};

  // 5. rate limits (IP, then email) ----------------------------------------
  const ipRl = await deps.rateLimit('calculator', meta.ip || 'unknown');
  if (!ipRl.success)
    return {ok: false, status: 429, error: 'rate_limited', retryAfterSec: ipRl.retryAfterSec ?? 3600};
  const mailRl = await deps.rateLimit('calculator_email', normaliseEmailKey(env.contact.email));
  if (!mailRl.success)
    return {ok: false, status: 429, error: 'rate_limited', retryAfterSec: mailRl.retryAfterSec ?? 3600};

  const repo = deps.repo;
  const persistenceOn = repo.isConfigured();
  let possibleDuplicateOf: string | null = null;

  // 6. idempotency + short-window dedupe -----------------------------------
  if (persistenceOn) {
    try {
      if (env.idempotencyKey) {
        const existing = await repo.findByIdempotencyKey(env.idempotencyKey);
        if (existing)
          return {ok: true, status: 200, leadRef: existing.leadRef, duplicate: true, persisted: true, emailQueued: false};
      }
      // Same email + source within the window but a DIFFERENT idempotency key is
      // a resubmission with possibly changed answers: store it and email it as
      // normal, flagged — never return (or suppress) another submission's ref.
      const recent = await repo.findRecent(env.contact.email, env.source, nowMs - DEDUPE_WINDOW_MS);
      if (recent) possibleDuplicateOf = recent.leadRef;
    } catch (err) {
      // A failed lookup must not lose the lead; carry on (insert is still
      // protected by the unique indexes).
      log.error('[leads] duplicate lookup failed:', err);
    }
  }

  // 7. server recompute — client totals are never trusted -------------------
  const computed = compute(env);

  // 8–9. lead_ref + insert --------------------------------------------------
  let leadRef = deps.newLeadRef(nowMs);
  let leadId: string | null = null;
  if (persistenceOn) {
    for (let attempt = 0; attempt < MAX_REF_ATTEMPTS; attempt++) {
      let outcome;
      try {
        outcome = await repo.insert(buildRow(env, computed, leadRef, nowMs, deps, meta, possibleDuplicateOf));
      } catch (err) {
        log.error('[leads] insert threw:', err);
        break;
      }
      if (outcome.ok) {
        leadId = outcome.id;
        break;
      }
      if (outcome.conflict === 'idempotency_key' && env.idempotencyKey) {
        const existing = await repo.findByIdempotencyKey(env.idempotencyKey).catch(() => null);
        if (existing)
          return {ok: true, status: 200, leadRef: existing.leadRef, duplicate: true, persisted: true, emailQueued: false};
        break;
      }
      if (outcome.conflict === 'lead_ref') {
        leadRef = deps.newLeadRef(nowMs);
        continue;
      }
      log.error('[leads] insert failed:', outcome);
      break;
    }
  }

  let mail = buildEmail(env, computed, leadRef, nowMs);
  if (possibleDuplicateOf) mail = flagResubmission(mail, possibleDuplicateOf);

  // 10a. saved → email after the response ----------------------------------
  if (leadId) {
    const id = leadId;
    deps.deferred(async () => {
      let delivered = false;
      let error: string | undefined;
      try {
        ({delivered} = await deps.mailer.send(mail));
        if (!delivered) error = 'smtp_not_configured';
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        log.error('[leads] email failed:', err);
      }
      try {
        await repo.markEmail(id, {delivered, error});
      } catch (err) {
        log.error('[leads] markEmail failed:', err);
      }
    });
    return {ok: true, status: 200, leadRef, persisted: true, emailQueued: true};
  }

  // 10b. not saved → email is the only record: send synchronously ----------
  if (deps.mailer.isConfigured()) {
    try {
      const {delivered} = await deps.mailer.send(mail);
      if (delivered)
        return {ok: true, status: 200, leadRef, persisted: false, emailQueued: false, emailDelivered: true};
      log.error('[leads] email reported not delivered');
    } catch (err) {
      log.error('[leads] sync email failed:', err);
    }
  }
  log.error('[leads] neither persistence nor email succeeded', {persistenceOn, leadRef});
  return {ok: false, status: 503, error: 'unavailable', retryable: true};
}
