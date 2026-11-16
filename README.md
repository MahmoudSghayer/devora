# devora.design

> **devora** — dev + aura. A bilingual (Arabic default / English) site that works as a sales machine for a studio building **websites · automation & AI agents · custom software**.

Arabic is the default locale (unprefixed `/`, RTL); English lives under `/en`. The site turns visitors into leads through three guided, option-based flows — a website cost estimator, an automation ROI calculator, and a custom-software discovery flow — all feeding one lead pipeline (database + email + admin).

**Stack:** Next.js 16 (App Router, `proxy.ts`, React 19.2) · TypeScript · Tailwind CSS v4 (`@theme` tokens) · next-intl · raw three.js (WebGL hero) · GSAP + ScrollTrigger · Lenis · Motion · Zod · Supabase (Postgres + RLS) · Anthropic Claude (chat widget) · Upstash Redis (rate limiting) · Nodemailer (Zoho SMTP) · Vitest · Playwright.

## Getting started

```bash
npm install
cp .env.example .env.local   # every integration degrades gracefully when unset
npm run dev                  # http://localhost:3000  (AR)  ·  /en (EN)
```

| Script | What it does |
|---|---|
| `npm run typecheck` · `npm run lint` | `tsc --noEmit`, ESLint |
| `npm test` | Vitest — pricing/estimator, ROI, discovery engines, lead service, email templates |
| `node tests/email-smtp.mjs` | real SMTP round-trip against a local catcher |
| `npm run build` · `npm start` | production build / server |
| `npm run test:e2e:calculators`, `npm run test:qa` | Playwright flows (all three calculators EN/AR) and page QA (overflow, console, a11y basics) — need a running server, see `docs/transformation/REPORT.md` |
| `npm run seed:kb` | seed the chat knowledge base |

CI (`.github/workflows/ci.yml`): typecheck → lint → unit tests → SMTP integration → build. See `docs/CI.md`.

## Product map

| Route | Purpose |
|---|---|
| `/` | 8 sections: hero (particle `< • >` mark) · value + proof · pillars · WhatsApp scenario simulator · selected work · three calculator cards · tech stack · CTA |
| `/services` | the three pillars (`#websites`, `#automation`, `#software`) + engagement models |
| `/estimate` | **Estimate your website** — goal → size → type → requirements → design → integrations → live indicative range → summary + form |
| `/automation-roi` | **Calculate your savings** — tasks → bucketed workload → labour cost → standardisation → ROI dashboard → summary + form |
| `/discuss` | **Discuss your system** — custom-software discovery → indicative starting range → summary + form |
| `/pricing` | how pricing works (one-time build + optional care plan) |
| `/work`, `/process`, `/about`, `/industries`, `/faq`, `/contact` | supporting pages (`/contact` opens with the three guided paths) |
| `/admin/*` | Supabase-auth admin: leads (source badge/filter, structured details), conversations, support, knowledge |

## Architecture notes

- **One pricing source:** `lib/pricing/config.ts` (currency ILS, `formatMoney`, estimator + ROI + discovery config, `PRICING_CONFIG_VERSION`). Engines are pure and unit-tested: `lib/estimator`, `lib/roi`, `lib/discuss`. Copy never hardcodes numbers (ICU params via `pricingParams`). See `docs/pricing-engine.md`, `docs/automation-roi.md`, `docs/discuss-flow.md`.
- **Lead pipeline:** `lib/leads` (`submitLead` with injectable repository/mailer; strict Zod envelope, honeypot, min fill time, same-origin check, rate limits, idempotency, **server-side recompute**, `after()` email, honest 503 when nothing can persist or send). Routes `/api/estimate`, `/api/automation-roi`, `/api/discuss`, `/api/contact`. Emails go to `CONTACT_TO` (fallback `ZOHO_SMTP_USER`). See `docs/leads.md` — **migration `supabase/migrations/0002_calculator_leads.sql` must be applied by the owner.**
- **Design system v2:** `docs/design-system.md` — glass/aura/spot utilities, tokens, motion primitives, no shadows, one `nav:` breakpoint, logical (RTL-safe) utilities.
- **WebGL:** `components/three` + `lib/three` — particle DevoraMark, lazy after idle, paused offscreen/hidden, DPR ≤ 1.5, context-loss safe, full dispose; static glow poster for phones / reduced motion / no WebGL.
- **i18n:** `messages/{ar,en}.json` in exact parity; client islands receive only the namespaces they use (`components/i18n/ScopedMessages`).
- **SEO:** `pageMetadata()` + JSON-LD components (`components/seo`), generated OG/Twitter images with Arabic (Cairo), sitemap with both locales.
- **Docs index:** `docs/transformation/` (research, audit, progress, report), `docs/strategy/` (positioning history — see its README note).

## Conventions

Server components by default; client islands only for interaction. Tokens only (no raw hex, no `box-shadow`), logical utilities (`ms-/me-/start-/end-`), `u-mono`/`u-track` on tracked text, every string in both locales, honest copy (no invented metrics, testimonials or clients — estimates are always labelled *indicative, not a quotation*).

## Deployment

Vercel (Git integration). Production env: Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), `ANTHROPIC_API_KEY`, Upstash (`UPSTASH_REDIS_REST_URL/TOKEN`), SMTP (`ZOHO_SMTP_USER/PASS`), `CONTACT_TO`. `LEADS_TEST_REPOSITORY=memory` is for local E2E only and is ignored in production.
