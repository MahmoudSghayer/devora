# devora.design

> **devora** — a bilingual (English + Arabic / RTL) marketing website for a full-stack web studio.
> The name is **dev + aura**: engineering with a presence you can feel.

A dark, editorial, type-driven, motion-rich site. Four pages — **Home · Work · Services · Contact** — in **Arabic (`/`, default, RTL)** and **English (`/en`)**, sharing a sticky header, footer, and marquee.

**Repo:** https://github.com/MahmoudSghayer/devora
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Motion (Framer) · next-intl · Zod

---

## Table of contents

1. [Vision & brand](#1-vision--brand)
2. [Project status](#2-project-status)
3. [Tech stack & key decisions](#3-tech-stack--key-decisions)
4. [Getting started](#4-getting-started)
5. [Project structure](#5-project-structure)
6. [Design system](#6-design-system)
7. [Motion system](#7-motion-system)
8. [Internationalization & RTL](#8-internationalization--rtl)
9. [Pages](#9-pages)
10. [Contact form & API](#10-contact-form--api)
11. [Content & assets](#11-content--assets)
12. [Roadmap — what's next](#12-roadmap--whats-next)
13. [Deployment](#13-deployment)
14. [Conventions & how to extend](#14-conventions--how-to-extend)

---

## 1. Vision & brand

devora positions the studio as **one team, end to end** — strategy, brand, design, code, launch, growth. The brand promise is craft you can feel (the *aura*), delivered by developers (the *dev*).

| Aspect | Value |
|--------|-------|
| Name | **devora** — `dev` + `aura` |
| Domain | `devora.design` |
| Wordmark | `devora` (bold) · `.` (amber) · `design` (light grey) |
| Narrative | "Dev meets aura — websites with a presence you can feel." |
| Signature | `devora — dev + aura` (footer) |
| Accent | Amber `#f4c542` (a warm golden aura) on near-black |
| Tone | Editorial, confident, minimal. No box-shadows — depth from borders, surface shifts, and motion. |

> **Provenance:** the site was built from a high-fidelity design handoff originally branded `barq.labs`; every brand touchpoint was rebranded to **devora** during the build. The two case-study clients (`zawiya.studio`, `aldarb.co`) are real live sites, unchanged.

---

## 2. Project status

**All build phases are complete and verified.** The site builds green, both locales are statically generated, and there are no console or hydration errors.

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Scaffold, design tokens, fonts, i18n routing, message dictionaries | ✅ Done |
| 1 | Motion primitives (hooks + components) | ✅ Done |
| 2 | Global chrome (header, footer, marquee, progress, logo, language toggle) | ✅ Done |
| 3 | Home page | ✅ Done |
| 4 | Work page + live case-study screenshots | ✅ Done |
| 5 | Services page (disciplines, process, packages) | ✅ Done |
| 6 | Contact page + `/api/contact` stub | ✅ Done |
| 7 | Polish & QA (404, RTL, reduced-motion, build, lint) | ✅ Done |

**Verified:** `npm run build` prerenders all 8 locale pages as static SSG · `npm run lint` clean · TypeScript clean · RTL mirroring correct · language toggle persists (cookie) · contact validation + submit cycle work · no box-shadows · `prefers-reduced-motion` respected · no console/hydration errors.

**What remains before launch:** real content (pricing, testimonials, socials, email, team photo) and wiring the contact form to a real destination. See the [Roadmap](#12-roadmap--whats-next).

---

## 3. Tech stack & key decisions

| Choice | Why |
|--------|-----|
| **Next.js 16 (App Router)** | Per-locale static generation, route handlers for the contact stub, first-class i18n. |
| **TypeScript** | Type-safe components, props, and validation. |
| **Tailwind CSS v4 (`@theme`)** | CSS-first design tokens live in `app/globals.css`; a single custom `nav:` breakpoint (920px) drives all responsiveness. |
| **Motion (Framer)** | Idiomatic React motion (`whileInView`, `useScroll`, springs) with `useReducedMotion`; imported from `motion/react`. |
| **next-intl** | Locale routing (`/` for Arabic, `/en` for English), `dir`/`lang` per locale, cookie persistence, message dictionaries. |
| **Zod** | Server-side validation of the contact payload. |
| **npm** | Package manager (no pnpm/yarn). |

**Notable decisions**
- **Locale routing over DOM text-swap** — the prototype swapped text via `localStorage`; production uses `/` (Arabic, default, unprefixed) · `/en` (English, prefixed) routes with the `NEXT_LOCALE` cookie.
- **`proxy.ts` not `middleware.ts`** — Next 16 renamed the middleware convention to `proxy`.
- **SSR-identical motion initial states** — entrance animations use the same `initial` on server and client, so there are no hydration mismatches; reduced-motion collapses transitions to instant (content always visible).
- **No box-shadows anywhere** — a hard design rule; depth is borders, surface shifts, `translateY(-6px)` hover lifts, and motion.

---

## 4. Getting started

```bash
npm install
npm run dev        # http://localhost:3000  → serves Arabic (default, unprefixed)
npm run build      # production build (all pages prerendered per-locale)
npm start          # serve the production build
npm run lint       # ESLint
```

- Requires **Node 18+** (built on Node 24).
- Visit `/` (Arabic, default) or `/en` (English); the language toggle switches locale in place and persists via cookie.

---

## 5. Project structure

```
app/
  layout.tsx                     # minimal root (pass-through)
  globals.css                    # Tailwind v4 @theme tokens + keyframes + base
  [locale]/
    layout.tsx                   # <html lang/dir>, fonts, next-intl provider, chrome
    page.tsx                     # Home
    work/page.tsx  services/page.tsx  contact/page.tsx
    not-found.tsx                # localized 404
  api/contact/route.ts           # POST stub (validates, does not deliver)
components/
  chrome/   Header · MobileMenu (in Header) · Footer · Marquee · ScrollProgress · Logo · LanguageToggle
  motion/   WordReveal · HeroReveal · Reveal · Parallax · Magnetic
  ui/       Container · SectionHeader · PageIntro · AmberBand · ArrowButton · ArrowLink · Chip · SiteImage
  home/     HeroHome · ServicesOverview · SelectedWork · Testimonials · TeamSection
  work/     CaseStudyRow
  services/ DisciplineRows · ProcessSteps · EngagementModels
  contact/  ContactForm · ContactAside
lib/
  motion.ts                      # EASE curve + shared viewport config
  fonts.ts                       # next/font (Space Grotesk, Space Mono, Cairo)
  site.ts                        # brand constants + placeholders (SITE, SOCIALS, CASES)
  validation.ts                  # Zod schema + client validators
  hooks/    useMagnetic · useParallax · useScrollDirection
i18n/
  routing.ts  request.ts  navigation.ts
messages/
  en.json  ar.json               # all copy, namespaced (common, home, work, services, contact)
proxy.ts                         # next-intl middleware (Next 16 "proxy" convention)
next.config.ts                   # wrapped with createNextIntlPlugin
scripts/
  capture-screenshots.mjs        # regenerate the case-study images
public/images/
  zawiya.png  aldarb.png         # live case-study screenshots
```

---

## 6. Design system

All tokens are defined in `app/globals.css` via Tailwind v4 `@theme` and consumed as utilities (`bg-*`, `text-*`, `border-*`, `rounded-*`, `text-h1`, `font-display`/`font-mono`, `nav:` variants).

**Colors**

| Group | Tokens |
|-------|--------|
| Surfaces | `bg #0f0f0f` · `bg-alt #121212` · `bg-foot #0b0b0b` · `surface #141414` · `surface-2 #151515` · `featured #161408` |
| Borders | `border #232323` · `border-sub #1d1d1d` · `border-card #2a2a28` · `border-chip #333330` · `border-ghost #3a3a3a` · `border-amber #3d3620` |
| Text | `ink #f2f2ef` · `ink-2 #c9c9c2` · `muted #9a9a94` · `muted-2 #8f8f8a` · `faint #6a6a66` · `faint-2 #55554f` |
| Accent | `amber #f4c542` · `amber-hi #ffd75e` · `on-amber #131108` · `dark-btn-hi #2a2712` |

**Typography** — **Space Grotesk** (display/body, 400–700) · **Space Mono** (labels, numbers, tags, marquee, 400/700) · **Cairo** (Arabic display/body, variable, 400–700). Loaded via `next/font` (self-hosted, no layout shift). Fluid heading sizes as tokens: `text-h1`, `text-h1-sub`, `text-h2`, `text-cta`, `text-case`.

**Layout** — container `max-w-1360px`, side padding `24px` (mobile) / `40px` (≥ `nav`). **Single breakpoint: `nav` = 920px** (`nav:` / `max-nav:`), never `md`/`lg`.

**Radii** — pills `999px` · cards `18px` · images `14–16px` · inputs `10px` · logo mark `9/9/9/2px` (signature asymmetric corner). **No box-shadows.** Selection is amber on `#131108`.

---

## 7. Motion system

Master easing `cubic-bezier(0.22, 1, 0.36, 1)` (`lib/motion.ts` → `EASE`). Every behavior honors `prefers-reduced-motion` (JS collapses to instant; ambient CSS loops are gated behind `@media (prefers-reduced-motion: no-preference)`), and entrance states are SSR-identical (no hydration flash, content never stuck hidden).

| Behavior | Component / hook | Detail |
|----------|------------------|--------|
| Headline word reveal | `WordReveal` | each word rises from `translateY(120%)` in an overflow mask; 0.95s, `120 + i·65`ms stagger |
| Hero entrance | `HeroReveal` | fade-up 26px on mount; `100 + i·110`ms stagger |
| Scroll reveals | `Reveal` | `whileInView` (once, 12% visible, `-60px` margin); fade-up 32px; `index·90`ms or explicit delay |
| Parallax | `Parallax` / `useParallax` | vertical `useScroll`→`useTransform`, oversized layer so no edge shows (RTL-safe) |
| Magnetic buttons | `Magnetic` / `useMagnetic` | spring toward cursor `(dx·0.22, dy·0.3)`, releases on leave |
| Nav hide/show | `Header` / `useScrollDirection` | hides (`translateY(-105%)`) scrolling down past 320px |
| Progress bar | `ScrollProgress` | fixed `start-0` top bar, width = scroll progress (RTL-correct) |
| Ambient loops | CSS keyframes | marquee 22s · hero hairlines 18s · amber band 13s · label pulse 2.4s · arrow nudge 1.6s · logo spin 46s |

---

## 8. Internationalization & RTL

- **Routing** — `next-intl` with `defaultLocale: 'ar'` and `localePrefix: 'as-needed'` → Arabic serves unprefixed at `/` (default), English stays prefixed at `/en`. `localeDetection: false` so `/` deterministically serves Arabic regardless of the visitor's `Accept-Language` header or locale cookie, which keeps SEO crawling consistent. Old `/ar/...` URLs redirect automatically to their unprefixed equivalents via next-intl's own middleware — no custom redirect code needed. Config in `i18n/routing.ts`, `request.ts`, `navigation.ts`; `proxy.ts` runs the middleware.
- **Per-locale document** — `app/[locale]/layout.tsx` sets `<html lang dir>` (`rtl` for Arabic) and calls `setRequestLocale` for static rendering.
- **Language toggle** — switches locale on the same page (`router.replace(pathname, {locale})`); persisted via the `NEXT_LOCALE` cookie.
- **RTL handling** — logical CSS properties (`ms-*`, `start-*`, `ps-*`) so layout mirrors automatically; Arabic forces `letter-spacing: 0` (negative tracking breaks ligatures) via `[dir="rtl"]` rules on `.u-track`/`.u-mono`/headings; directional arrows (`→`/`←`) are a translated glyph (`common.arrow`); brand names, the marquee, and prices stay LTR (`dir="ltr"` / bidi).
- **Copy** — all strings live in `messages/en.json` and `messages/ar.json`, namespaced `common` / `home` / `work` / `services` / `contact`. English is authored copy; Arabic is the reviewed dictionary from the handoff plus the dev+aura rebrand lines.

---

## 9. Pages

**Home (`/[locale]`)** — hero (word-reveal H1, dev+aura label, magnetic CTA + ghost button, rotating logo ornament, drifting hairlines) → marquee → services overview (hairline-grid, 01–04) → selected work (2-up, parallax, live screenshots) → testimonials (2, *placeholder*) → team (6 discipline chips + photo slot) → amber CTA band.

**Work (`/[locale]/work`)** — intro → two case-study rows (alternating `7fr/5fr` ↔ `5fr/7fr`, parallax screenshots of `zawiya.studio` + `aldarb.co`, "Visit site ↗") → centered amber "next" band → marquee.

**Services (`/[locale]/services`)** — intro → 4 discipline rows (number + title + 4 deliverable chips) → 5-step process (amber first step) → 3 pricing packages (middle **featured** with "Most requested" badge, *placeholder prices*) → amber CTA band → marquee.

**Contact (`/[locale]/contact`)** — intro → `7fr/4fr` grid: validated form (Name, Email, Company, Budget, Details) + aside (email, socials, "Remote-first — MENA & worldwide") → marquee.

**404 (`/[locale]/not-found`)** — localized, in-chrome.

---

## 10. Contact form & API

- **Client** (`components/contact/ContactForm.tsx`) — required-field + email-format validation with localized errors; state machine `idle → sending → sent | error`; magnetic submit; resets on success.
- **Server** (`app/api/contact/route.ts`) — `POST` validated with Zod (`lib/validation.ts`); returns `{ok:true}`. **It does not deliver anywhere yet** — it logs and acknowledges. Wire a real destination before launch.

---

## 11. Content & assets

- **Fonts** — Google Fonts via `next/font` (self-hosted at build).
- **Logo** — CSS-built mark + wordmark (`components/chrome/Logo.tsx`); scalable via a `size` prop.
- **Case-study images** — `public/images/zawiya.png`, `aldarb.png`, captured from the live sites with:
  ```bash
  node scripts/capture-screenshots.mjs
  ```
- **Glyphs** — marquee `✦`, arrows `→ / ← / ↗` are text characters (not icons).

---

## 12. Roadmap — what's next

### 12.1 Before launch — required (`TODO(devora)`)

Everything below is grep-able via `TODO(devora)`.

| Item | Where |
|------|-------|
| **Pricing** ✅ set — `from $3,500` / `from $9,500` / `from $1,200/mo` | `messages/{en,ar}.json` → `pricing.m1_p`, `m2_p`, `m3_p` |
| **Testimonial quotes** (both) + attributions | `messages/{en,ar}.json` → `home.t1_q`/`t1_a`, `t2_q`/`t2_a` |
| **Social URLs** (Instagram · X · LinkedIn · Behance) | `lib/site.ts` → `SOCIALS` (currently `#`) |
| **Contact email** ✅ set — `support@devora.design` | `lib/site.ts` → `SITE.email` |
| **Team photo** | `components/home/TeamSection.tsx` (placeholder slot → real image in `public/images/`) |
| **Contact delivery** | `app/api/contact/route.ts` — wire email (Resend/Postmark/SES), a CRM, or a form service |
| **Arabic validation copy** — review by a native speaker | `messages/ar.json` → `contact.err_*`, `send_*`, `sending` |

### 12.2 Recommended next — technical polish

- **SEO & metadata** — per-page `generateMetadata` for Home/Work titles + descriptions, Open Graph / Twitter card images, `sitemap.ts`, `robots.ts`, canonical + `hreflang` alternates for `/` (ar) ↔ `/en`.
- **Favicons / app icons** — replace the default favicon with a devora mark set (`icon.png`, `apple-icon.png`).
- **Analytics & consent** — privacy-friendly analytics (e.g. Vercel Analytics / Plausible), plus a cookie/consent note if required.
- **Performance & a11y pass** — Lighthouse run, image sizing/priorities, focus-visible audit, color-contrast check, keyboard nav for the mobile menu.
- **Testing** — component tests (Vitest + Testing Library) for the contact validation and language toggle; a Playwright smoke test per page/locale.
- **CI/CD** — GitHub Actions running `lint` + `build` on PRs; auto-deploy on merge.

### 12.3 Future enhancements

- **More case studies** — generalize `CaseStudyRow`/`CASES` to a data-driven list (or a lightweight CMS / MDX) instead of two hard-coded entries.
- **Insights / blog** — an MDX-backed articles section (fits the "aura/craft" positioning).
- **Real testimonials pipeline** — pull quotes from a CMS.
- **Brand kit usage** — light-background and mark-only logo variants for OG images and email signatures.
- **Additional locales** — the i18n structure already supports adding more locales in `i18n/routing.ts` + a new `messages/*.json`.
- **Motion refinements** — optional richer hero ornament, section transitions.

---

## 13. Deployment

Default target is **server-capable** (Vercel / Node) so the `/api/contact` route handler runs. Both locales are statically generated; the API route is dynamic.

- **Vercel** — import the repo; zero config. Set any env vars for the contact destination once wired.
- **Static export** — if a static-only host is required, add `output: 'export'` in `next.config.ts` and repoint the contact form at an external form service (route handlers don't run in a static export).

---

## 14. Conventions & how to extend

- **Responsiveness** — use only `nav:` / `max-nav:` (920px). Never `md`/`lg`.
- **Colors/spacing** — use theme tokens (`bg-bg-alt`, `text-muted`, `border-border`, `text-h2`, …); avoid raw hex. Never add `shadow-*`.
- **New copy** — add a key to both `messages/en.json` and `messages/ar.json` under the right namespace; read it with `useTranslations('<namespace>')`.
- **New section** — compose from `components/ui/*` (Container, SectionHeader, Reveal, AmberBand, Chip, ArrowLink) to stay on-system.
- **Motion** — wrap entrance content in `Reveal` (scroll) or `HeroReveal` (mount); use `WordReveal` for headings, `Magnetic` for primary CTAs, `Parallax` for imagery.
- **RTL** — prefer logical utilities; wrap Latin brand names / numerals in `dir="ltr"`.
- **Pages** — each page is an `async` server component that awaits `params`, calls `setRequestLocale(locale)`, then renders a sync content component using `useTranslations`.

---

_Built from the design handoff, rebranded to devora, and verified end-to-end. See commit history for the phase-by-phase build._
