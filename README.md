# devora.design

Bilingual (English + Arabic/RTL) marketing site for **devora** — a full-stack web studio. _dev + aura._

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Motion (Framer) · next-intl**.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000  → redirects to /en
npm run build      # production build (all pages prerendered per-locale)
npm start          # serve the production build
npm run lint
```

Locales live under `/en` and `/ar`. The language toggle switches locale in place and persists via the `NEXT_LOCALE` cookie.

## Structure

```
app/[locale]/         home · work · services · contact · not-found  (+ layout: <html dir/lang>, chrome)
app/api/contact/      POST stub (validates, does not deliver — see below)
components/chrome/     Header, MobileMenu, Footer, Marquee, ScrollProgress, Logo, LanguageToggle
components/motion/     WordReveal, HeroReveal, Reveal, Parallax, Magnetic
components/ui/         Container, SectionHeader, PageIntro, AmberBand, ArrowButton, ArrowLink, Chip, SiteImage
components/{home,work,services,contact}/   page sections
lib/                   motion.ts (EASE), fonts.ts, site.ts (brand + placeholders), validation.ts, hooks/
i18n/                  routing, request, navigation (next-intl)
messages/              en.json · ar.json  (all copy)
proxy.ts               next-intl middleware (Next 16 "proxy" convention)
scripts/               capture-screenshots.mjs  (regenerate case-study images)
```

Design tokens (colors, radii, fluid headings, the single `nav:` 920px breakpoint) are defined in `app/globals.css` via Tailwind v4 `@theme`. **No box-shadows** — depth is borders, surface shifts, hover lifts and motion. All motion honors `prefers-reduced-motion`.

## Case-study images

`public/images/zawiya.png` and `aldarb.png` are screenshots of the live client sites, captured with:

```bash
node scripts/capture-screenshots.mjs
```

## ⚠️ Replace before launch (`TODO(devora)`)

All placeholders are grepable via `TODO(devora)`:

| What | Where |
|------|-------|
| **Pricing** — `from $2,900` / `from $7,500` | `messages/{en,ar}.json` → `services.k1_p` / `k2_p` |
| **Testimonial quotes** (both) | `messages/{en,ar}.json` → `home.t1_q` / `t2_q` |
| **Social URLs** (Instagram/X/LinkedIn/Behance) | `lib/site.ts` → `SOCIALS` (currently `#`) |
| **Contact email** | `lib/site.ts` → `SITE.email` (`hello@devora.design`) |
| **Team photo** | `components/home/TeamSection.tsx` (placeholder slot) |
| **Contact delivery** | `app/api/contact/route.ts` — validates only; wire real email/CRM/form service |
| **Arabic validation copy** — review | `messages/ar.json` → `contact.err_*`, `send_*`, `sending` |

## Contact form

Client-side validation (name + email format + details required) with an `idle → sending → sent / error` state machine, posting to `/api/contact`. The route validates with Zod and acknowledges — it does **not** send anywhere yet (stub).

## Deploy

Standard server-capable target (Vercel/Node). To go fully static instead, add `output: 'export'` in `next.config.ts` and repoint the contact form at an external form service (route handlers don't run in a static export).
