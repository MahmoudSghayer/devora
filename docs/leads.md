# Lead pipeline (calculators + contact)

Four public endpoints feed one service, `submitLead` (`lib/leads/service.ts`):

| Endpoint | `source` | Answers schema |
|---|---|---|
| `POST /api/estimate` | `website_estimate` | `estimatorAnswersSchema` (lib/estimator/schema) |
| `POST /api/automation-roi` | `automation_roi` | `roiAnswersSchema` (lib/roi/schema) |
| `POST /api/discuss` | `software_discovery` | `discussAnswersSchema` (lib/discuss/schema); free text "Anything else we should know?" travels as `contact.notes` |
| `POST /api/contact` | `contact` | `{message, budget?}` |

The chat widget keeps using `POST /api/lead` (source `chat`, unchanged contract except real failure statuses).

## Architecture

`route.ts` -> `lib/leads/http.ts` (`handleLeadRequest`: 64 KB raw-size check -> JSON parse -> source check) -> `submitLead(input, deps)`.

`submitLead` pipeline, strict order:

1. strict zod envelope (`lib/leads/schema.ts`) -> 400
2. honeypot `website` non-empty -> **silent ok**, nothing persisted/sent
3. minimum fill time (`startedAtMs` >= 3 s old; required for calculators) -> silent ok
4. same-origin (Origin, else Referer, host must equal request Host; localhost any-port in dev) -> 403
5. rate limit: `calculator` 5/h per IP, then `calculator_email` 3/h per email (fail-open when Upstash is unset) -> 429 + `Retry-After`
6. idempotency (client UUID) and same email+source dedupe within 10 min -> existing `leadRef`, `duplicate:true`
7. **server recompute** with `estimateProject` / `computeRoi` / `estimateDiscuss` (discovery stores `startingLow/High` in `estimate_low/high`, full result in `details.result`); client totals are never read (a `result` key is accepted and discarded)
8. generate `lead_ref` (`DV-YYMM-XXXX`, retried on collision), insert
9. email: if the insert succeeded, sent in `after()` and `email_delivered` / `email_error` updated; if Supabase is unconfigured or the insert failed, sent **synchronously**
10. both persistence and email failed (or neither configured) -> **503 retryable**, never a fake success

All side effects are injected (`SubmitDeps`: repo, mailer, now, rateLimit, newLeadRef, hashIp, deferred), see `lib/leads/testkit.ts`.

Storage: `public.leads` (migration `0002_calculator_leads.sql`). `details` jsonb holds `{answers, result, pricing_config_version, timeline, notes, started_at_ms}`. For ROI leads `estimate_low = estimate_high = implementationCost`.

Emails go to `CONTACT_TO` (fallback `ZOHO_SMTP_USER`), Reply-To = visitor email. Subjects: `[Estimate DV-...] Name — ₪X–₪Y`, `[ROI DV-...] Name — N h/mo · ₪X/mo`, `[Contact DV-...] Name`.

## Route contracts

Request (all three; `Content-Type: application/json`, body <= 64 KB, same-origin):

```jsonc
{
  "idempotencyKey": "uuid",          // required for calculators, optional for contact; one per calculator session
  "locale": "en" | "ar",             // default "en"
  "startedAtMs": 1731664800000,       // epoch ms the visitor started; REQUIRED for calculators, optional for contact (>= 3 s before submit)
  "contact": {
    "name": "string 1-120",
    "businessName": "string <=160 (optional)",
    "email": "valid email <=254",
    "phone": "string <=40 (optional)",
    "notes": "string <=2000 (optional)",
    "preferredContact": "email" | "phone" | "whatsapp",   // default "email"
    "consent": true                                        // literal true, REQUIRED (incl. contact)
  },
  "answers": { /* per source, strict: unknown keys rejected */ },
  "timeline": [{"step": "string <=64", "tsMs": 0}],       // <= 60 entries, default []
  "utm": {"utm_source": "..."},                           // optional, <= 10 keys
  "website": "",                                          // HONEYPOT: render a hidden empty input with this name; never fill
  "result": {}                                            // optional, IGNORED (server recomputes)
}
```
`source` is implied by the endpoint (a different value gives 400). Contact answers: `{"message": "1-4000", "budget": "<=120 optional"}`.

Responses:

| Status | Body |
|---|---|
| 200 | `{ok:true, leadRef, persisted:boolean, emailQueued:boolean, duplicate?:true, emailDelivered?:boolean}` |
| 400 | `{ok:false, error:"validation", issues:[{path,message}]}` or `{ok:false, error:"invalid_json"}` |
| 403 | `{ok:false, error:"origin"}` |
| 413 | `{ok:false, error:"too_large"}` |
| 429 | `{ok:false, error:"rate_limited", retryAfterSec}` + `Retry-After` header |
| 503 | `{ok:false, error:"unavailable", retryable:true}` + `Retry-After: 30` |

A 200 for a bot (honeypot / too fast) looks like a normal success with a fake `leadRef`. The UI must treat only `ok:true` as success and keep the form state on 429/503 so the visitor can retry (reuse the same `idempotencyKey`).

`POST /api/lead` (chat): unchanged request; now 429 includes `Retry-After`, 503 `{ok:false,error:"unavailable",retryable:true}` when the lead could be neither saved nor emailed. Success: `{ok:true, delivered, queued?, leadId?}`; the AI summary is generated in `after()`.

Admin: `GET /api/admin/leads?status=&source=&q=`; `PATCH /api/admin/leads/:id` `{status}` -> 200 / 400 invalid id / 404 / 422 / 500 (errors are shown in the UI).

## Environment

See `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (persistence), `ZOHO_SMTP_USER/PASS/HOST/PORT` (+ optional `ZOHO_SMTP_SECURE`), `CONTACT_TO` (destination), `UPSTASH_REDIS_REST_URL/TOKEN` (rate limits), `LEADS_TEST_REPOSITORY=memory` (E2E only: honoured only when `NODE_ENV !== 'production'` and `VERCEL` is unset).

## OWNER ACTION: apply the migration in production

`supabase/migrations/0002_calculator_leads.sql` is committed but **not applied**. Run it once in the Supabase SQL editor (or `supabase db push`). It is idempotent, adds columns/indexes to `leads` and backfills existing rows as `source='chat'`. Until it is applied, calculator inserts fail and the service falls back to email-only (still delivered; `persisted:false`), and the admin source filter/counters show nothing. Apply it **before** deploying.

## Verification checklist

- [ ] migration applied; `select source, count(*) from leads group by 1` shows `chat` for old rows
- [ ] `npx vitest run`, `npx tsc --noEmit`, `npx eslint` green; `node tests/email-smtp.mjs` passes
- [ ] submit each calculator in production: row in `leads` with `details`, email arrives at `CONTACT_TO` with Reply-To = visitor, `email_delivered=true`
- [ ] resubmit same session: same `leadRef`, `duplicate:true`, no second row/email
- [ ] 6th submission within an hour from one IP gives 429 (Upstash configured)
- [ ] admin /admin/leads: source badge, filters, search, detail panel, copy as text, status change error surfacing

## Failure modes

| Situation | Behaviour |
|---|---|
| Supabase unset/down, SMTP ok | email sent synchronously, 200 `persisted:false` |
| Supabase ok, SMTP down | 200; `email_delivered=false`, `email_error` recorded (visible in admin); no email until retried manually |
| Both fail / both unset | 503 retryable, logged with `[leads]` prefix |
| Upstash unset or erroring | limiter fails open |
| Duplicate lookup errors | logged, insert still protected by unique indexes |
| Missing Origin/Referer | 403 in production (allowed in dev) |

## Software discovery email and admin

`softwareDiscoveryEmail` (`lib/email/templates.ts`): subject `[Discuss DV-…] Name — ₪X–₪Y`, Reply-To the visitor, visitor free text shown first and escaped, then the indicative starting range, budget fit, weeks, maintenance, assumptions, chosen options (English labels in `lib/leads/discussLabels.ts`) and the raw answers. All calculator and contact emails render `contact.notes` as "Visitor notes". Admin lists a `Software discovery` source badge/filter and renders the answers structurally; the overview counts leads by source. Analytics event: `discuss_submitted`.

Packages (Launch/Studio/Growth) were retired: the chat assistant points to `/estimate`, `/automation-roi` and `/discuss` and only quotes the care-plan monthly range. The `recommended_package` column is kept but unused.
