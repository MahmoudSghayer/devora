import {randomUUID} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {submitLead} from './service';
import {
  NOW,
  contactBody,
  discussBody,
  estimateBody,
  goodMeta,
  makeKit,
  roiBody,
} from './testkit';
import {estimateProject} from '@/lib/estimator/engine';
import {estimateDiscuss} from '@/lib/discuss/engine';

const run = (kit: ReturnType<typeof makeKit>, body: unknown, meta = goodMeta()) =>
  submitLead({body, meta}, kit.deps);

describe('submitLead — happy path', () => {
  it('persists, queues email via deferred, and marks email_delivered', async () => {
    const kit = makeKit();
    const res = await run(kit, estimateBody());
    expect(res).toMatchObject({ok: true, persisted: true, emailQueued: true});
    expect(kit.repo.rows).toHaveLength(1);
    expect(kit.sent).toHaveLength(0); // not sent until after the response
    expect(kit.repo.rows[0]!.email_delivered).toBe(false);
    await kit.flush();
    expect(kit.sent).toHaveLength(1);
    expect(kit.repo.rows[0]!.email_delivered).toBe(true);
    expect(kit.sent[0]!.replyTo).toBe('dana@example.com');
    expect(kit.sent[0]!.subject).toContain((res as {leadRef: string}).leadRef);
  });

  it('records email_error when the deferred send fails', async () => {
    const kit = makeKit();
    kit.state.mailFails = true;
    const res = await run(kit, roiBody());
    expect(res.ok).toBe(true);
    await kit.flush();
    expect(kit.repo.rows[0]!.email_delivered).toBe(false);
    expect(kit.repo.rows[0]!.email_error).toContain('smtp down');
  });

  it('accepts a contact lead and stores the message', async () => {
    const kit = makeKit();
    const res = await run(kit, contactBody());
    expect(res.ok).toBe(true);
    expect(kit.repo.rows[0]).toMatchObject({source: 'contact', request: 'Hello, I need a site.'});
  });
});

describe('server recompute', () => {
  it('ignores client-supplied totals', async () => {
    const kit = makeKit();
    const body = estimateBody({result: {low: 1, high: 2, subtotal: 1, total: 1}});
    const res = await run(kit, body);
    expect(res.ok).toBe(true);
    const row = kit.repo.rows[0]!;
    const truth = estimateProject(
      (body as {answers: Parameters<typeof estimateProject>[0]}).answers
    );
    expect(row.estimate_low).toBe(truth.low);
    expect(row.estimate_high).toBe(truth.high);
    expect(row.estimate_low).not.toBe(1);
    const details = row.details as {result: {low: number}; pricing_config_version: string};
    expect(details.result.low).toBe(truth.low);
    expect(details.pricing_config_version).toBeTruthy();
  });

  it('stores a server ROI snapshot', async () => {
    const kit = makeKit();
    await run(kit, roiBody({result: {savedHoursMonthly: 99999}}));
    const d = kit.repo.rows[0]!.details as {result: {savedHoursMonthly: number}};
    expect(d.result.savedHoursMonthly).toBeLessThan(99999);
    expect(d.result.savedHoursMonthly).toBeGreaterThan(0);
  });
});

describe('idempotency & dedupe', () => {
  it('same idempotency key returns same lead_ref with duplicate:true', async () => {
    const kit = makeKit();
    const body = estimateBody();
    const a = (await run(kit, body)) as {leadRef: string};
    const b = (await run(kit, body)) as {leadRef: string; duplicate?: boolean};
    expect(b.leadRef).toBe(a.leadRef);
    expect(b.duplicate).toBe(true);
    expect(kit.repo.rows).toHaveLength(1);
  });

  it('dedupes same email+source within 10 minutes (new key)', async () => {
    const kit = makeKit();
    const a = (await run(kit, estimateBody())) as {leadRef: string};
    const b = (await run(kit, estimateBody())) as {leadRef: string; duplicate?: boolean};
    expect(b.duplicate).toBe(true);
    expect(b.leadRef).toBe(a.leadRef);
    expect(kit.repo.rows).toHaveLength(1);
  });

  it('does not dedupe across different sources', async () => {
    const kit = makeKit();
    await run(kit, estimateBody({contact: {name: 'A', email: 'same@example.com', consent: true}}));
    const b = await run(kit, roiBody({contact: {name: 'A', email: 'same@example.com', consent: true}}));
    expect((b as {duplicate?: boolean}).duplicate).toBeUndefined();
    expect(kit.repo.rows).toHaveLength(2);
  });

  it('does not dedupe once the window has passed', async () => {
    const kit = makeKit();
    await run(kit, estimateBody());
    kit.repo.rows[0]!.created_at_ms = NOW - 11 * 60 * 1000;
    const b = await run(kit, estimateBody());
    expect((b as {duplicate?: boolean}).duplicate).toBeUndefined();
    expect(kit.repo.rows).toHaveLength(2);
  });
});

describe('bot defences', () => {
  it('honeypot: silent ok, nothing persisted or sent', async () => {
    const kit = makeKit();
    const res = await run(kit, estimateBody({website: 'http://spam.example'}));
    expect(res.ok).toBe(true);
    expect((res as {leadRef: string}).leadRef).toMatch(/^DV-/);
    await kit.flush();
    expect(kit.repo.rows).toHaveLength(0);
    expect(kit.sent).toHaveLength(0);
    expect(kit.limiterCalls).toHaveLength(0);
  });

  it('too-fast submission: silent ok, nothing persisted or sent', async () => {
    const kit = makeKit();
    const res = await run(kit, estimateBody({startedAtMs: NOW - 1000}));
    expect(res.ok).toBe(true);
    await kit.flush();
    expect(kit.repo.rows).toHaveLength(0);
    expect(kit.sent).toHaveLength(0);
  });

  it('calculators require startedAtMs', async () => {
    const kit = makeKit();
    const body = estimateBody();
    delete (body as {startedAtMs?: number}).startedAtMs;
    const res = await run(kit, body);
    expect(res).toMatchObject({ok: false, status: 400});
  });

  it('rejects a cross-origin request with 403', async () => {
    const kit = makeKit();
    const res = await run(kit, estimateBody(), goodMeta({origin: 'https://evil.example'}));
    expect(res).toMatchObject({ok: false, status: 403, error: 'origin'});
    expect(kit.repo.rows).toHaveLength(0);
  });

  it('rejects a request with no Origin/Referer in production', async () => {
    const kit = makeKit();
    const res = await run(kit, estimateBody(), goodMeta({origin: null}));
    expect(res).toMatchObject({status: 403});
  });

  it('falls back to Referer host', async () => {
    const kit = makeKit();
    const res = await run(
      kit,
      estimateBody(),
      goodMeta({origin: null, referer: 'https://devora.design/en/estimate'})
    );
    expect(res.ok).toBe(true);
  });

  it('allows localhost with a different port in dev only', async () => {
    const dev = goodMeta({host: 'localhost:3000', origin: 'http://localhost:3100', dev: true});
    expect((await run(makeKit(), estimateBody(), dev)).ok).toBe(true);
    const prod = {...dev, dev: false};
    expect((await run(makeKit(), estimateBody(), prod)).ok).toBe(false);
  });
});

describe('rate limiting', () => {
  it('returns 429 with retryAfter when the IP limit trips', async () => {
    const kit = makeKit();
    kit.state.limitIp = true;
    const res = await run(kit, estimateBody());
    expect(res).toMatchObject({ok: false, status: 429, retryAfterSec: 120});
    expect(kit.repo.rows).toHaveLength(0);
  });

  it('per-email cap trips independently', async () => {
    const kit = makeKit();
    kit.state.limitEmail = true;
    const res = await run(kit, estimateBody());
    expect(res).toMatchObject({ok: false, status: 429});
    expect(kit.limiterCalls).toEqual(['calculator', 'calculator_email']);
  });
});

describe('failure modes', () => {
  it('Supabase unconfigured → email sent synchronously', async () => {
    const kit = makeKit();
    kit.state.repoConfigured = false;
    const res = await run(kit, estimateBody());
    expect(res).toMatchObject({ok: true, persisted: false, emailDelivered: true});
    expect(kit.sent).toHaveLength(1);
    expect(kit.deferred).toHaveLength(0);
  });

  it('insert fails but SMTP works → ok via email, error logged', async () => {
    const kit = makeKit();
    kit.repo.failInserts = true;
    const res = await run(kit, estimateBody());
    expect(res).toMatchObject({ok: true, persisted: false, emailDelivered: true});
    expect(kit.errors.length).toBeGreaterThan(0);
  });

  it('503 retryable when persistence AND email both fail', async () => {
    const kit = makeKit();
    kit.repo.failInserts = true;
    kit.state.mailFails = true;
    const res = await run(kit, estimateBody());
    expect(res).toEqual({ok: false, status: 503, error: 'unavailable', retryable: true});
  });

  it('503 when neither persistence nor email is configured', async () => {
    const kit = makeKit();
    kit.state.repoConfigured = false;
    kit.state.mailConfigured = false;
    const res = await run(kit, estimateBody());
    expect(res).toMatchObject({ok: false, status: 503, retryable: true});
  });
});

describe('strict schema', () => {
  it('rejects unknown top-level keys', async () => {
    const res = await run(makeKit(), estimateBody({extra: 1}));
    expect(res).toMatchObject({ok: false, status: 400, error: 'validation'});
  });

  it('rejects unknown keys inside answers and contact', async () => {
    expect((await run(makeKit(), estimateBody({answers: {types: ['business'], total: 5}}))).ok).toBe(false);
    expect(
      (await run(makeKit(), estimateBody({contact: {name: 'A', email: 'a@b.co', consent: true, website: 'x'}}))).ok
    ).toBe(false);
  });

  it('requires consent: true and a valid email', async () => {
    expect((await run(makeKit(), estimateBody({contact: {name: 'A', email: 'a@b.co', consent: false}}))).ok).toBe(false);
    expect((await run(makeKit(), estimateBody({contact: {name: 'A', email: 'nope', consent: true}}))).ok).toBe(false);
  });

  it('rejects oversize fields and arrays', async () => {
    const big = 'x'.repeat(5000);
    expect((await run(makeKit(), contactBody({answers: {message: big}}))).ok).toBe(false);
    const tl = Array.from({length: 100}, (_, i) => ({step: 's', tsMs: i}));
    expect((await run(makeKit(), estimateBody({timeline: tl}))).ok).toBe(false);
  });

  it('rejects a non-uuid idempotency key', async () => {
    expect((await run(makeKit(), estimateBody({idempotencyKey: 'abc'}))).ok).toBe(false);
  });

  it('rejects wrong answer shape for the source', async () => {
    const res = await run(makeKit(), roiBody({answers: {types: ['business']}}));
    expect(res).toMatchObject({ok: false, status: 400});
  });

  it('validates fresh keys do not collide', () => {
    expect(randomUUID()).not.toBe(randomUUID());
  });
});

describe('software_discovery', () => {
  it('recomputes server-side and ignores client totals', async () => {
    const kit = makeKit();
    const body = discussBody({result: {startingLow: 1, startingHigh: 2}});
    const res = await run(kit, body);
    expect(res).toMatchObject({ok: true, persisted: true});
    const row = kit.repo.rows[0]!;
    const truth = estimateDiscuss(
      (body as {answers: Parameters<typeof estimateDiscuss>[0]}).answers
    );
    expect(row.source).toBe('software_discovery');
    expect(row.estimate_low).toBe(truth.startingLow);
    expect(row.estimate_high).toBe(truth.startingHigh);
    expect(row.estimate_low).not.toBe(1);
    expect(row.estimate_currency).toBe(truth.estimate.currency);
    expect(row.details).toMatchObject({
      result: {startingLow: truth.startingLow, startingHigh: truth.startingHigh},
      notes: 'We run 3 clinics and need one system.',
    });
  });

  it('emails the team with the free text and replies to the visitor', async () => {
    const kit = makeKit();
    await run(kit, discussBody());
    await kit.flush();
    expect(kit.sent).toHaveLength(1);
    const mail = kit.sent[0]!;
    expect(mail.subject).toMatch(/^\[Discuss DV-/);
    expect(mail.replyTo).toBe('noa@example.com');
    expect(mail.text).toContain('We run 3 clinics and need one system.');
  });

  it('is idempotent by key and by email within the window', async () => {
    const kit = makeKit();
    const body = discussBody();
    const first = await run(kit, body);
    const again = await run(kit, body);
    expect(again).toMatchObject({ok: true, duplicate: true});
    expect((again as {leadRef: string}).leadRef).toBe((first as {leadRef: string}).leadRef);
    const fresh = await run(kit, discussBody());
    expect(fresh).toMatchObject({ok: true, duplicate: true});
    expect(kit.repo.rows).toHaveLength(1);
  });

  it('honeypot: silent ok, nothing persisted or sent', async () => {
    const kit = makeKit();
    const res = await run(kit, discussBody({website: 'http://spam.example'}));
    expect(res).toMatchObject({ok: true, persisted: false});
    await kit.flush();
    expect(kit.repo.rows).toHaveLength(0);
    expect(kit.sent).toHaveLength(0);
  });

  it('503 retryable when persistence AND email both fail', async () => {
    const kit = makeKit();
    kit.repo.failInserts = true;
    kit.state.mailFails = true;
    const res = await run(kit, discussBody());
    expect(res).toMatchObject({ok: false, status: 503, retryable: true});
  });

  it('is strict: unknown answer keys, bad options, empty purpose and missing startedAtMs are rejected', async () => {
    const good = discussBody().answers;
    expect((await run(makeKit(), discussBody({answers: {...good, total: 5}}))).ok).toBe(false);
    expect((await run(makeKit(), discussBody({answers: {...good, users: 'everyone'}}))).ok).toBe(false);
    expect((await run(makeKit(), discussBody({answers: {...good, purpose: []}}))).ok).toBe(false);
    expect((await run(makeKit(), discussBody({answers: {...good, note: 'free text'}}))).ok).toBe(false);
    expect((await run(makeKit(), discussBody({startedAtMs: undefined}))).status).toBe(400);
  });
});
