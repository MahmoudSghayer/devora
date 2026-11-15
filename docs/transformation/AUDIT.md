# Devora transformation — code audit

Audited against **HEAD (`6dcdd24`)**, not the working tree: other agents are editing files in parallel (e.g. `app/api/lead/route.ts`, `lib/email/templates.ts`, `lib/admin/queries.ts`, `messages/*.json` are already modified). Line numbers below are HEAD line numbers; re-check after those edits land. Marks: **CONFIRMED** (as stated), **CORRECTED** (partly wrong), **NEW** (not in the orchestrator list).

## A. Orchestrator facts

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | Homepage is a ~1,327-line imperative three.js scroll story, HTML via `dangerouslySetInnerHTML` | CONFIRMED | `lib/experience/devora-universe.ts` is 1,327 lines; `components/experience/markup.ts` 414 lines builds the HTML string; injected at `components/experience/DevoraExperience.tsx:99`. three/gsap/lenis are dynamically imported (`devora-universe.ts:227-235`), which is good. |
| 2 | ~21 viewport heights | CONFIRMED (measured) | Production baseline: 19,180 px tall at 1440x900 = 21.3 viewports; 16,136 px at 390x844 = 19.1. |
| 3 | No links to other pages | CORRECTED | The markup links to `contactHref` (`markup.ts:384`, built at `app/[locale]/page.tsx:50`), the other locale (`markup.ts:182`, `page.tsx:48`), `mailto:` (`markup.ts:385`) and in-page anchors. It has **no** links to services, pricing, work, about, process, FAQ; none of the 9 marketing routes (and not the Header/Footer from `(marketing)/layout`) are reachable except Contact. Baseline: 21 `<a href>` on `/`. |
| 4 | Leaks listeners / GPU resources | CONFIRMED | `destroy()` (`devora-universe.ts:134-160`) removes only `resize` (L145) and disposes only the renderer (L147). Never removed: `window` `scroll` (added L1115), `window` `mousemove` (L1144), per-element `mouseenter/leave/click/mousemove` closures (L1146-1162, L1234-1245), sound button (L1248). Geometries, materials, textures and render targets are never `.dispose()`d; the lenis `raf` loop (L666-668) is not cancelled via `rafId`; `AudioContext` is closed but oscillator nodes are not tracked. Re-mount (locale switch, HMR) accumulates window listeners. |
| 5 | Inline hex outside tokens | CONFIRMED | 53 hex literals in `markup.ts`, 12 in `devora-universe.ts`; also `components/chrome/DevoraMark.tsx`, `components/ui/AmberBand.tsx`, `components/contact/ContactForm.tsx`, `components/chat/LeadForm.tsx`, `app/[locale]/opengraph-image.tsx`, `app/apple-icon.tsx`, `lib/email/templates.ts` (email, acceptable). `markup.ts` uses inline `style="..."` for nearly all layout, so tokens and the 920 px breakpoint do not apply to the homepage. |
| 6 | `components/home/*` is dead code with fabricated testimonials | CONFIRMED | No file under `app/` or `components/` imports `components/home/*` (grep for the 8 component names: zero imports). `components/home/Testimonials.tsx:9-10` says "placeholder copy"; `messages/en.json:109-112` has `t1_q/t1_a` ("Founder — Zawiya Studio") and `t2_q/t2_a` ("Team — Aldarb") — invented quotes attributed to real clients. The `home` namespace (also feeds the chat KB) still carries `test_label`, `care_*`, `svc_*`, `proc_*` strings for the dead components. |
| 7 | `leads` table has no source/jsonb/idempotency | CONFIRMED (at HEAD) | `supabase/migrations/0001_init.sql:122-135`: id, conversation_id, name, email, phone, company, request, recommended_package, ai_summary, status, locale, created_at only. Working tree already adds `0002_calculator_leads.sql` (untracked, not applied). |
| 8 | `/api/lead` calls `summarize()` synchronously, swallows DB/email errors, returns ok | CONFIRMED | `app/api/lead/route.ts:50` awaits Claude before inserting; `insertLead` (`lib/chat/store.ts:157-190`) destructures `{data}` only (L170) and never reads `error`, returns `null` on failure; route (L57-68) ignores the null id; email failure is caught and logged (L88-90) and the response is still `{ok:true, delivered, leadId}` (L99). A visitor sees success when nothing was saved or sent. `summarize` also puts raw prices in the prompt (`summarize.ts:22`). |
| 9 | `/api/contact`: no rate limit / honeypot / max lengths / DB write | CONFIRMED (one nuance) | `app/api/contact/route.ts` (42 lines): no `rateLimit`, no honeypot, no DB insert. `contactSchema` (`lib/validation.ts:4-10`) has only `.min(1)`, no `.max()` on any field, so unbounded body into an email. Nuance: unlike `/api/lead` it **does** surface failure (`502 send_failed`, L38-40) — but a missing SMTP env returns `ok:true, delivered:false` and nothing is stored, so the lead is lost silently in that case. |
| 10 | `esc()` doesn't escape quotes | CONFIRMED | `lib/email/templates.ts:3-4` escapes only `& < >`. Values are interpolated into element text only today (L22-37), so no live injection, but any attribute use (e.g. a `href="${esc(email)}"`) would be exploitable; `replyTo`/subject headers come from user input too (`app/api/lead/route.ts:84`). Add `"` and `'`. |
| 11 | `.maybeSingle()` on leads per conversation breaks with 2+ leads | CONFIRMED + NEW | `lib/admin/queries.ts:63-68`: `.order(...).maybeSingle()` returns an error and `data: null` when 2+ rows match; the error is never read, so the admin UI silently shows "no lead". NEW: same defect for `support_requests` (`queries.ts:70-74`). Fix with `.limit(1).maybeSingle()` or return arrays. |
| 12 | Prices duplicated | CONFIRMED, list extended | `messages/*.json`: `pricing.m1_p/m1_mo, m2_p/m2_mo, m3_p/m3_mo` (`en.json:210-238`, same lines in `ar.json`), `faq.a5` (`:345`), `faq.a6` (`:347`, "$200–$300"), `home.care_sub` (`:103`). Code: `lib/email/templates.ts:41-43`, `lib/chat/summarize.ts:22`, `lib/chat/systemPrompt.ts:24`, `tests/e2e.mjs:33,43`. NEW: `lib/pricing/config.ts:8` (already the intended single source, but nothing imports it yet); budget bands in the contact form use different numbers (see 13); the chat KB (`lib/chat/kb.ts`) re-ingests every message namespace so the duplicated copy also reaches the model (see 15). |
| 13 | Contact budget options don't match tiers | CONFIRMED | `messages/en.json:369-373`: "Under $3k", "$3k–$8k", "$8k–$20k", "$20k+", "Not sure yet" (`components/contact/ContactForm.tsx:73`, keys `o1..o5`) vs tiers $1,650 / $2,650 / $5,000. "Under $3k" spans two tiers; nothing maps a band to a package. Also no currency handling for an Arabic-first audience. |
| 14 | Three conflicting services taxonomies and three process taxonomies | CONFIRMED (enumerated) | **Services:** (a) `common.svc.s1..s5` — Strategy & brand / Design & UX / Full-stack build / Launch & growth / AI & automation (`en.json:61`, used by `components/services/DisciplineRows.tsx:15` and dead `components/home/ServicesOverview.tsx:17`); (b) `services.sb1..sb5` + `d11..d54` — five disciplines with 4 sub-items each, partly different names (`en.json:149+`); (c) `experience.services.items` — **12 "orbital systems"** (Strategy, Branding, Website Design, Website Development, Automation, Marketing, SEO, Content Creation…) (`en.json:459`). Plus `industries.i1..i6`, and Pricing's three packages. None map to the new three pillars. **Process:** (a) `services.p1..p5` 5 steps Discover/Define/Design/Build/Launch & grow, with different one-liners (`components/services/ProcessSteps.tsx`); (b) `process.s1..s5` same five names, longer copy + outputs (`s*_out`) (`components/process/ProcessDetail.tsx`); (c) `experience.build.stages` — **9** stages "The idea → A living system" (`en.json:442`); plus `home.proc_*` ("Five moves") for dead code and `about.diff_*` / `val_*` partially overlapping. |
| 15 | `kb.ts` / `seed-kb.mjs` feed every message namespace into the chat prompt unless in `SKIP_NS` | CONFIRMED | `lib/chat/kb.ts:70` and `scripts/seed-kb.mjs:39` both `new Set(['chat'])`; loop at `kb.ts:72-78` / `seed-kb.mjs:103-108`. So `experience` (DEVORA OS jargon: "12 orbital systems", "Initializing DEVORA OS", coordinates), dead-code `home.*` strings including fabricated testimonials, SEO/meta strings, and all duplicated price strings go into the assistant's context; the chat can quote stale prices or testimonials. Two copies of the SKIP list also drift. Use an allow-list of namespaces. |
| 16 | README stale | CONFIRMED | `README.md:6` says "Four pages — Home · Work · Services · Contact"; the site has 9 marketing routes (about, process, industries, faq, pricing, work/[slug]), an AI chat assistant, admin console, Supabase, Upstash, Anthropic, nodemailer, cron route; stack line (L8) omits all of these, three.js/GSAP/Lenis. |
| 17 | `tests/e2e.mjs` Arabic launcher aria assertion wrong | CONFIRMED | `tests/e2e.mjs:50` looks for `aria-label="افتح مساعد ديفورا"`; `messages/ar.json` `chat.launcher_aria` is "افتح مساعد devora". The EN selectors (L19-26) are also hard-coded strings; the price regex at L33/L43 couples tests to copy. `tests/unit` is empty (0 files) at HEAD. |

## B. NEW findings

### Backend / data
- **Orphaned writes order:** the lead is created after a blocking LLM call; if Anthropic is slow the visitor waits up to the platform timeout and loses the lead (`app/api/lead/route.ts:50-69`). Persist first, summarize and mail after (e.g. `after()`), then update.
- **Conversation FK `on delete set null`** (`0001_init.sql:124`) plus no `idempotency_key` means retries from the chat `LeadForm` can create duplicates.
- **No `max()` on `budget`/`company` in contact**, no body-size cap, `details` unbounded (`lib/validation.ts:4-10`).
- **Admin routes**: `app/(admin)/admin/layout.tsx:13` sets `robots: noindex` correctly; confirm each `app/api/admin/*` route calls the auth guard (not verified route by route here).

### SEO
- Homepage `generateMetadata` (`app/[locale]/page.tsx:12-31`) takes `description` from `experience.hero.sub`; the H1 and body are generated by JS into an HTML string, so crawlers see content only if SSR HTML is complete; it is rendered server-side as a string, but there is only one real text block per section and no semantic landmarks beyond what `markup.ts` writes.
- `app/sitemap.ts` sets `lastModified: new Date()` on every build and `priority 0.8` for all non-home routes (no real lastmod signal); no `/contact` thank-you or calculators yet.
- `app/layout.tsx:7` hard-codes `metadataBase` to `https://devora.design` and `app/robots.ts:3`, `sitemap.ts:4` repeat it: three copies of the origin (use `lib/site.ts`).
- OG image generator exists (`opengraph-image.tsx`) but `<img>` in ImageResponse (L43) has no `alt`; irrelevant to rendering, lint noise only.
- `components/seo/StructuredData.tsx` is global in the locale layout; no per-page structured data (Service, FAQPage for `/faq`, BreadcrumbList for `/work/[slug]`).

### Accessibility
- Hard-coded English `aria-label="Menu"` (`components/chrome/Header.tsx:68`) in an Arabic-first site; `Logo.tsx:11` and `DevoraMark.tsx:20` use English labels too.
- Homepage story is a pinned, JS-built page with a sound toggle and heavy motion; reduced-motion path exists (`devora-universe.ts:116-118`, `markup` skip link `markup.ts:146`) but `globals.css` gates only parts of the marketing pages in `prefers-reduced-motion: no-preference` (L127, 142, 174), so check that the remaining animations (marquee, StarField) stop under reduce.
- Case-study image alts are `"${domain} — website"` (`components/work/CaseStudyRow.tsx:29`, `CaseStudyDetail.tsx:68`): generic, not localized.
- Focus ring exists (`globals.css:215`); the homepage's inline-styled controls bypass it (inline `style=` in `markup.ts`).

### Performance
- 37 files carry `'use client'`; the marketing pages are mostly static content that could be server components with small client islands.
- `lib/fonts.ts` loads three families (Space Grotesk variable, Space Mono 400/700, Cairo) — Cairo is `preload:false` which is good, but Space Mono adds two files for labels only.
- `StarField` canvas runs on every marketing page in addition to the homepage WebGL (the homepage mounts both, `DevoraExperience.tsx:6`), and `devora-universe` has no explicit pause on `visibilitychange`/off-screen outside the preloader.
- Production baseline notes: homepage console shows a WebGL "GPU stall due to ReadPixels" warning at 1440 (headless GL); `/_vercel/insights/script.js` 404 locally (expected off-Vercel; analytics is loaded unconditionally).
- `public/` is 1.4 MB: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` are unreferenced create-next-app leftovers; the three PNGs in `public/images` (`aldarb`, `rabea`, `zawiya`) are the only used assets (2 references each).

### i18n
- Experience copy is a different content system (`experience.*` ~27 keys with nested arrays) from the rest, with English-only technical strings ("Initializing DEVORA OS", "LAT/LON", "DEVORA OS v3.0") that have no Arabic equivalent and read as noise to Arabic users.
- `experience.rail`, `act_labels` use ALL-CAPS Latin labels; caps/tracking have no meaning in Arabic.
- Currency symbols and "k" abbreviations hard-coded in message strings (`o1..o4`), prices as "$1,650" text (`ar.json:210`) instead of formatted numbers; mixed-direction numerals are handled by hand.
- Hard-coded tracking/URLs: Instagram only (`lib/site.ts:10-12`); no WhatsApp channel despite the target market.

### Docs / process
- `docs/strategy/*` and `docs/AI-SUPPORT.md` describe the pre-transformation state (five-discipline taxonomy, four pages); superseded by this transformation.
- `.github/workflows/ci.yml` exists, but `tests/unit` is empty at HEAD and e2e depends on live copy; only `vitest` config and `lib/estimator/engine.test.ts` (untracked) are new.

## C. Baseline measurements (production build, `next start -p 3100`)

| Page | 1440 height | 390 height | Horizontal overflow | Console / network |
|---|---|---|---|---|
| `/` (ar, rtl) | 19,180 px (21.3 vh) | 16,136 px | none | 404 `/_vercel/insights/script.js`; WebGL GPU-stall warnings (1440 only) |
| `/en` | 19,180 px | 16,224 px | none | 404 insights script |
| `/services` | 3,954 px | 5,885 px | none | 404 insights; aborted `_rsc` prefetches (contact, work, services) |
| `/pricing` | 3,576 px | 5,415 px | none | 404 insights; aborted `_rsc` prefetches |

No JS exceptions on any page. Screenshots (not in repo): `<scratchpad>/baseline/`.
