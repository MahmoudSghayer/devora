import {NextResponse, after} from 'next/server';
import {logEvent} from '@/lib/analytics';
import {isEmailConfigured, sendMail} from '@/lib/email/send';
import {getRequestIp, hashIp, rateLimit} from '@/lib/ratelimit';
import {generateLeadRef} from './ref';
import {resolveRepository} from './repository';
import {submitLead} from './service';
import {
  MAX_BODY_BYTES,
  type CalculatorLeadSource,
  type RequestMeta,
  type SubmitDeps,
} from './types';

// Shared HTTP wrapper used by /api/estimate, /api/automation-roi,
// /api/discuss and /api/contact: raw-size check (413) → JSON parse (400) → submitLead → status.

export function productionDeps(): SubmitDeps {
  return {
    repo: resolveRepository(),
    mailer: {
      isConfigured: isEmailConfigured,
      send: (m) => sendMail(m),
    },
    now: () => Date.now(),
    rateLimit: (name, id) => rateLimit(name, id),
    newLeadRef: generateLeadRef,
    hashIp,
    deferred: (fn) => after(fn),
  };
}

function metaFrom(request: Request): RequestMeta {
  const h = request.headers;
  return {
    ip: getRequestIp(request),
    host: h.get('x-forwarded-host') ?? h.get('host'),
    origin: h.get('origin'),
    referer: h.get('referer'),
    userAgent: h.get('user-agent'),
    dev: process.env.NODE_ENV !== 'production',
  };
}

const ANALYTICS: Partial<
  Record<CalculatorLeadSource, 'estimate_submitted' | 'roi_submitted' | 'discuss_submitted'>
> = {
  website_estimate: 'estimate_submitted',
  automation_roi: 'roi_submitted',
  software_discovery: 'discuss_submitted',
};

export async function handleLeadRequest(
  request: Request,
  source: CalculatorLeadSource,
  deps: SubmitDeps = productionDeps()
): Promise<NextResponse> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ok: false, error: 'too_large'}, {status: 413});
  }
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ok: false, error: 'too_large'}, {status: 413});
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ok: false, error: 'invalid_json'}, {status: 400});
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 400});
  }
  // The route fixes the source; a body naming another one is rejected.
  const claimed = (body as {source?: unknown}).source;
  if (claimed !== undefined && claimed !== source) {
    return NextResponse.json(
      {ok: false, error: 'validation', issues: [{path: 'source', message: 'wrong endpoint'}]},
      {status: 400}
    );
  }
  body = {...(body as object), source};

  const result = await submitLead({body, meta: metaFrom(request)}, deps);

  if (result.ok) {
    const {status, ok: _ok, ...rest} = result;
    void _ok;
    const event = ANALYTICS[source];
    if (event && !result.duplicate) {
      void logEvent(event, {
        locale: (body as {locale?: string}).locale ?? null,
        props: {leadRef: result.leadRef},
      });
    }
    return NextResponse.json({ok: true, ...rest}, {status});
  }
  const {status, ...rest} = result;
  const headers: Record<string, string> = {};
  if (result.status === 429) headers['Retry-After'] = String(result.retryAfterSec);
  if (result.status === 503) headers['Retry-After'] = '30';
  return NextResponse.json(rest, {status, headers});
}
