# Devora — Competitor-Informed Strategy & Content

A senior-agency-style analysis of the competitor **web.barq.agency**, translated into a stronger, original content and site-architecture strategy for **devora.design** — then wired into the live site.

**This was not a copy job.** barq is mined for *structural* ideas (subscription model, service breadth, pricing transparency, industry targeting); every idea is re-expressed at a higher altitude for Devora's premium, bilingual (EN/AR) positioning. No competitor text is reused, and no metrics, testimonials or clients are invented.

## Documents

| # | Doc | What's inside |
|---|-----|---------------|
| 01 | [Audit](01-audit.md) | Full barq.agency inventory: sitemap, service taxonomy, pricing model, messaging, and a SWOT read for Devora. |
| 02 | [Positioning](02-positioning.md) | Devora vs barq, ICP, differentiation, messaging pillars, brand voice. |
| 03 | [Content transformation](03-transformation.md) | Per section: existing purpose → improved version → new copy → better headline → better CTA. |
| 04 | [Enhancement plan](04-enhancement-plan.md) | New pages/sections, the AI & Automation service, the Care Plan, pricing + industries, lead magnets, UX flow, IA. |
| 05 | [Final content](05-final-content.md) | The production-ready copy (EN, with AR) now live in the site. |
| 06 | [Roadmap](06-roadmap.md) | Prioritized 1st / 2nd / 3rd implementation order. |

## What shipped in the codebase

- **New pages** (EN + AR): `/pricing`, `/about`, `/process`, `/industries`, `/faq`, and dynamic case studies `/work/[slug]`.
- **Expanded** Home (process / industries / Care Plan / FAQ teasers), Services (5th discipline: **AI & Automation**; engagement models), Work (case-study detail links), Contact ("book a call").
- **Content** in `messages/en.json` + `messages/ar.json` (320 keys each, in parity); case narratives in `lib/site.ts`.
- Verified: production build green (29 routes, both locales), TypeScript + ESLint clean, all routes HTTP 200, RTL correct.

> **Honesty guardrail.** Real business data is flagged `TODO(devora)` — pricing figures, testimonial attributions, social URLs, contact email, team photo. See [06-roadmap.md](06-roadmap.md).
