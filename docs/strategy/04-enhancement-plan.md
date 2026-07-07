# 04 — Website Enhancement Plan

*Phase 3 deliverable. New sections, services, offers, lead magnets, positioning angles, and the target information architecture — all now implemented.*

## 1. Information architecture

**Primary nav (lean):** Work · Services · Pricing · About · Contact — plus the *Start a project* CTA. (Home lives on the logo.)

**Footer / secondary:** Process · Industries · FAQ · Case studies · Social · Contact.

```
/                      Home (hero → services → process → work → industries → care plan → testimonials → team → FAQ → CTA)
/work                  Work listing → detail links
/work/[slug]           Case study: overview → challenge → approach → outcome  [NEW]
/services              5 disciplines → process → engagement models → CTA
/pricing               Project tiers + Care Plan → included → pricing FAQ      [NEW]
/about                 Story → difference → values → crew                       [NEW]
/process               5 moves in depth (+ "what you get")                      [NEW]
/industries            6 verticals                                              [NEW]
/faq                   4 grouped question sets                                  [NEW]
/contact               Form + aside (+ book-a-call)
```

## 2. New services (adopted from barq, elevated)

**AI & Automation** is now Devora's **5th discipline** (`common.svc.s5`, services `sb5`/`d51–d54`):
- AI chatbots & assistants — 24/7 answers + lead capture.
- Workflow automation — the busywork runs itself.
- Integrations & data — wired into existing tools.
- Custom AI tools — bespoke assistants and internal tooling.

Framed as **engineering-led** (plays to the "dev"), not a feature list.

## 3. New offer — the Care Plan (recurring revenue)

barq's best idea (no-setup-fee monthly subscription) reframed as a **premium retainer**:
- Dedicated senior squad · monthly roadmap · updates/fixes/improvements · performance, SEO & content · priority support.
- Positioned as "we don't disappear at launch" — surfaced on Home, Services (engagement models), and Pricing.
- Pricing framed honestly as **custom monthly** (no invented number).

## 4. Pricing + industries angle

- **Pricing page** with two project tiers + the Care Plan, an "every engagement includes" strip (incl. **bilingual-ready**, a barq-proof differentiator), and a focused FAQ.
- **Industries page** — 6 verticals with tailored value, helping visitors self-qualify without fabricated proof.

## 5. Lead magnets & conversion surfaces

- **Book a 20-minute intro call** — "no pitch, just your project" (low-friction entry; Contact aside). *TODO(devora): wire a real calendar link.*
- **Transparent pricing** as a magnet in itself (reduces bounce).
- **FAQ** as objection-handling + organic-search surface.
- **Case-study detail pages** as credibility + SEO.
- Consistent **amber CTA band** on every page → Contact.

## 6. Trust elements (honest by design)

Adopted: none fabricated. Kept as clearly-flagged, swap-in slots:
- Testimonials (2 real-client placeholders, `TODO(devora)` attribution).
- Team photo slot (`TODO(devora)`).
- Optional future stats/logos once real.

This is a deliberate positioning choice — credibility through transparency and real work beats round-number stats.

## 7. UX flow improvements

- Clear primary nav (5 items) + a richer footer for secondary pages.
- Every page ends in a single, consistent CTA (reduces decision fatigue).
- Home now tells a full story (what → how → proof → who → after → questions → act).
- Bilingual parity: 320 keys in each locale, RTL verified.

## 8. Technical enablers already added (by the parallel SEO pass, integrated)

`generateMetadata` + `alternates()` hreflang on every page (incl. the 5 new routes and case studies), `sitemap.ts` (updated to include all new routes), `robots.ts`, OG/Twitter images, app icons.
