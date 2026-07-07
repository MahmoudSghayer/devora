# 06 — Implementation Roadmap

*Prioritized order for maximum impact. All content below is already wired and building green; this is the sequence in which it delivers value and the real data still needed.*

## Priority 1 — Shipped: what visitors see first
The pages that carry the most traffic and first impressions.

- ✅ Home rewrite + new teasers (process, industries, Care Plan, FAQ).
- ✅ Services with the **AI & Automation** discipline + engagement models.
- ✅ Strategy docs 01 (audit) + 02 (positioning).
- **Do next (real data):** confirm the two testimonial attributions or replace them; supply a team photo.

## Priority 2 — Shipped: the pages that convert & build credibility

- ✅ **Pricing** page (project tiers + Care Plan + included + FAQ).
- ✅ **About** page (story, difference, values, crew).
- ✅ **Case-study detail** pages (`/work/zawiya`, `/work/aldarb`) with challenge/approach/outcome.
- **Do next (real data):** finalize the pricing figures (or keep custom-quote framing); confirm case-study wording with each client.

## Priority 3 — Shipped: depth, trust & discovery

- ✅ **Process**, **Industries**, **FAQ** pages + home teasers.
- ✅ Full transformation + enhancement + roadmap docs.
- ✅ Arabic transcreation across all new content (native review still recommended).
- **Do next:** native-speaker QA pass on the new Arabic strings.

---

## Real-data checklist (`TODO(devora)`)

Everything grep-able via `TODO(devora)`:

| Item | Where |
|---|---|
| ~~Pricing figures~~ ✅ set — Launch $3,500 · Studio $9,500 · Care Plan $1,200/mo (market-researched) | `messages/{en,ar}.json` → `pricing.m1_p`, `m2_p`, `m3_p` |
| Testimonial quotes + attributions | `messages/{en,ar}.json` → `home.t1_*`, `t2_*` |
| Social URLs | `lib/site.ts` → `SOCIALS` |
| Contact email | `lib/site.ts` → `SITE.email` |
| Team photo | `components/home/TeamSection.tsx`, `components/about/Crew.tsx` |
| Book-a-call calendar link | `contact.a4_d` copy (wire a real scheduler) |
| Contact form delivery | `app/api/contact/route.ts` (Resend/Postmark/SES or form service) |
| Case-study wording confirmation | `lib/site.ts` → `CASES[].en/.ar` |
| Arabic native-review pass | all new `messages/ar.json` keys |

## Recommended follow-ups (beyond content)

- Native Arabic QA on the ~180 new AR strings.
- Real proof when available: client logos, named testimonials, outcome metrics (only if true).
- Wire the "book a call" scheduler and the contact form destination.
- Update the root `README.md` §12.1 table (it still references the old `services.k1_p` pricing keys — now `pricing.m1_p`).
- Consider individual service detail pages later if SEO demand appears (stay curated, not barq's 21 thin pages).

---

## Verification status (this delivery)

- ✅ `npm run build` — green; 29 routes prerendered, EN + AR, incl. dynamic case studies.
- ✅ `npx tsc --noEmit` — clean.
- ✅ `npm run lint` — clean.
- ✅ EN/AR key parity — 320 / 320, none missing.
- ✅ All new routes HTTP 200 (both locales); `/ar/*` render `dir="rtl"`; no console errors.
- ✅ No `shadow-*`; theme tokens only; single `nav:` breakpoint.
