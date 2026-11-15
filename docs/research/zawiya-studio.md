# Zawiya Studio (zawiyastudio.com) — live research

Researched 2026-11-15 with Playwright (Chromium). Facts and inferences are kept apart on purpose. Copy is paraphrased. No Zawiya assets were copied into this repo (screenshots live only in the session scratchpad).

## 1. Method & coverage

- **Reachability:** the site loaded fine. Only one host was blocked: `static.cloudflareinsights.com` (Cloudflare analytics beacon, `ERR_TUNNEL_CONNECTION_FAILED`). Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) and the origin all loaded. No key asset was blocked.
- **Page discovery:** `sitemap.xml` lists one URL (`/`, lastmod 2026-09-04). Every nav/footer link is an in-page anchor (`#top #work #build #why #how #talk`) or a `mailto:`. There are no sub-pages, no blog, no legal page, no form. Coverage of "every page" is therefore complete: it is a single-page site.
- **Viewports:** 1440x900, 768x1024, 390x844 (touch/mobile context also tried). Scroll-captured in 0.9-viewport steps with a 900 ms settle (16 / 16 / 19 shots) plus full-page shots.
- **Probes:** network log, `window` globals, inline script/CSS source reading, computed styles, `document.fonts`, pointer-move DOM diff, hover diffs, `prefers-reduced-motion: reduce` emulation, `(hover:none)` emulation, overflow culprit scan.
- **Limits:** headless Chromium with software GL; WebGL frame cost and real-device LCP not measurable. Per-request transfer sizes use `content-length` (compressed responses may under-report).

## 2. Observed facts

### 2.1 Tech and libraries
- Whole site is **one HTML document (~139 KB uncompressed) with 51 KB of inline hand-written JS and ~62 KB inline CSS**. Only 2 script tags in the body besides Cloudflare's email-decode and the blocked analytics beacon.
- **No external JS libraries.** Network shows 7 requests total (document, Google Fonts CSS, 4 woff2 files, email-decode script); ~169 KB summed `content-length`.
- `window` globals: none of `THREE, gsap, ScrollTrigger, Lenis, Spline, lottie, Locomotive, Barba, framer/motion, __NEXT_DATA__, __NUXT__, jQuery` exist. No `data-reactroot`, no Webflow/Framer/Astro markers, no `<meta name=generator>`. Hosting fingerprint: Cloudflare (`/cdn-cgi/` paths).
- The 3D-feeling hero is a **raw WebGL point-particle system** (`getContext("webgl", {alpha:false, antialias:false, preserveDrawingBuffer:true, powerPreference:"high-performance"})`) on a fixed `canvas#space` (z -1), written in the inline script. Two additional 2D canvases (`#field`, `#proc`) exist, sized 0x0 until their sections go live.
- Smooth scroll is **native** (`html{scroll-behavior:smooth}`, `scrollIntoView`/`scrollTo` with smooth behaviour); the "pinned process" uses CSS `position:sticky` (`.pin`) inside a tall wrapper (`.pin-wrap`, 3,060 px at 1440). Scroll-linked reveals use IntersectionObserver (6 observers) plus CSS `animation-timeline` with a documented fallback.
- Page transitions: none (single page). Preloader (`.pre`, z 10000): a short "draw the angle, open, fly" intro; capped; removed under reduced-motion.

### 2.2 Section order and content pattern (EN only; `<html lang="en">`, no `dir`)
1. Fixed nav: angle logo mark + "Zawiya Studio" wordmark; 4 uppercase tracked links; pill CTA "Start a project". Nav tightens (padding + blurred background) on scroll. Mobile: burger opens a full-screen blurred sheet. A vertical right-edge **scene rail** (6 ticks, active label slides in) mirrors the section anchors.
2. **Hero:** pill tag (name + Arabic word زاوية + "the angle"), giant two-line H1 ("Built to / the degree." — line 1 bold white, line 2 light weight with amber-coral-violet gradient text), 4-line lede, primary gradient CTA + ghost CTA, "scroll or click anywhere" hint. Right side: the studio's angle mark rendered as a glowing particle sculpture.
3. **Plate 01 "What we build":** four alternating (zig-zag) showcase rows, each = eyebrow, H3, paragraph, 4 chip tags, and a **hand-built mock UI frame** instead of a screenshot: marketing site (with floating "0.9 s largest paint / 100 performance" badges), SaaS dashboard (KPI tiles, line chart draw-in), e-commerce grid (add-to-cart toast, star rating), mobile app (phone frame). Frames tilt toward the pointer; on touch they rest at a fixed 3 degree angle.
4. **Plate 02 "Capability" — "The stack, in full":** six full-width "layers" (Web, Mobile, Services, Data, Platform, Craft), each with a numbered coloured badge, one-line role, and 4–7 technology chips (React, Next.js, Vue, Flutter, React Native, Swift, Kotlin, Node, Java, Spring, Python, GraphQL, PostgreSQL, MySQL, Redis, Prisma, Linux, Docker, nginx, Cloudflare, AWS, Vercel, GitHub Actions, WebGL, Canvas, GSAP (listed as a skill), Figma, i18next, Playwright, Lighthouse). Hint "hover a tier to lift it out"; hovered layer rises and gets an amber border; the background particle field shows a stack of plates behind this section (that hovering changes the figure is inferred from CSS/JS comments about picking the tier under the pointer, not observed). On touch the layer is tap-to-activate.
5. **Plate 03 "How we work":** three differentiator blocks, each with a headline, two paragraphs and a *proof widget*: (a) "We look before we quote" with an audit-result card (compression off / 370 KB wasted, cache headers absent, 0 indexable pages, 0 of 6 security headers, TLS grade A); (b) "Right-to-left is not a translation job" with an LTR/RTL toggle demo and a claim that late RTL costs 2–3x; (c) "No lock-in" with a handover checklist (source merged, docs, recorded walkthrough, live session, credentials returned and deletion confirmed).
6. **Plate 04 "Method — Measure, then cut":** pinned scroll story with a left rail of 4 steps (look first / price once / ship weekly / hand over), accordion-style active step with description, a big "02 / 04" counter, gradient progress bar, and the background particle field morphing to a figure per step (ring, price tag with $, calendar/reply @, handover). Step buttons are clickable and keyboard reachable.
7. **Plate 05 "Contact":** headline "Start with a blank page, or send us a URL." One gradient magnetic button (mailto) plus the email address as text. **No form, no calculator, no booking widget, no WhatsApp, no phone.**
8. Footer: one row (name + Arabic, "Built with a straightedge", email).

### 2.3 Typography
- One family for everything: **Montserrat** variable (300–800, 4 woff2 subsets requested, 2 used on the page) with **IBM Plex Sans Arabic** (400/500/600) as the Arabic fallback; stack `"Montserrat","IBM Plex Sans Arabic","Helvetica Neue",Arial,sans-serif`. `--ff-d`, `--ff`, `--ff-m` all alias the same stack (CSS comment says this was an owner decision dated 2026-10-13: no separate mono or display face).
- Computed at 1440: H1 132 px / 700 / letter-spacing -4.4 px / line-height ~0.95; H2 72 px / 700 / -1.9 px / lh 1.0; H3 46 px / 650; body 16 px / lh 1.7; lede 21 px / lh 1.6 in dim grey. Eyebrows are small uppercase wide-tracked labels. Headlines use a **word-mask reveal** (each word clipped and rising).
- Fonts are fetched from Google Fonts at runtime (`display=swap`), not self-hosted, contrary to the brief's assumption.

### 2.4 Colour, surfaces, depth
- Palette tokens: void `#0A0A14`, void-2 `#10101E`, surface `#16172A`, raise `#1D1F36`, paper `#F4F2F7`, chalk `#C9C7DA`, dim `#8E8CA8`, faint `#5F5D78`, lines `#242540` / `#35375C`. Signature accents `--a1 #FFB65C` amber, `--a2 #FF6E6E` coral, `--a3 #A78BFA` violet, `--a4 #5EEAD4` teal. Signature gradient `linear-gradient(100deg, amber, coral 44%, violet)`, used on H1 line 2, primary CTA, progress bar. Surfaces are **indigo-tinted dark, never flat black**.
- `prefers-contrast: more` lifts `dim/faint/line` tokens. `color-scheme: dark`, `theme-color #0A0A14`.
- Atmosphere layers: fixed blurred colour "auras" (4 blobs, `blur(90px)`, 13–30% opacity, parallaxed on scroll), a 0.5 px rule grid masked by a radial gradient, a film **grain** overlay (SVG feTurbulence, 4% opacity, stepped 8 s animation), and the WebGL particle field.
- Glass: `backdrop-filter` blur 8 px (rgba void 0.72) on marquee/spans; 10 px on hero tag and ghost button; 12 px on floating mock badges; 26 px + saturate 1.5 on the mobile sheet (0.96 opacity).
- Depth is mostly layers, 1 px borders and glows; a single resting shadow is used (`0 22px 44px -30px #000` on the active layer in reduced-motion). Cards are `rgba(void, .35)` with `#242540` borders; the hovered layer swaps to an amber border and lifts.

### 2.5 Motion and interaction
- **Pointer-reactive:** (a) `div.glow` — a soft light that follows the pointer across the whole page (`transform: translate3d(x,y,0)`; the only element whose inline style changed in my pointer-move diff); (b) per-card pointer spotlight; (c) 3D tilt on mock frames and cards (cards sit at scale .97 / y +12 until hovered, then snap to identity); (d) `.magnet` magnetic buttons; (e) the WebGL field responds to pointer, and **a click anywhere that is not a control sends a shockwave through the particles**.
- **No custom cursor** and no follower element: computed cursors are only `auto` (708 elements) and `pointer` (83).
- **Scroll:** the particle field morphs between figures chosen by which section edge nears screen middle (hero: the angle mark; stack: stacked plates; process: ring → price tag → reply → handover); the page also updates index, readout and a type flicker per scene. Particle count and pixel ratio are reduced on small screens (`PR = min(devicePixelRatio, small ? 1.5 : 1.75)`; 2D field points capped at 44).
- Hover states found: primary CTA colour/border swap, layers lift, cards un-shrink, magnetic button follows. Nav text links showed no computed style change on hover (they use a `::after` underline pseudo-element, hidden on touch).
- **Render hygiene:** every canvas/animation pauses off-screen via IntersectionObserver and on `visibilitychange`; background tab "lands" the preloader anyway.
- **Reduced motion:** CSS sets animation/transition durations to ~0, forces reveal elements visible, hides grain/auras and the preloader, collapses the pinned section to static; JS `RM` flag disables pointermove glow, magnetic effect, particle burst/flight (the field draws one still frame), smooth scrolling. `getAnimations()` still reports 73 animations under emulation (durations are .001 ms, not removed).
- **Touch (`hover:none`):** hover-only effects are given up front (resting angles, always-visible details), 44 px minimum targets, glow hidden.

### 2.6 Responsive behaviour
- Breakpoints present in CSS: 400, 420, 600, 620, 760, 820, 880/881, 900, 1000, 1100, 1180, 1280, 1600, 1900 (many, not a single one). Max shell width 1,500 px on very wide screens.
- Mobile: burger + sheet, stacked showcase rows, same particle story at reduced density, scene rail still shown. Mobile page height 14,150 px vs 12,697 px desktop.
- **Horizontal overflow signal:** `documentElement.scrollWidth` is 411 at 390 px and 774 at 768 px (clientWidth 390 / 768). Culprits are decorative: `.grain` (inset -50%), `.glow`, marquee track. `body{overflow-x:hidden}` propagates to the viewport so this is likely clipped, but I did not verify user-scrollability on a real device.

### 2.7 Conversion mechanics
- Single conversion path: **email** (`mailto:hello@…`, Cloudflare-obfuscated in HTML). CTAs appear in nav pill, hero primary, and contact section; secondary hero CTA scrolls to work. No sticky bottom bar, no form, no calculator, no pricing numbers, no testimonials, no case studies or logos, no WhatsApp/phone/Calendly.
- Trust is built through **claims with proof widgets** (audit findings, handover checklist, fixed-price-after-audit promise, weekly Friday note) rather than social proof.
- Contact line: "send a URL and we will look properly before anyone talks about money" — a low-friction "free audit" hook.

### 2.8 SEO / metadata / performance
- `<title>` plus description, canonical, OG (1200x630 `og.png`), Twitter large card, theme-color, favicon set (ico/svg/png/apple), one JSON-LD block. English-only; no hreflang, no `lang=ar` variant.
- Performance in my runs (headless, local network via proxy): first-contentful-paint = LCP ≈ 1.3–2.1 s (1.34 s at 768, 2.0 s at 1440, 2.1 s at 390; includes the preloader and font fetch); DCL 1.6–2.6 s; 7 requests; no failed requests except the blocked analytics beacon. Console: only the blocked beacon, plus a Chromium "GPU stall due to ReadPixels" performance warning at 1440 (software GL artefact of `preserveDrawingBuffer`/`getImageData` sampling).
- No image requests at all: art is canvas, SVG (13 inline SVGs) and CSS.

## 3. Inferences (not directly observed)

- The studio positions itself on **measurable rigor and honesty** (audit first, fixed price after, no lock-in) instead of on a portfolio; it probably has few public case studies yet, so the page substitutes mock UI + proof widgets for work samples.
- Writing a raw-WebGL particle field and all interaction by hand (no libs) suggests a very small payload is a deliberate selling point ("under a second to first paint"), and that the site doubles as the proof of the claim.
- The Arabic word-as-brand plus the RTL differentiator block suggest an Arab-market or diaspora buyer, but the site itself ships no Arabic version, so the RTL claim is not demonstrated on the page. (A mismatch worth noting, not a verified fact about their delivery.)
- The mailto-only contact is likely intentional gatekeeping to qualify enquiries, at a cost in conversion volume.
- The single-font decision and the lack of a mono face is a branding simplification; labels get their "technical" feel purely from tracking and uppercase.

## 4. The 10 strongest ideas

1. **One persistent fixed-canvas particle field that morphs between figures as sections change** (hero mark, stack, steps) — one GPU scene instead of per-section scenes.
2. **Brand mark as the hero object**, made of particles; the logo is the main visual.
3. **Mock product UI frames built in HTML/SVG** (dashboard, shop, site, app) with floating metric badges, replacing screenshots and stock.
4. **"Stack, in full" as hoverable layered tiers** with colour-coded numbers; hover lifts the tier and changes the background figure.
5. **Pinned scroll method** with a left rail, active-step accordion, big counter and progress bar; each step has its own background figure.
6. **Proof widgets next to every claim** (audit findings card, RTL toggle demo, handover checklist).
7. **Pointer light + tilt + magnetic CTA + click shockwave** as a coherent, restrained interaction vocabulary with no custom cursor.
8. **Scene rail** (right-edge ticks with sliding label) as quiet always-on navigation for a long story.
9. **Offer framing as risk reversal:** "we look before we quote", "price once", "send us a URL".
10. **Accessibility/perf discipline in motion:** everything pauses off-screen and when hidden; dedicated `hover:none`, `prefers-reduced-motion` and `prefers-contrast` paths; reduced motion gets a still frame, not a blank.

## 5. Weaknesses / gaps

- Single page, English only, despite RTL/Arabic positioning; no hreflang.
- Email-only conversion: no form, estimator, calculator, WhatsApp or booking; no pricing signal at all.
- No case studies, logos, testimonials or named work; trust rests on self-description.
- Decorative layers (grain, glow, aura) cause `scrollWidth` > viewport at 390 and 768 px.
- Reduced-motion removes the preloader and sets near-zero durations but leaves 73 running (instant) animations and smooth-scroll CSS enabled.
- Fonts via Google Fonts at runtime (third-party dependency, swap flash); heavy 132 px type with negative tracking can break for Arabic.
- Analytics beacon (Cloudflare) blocked in my environment; no consent mechanism visible.
- Rail labels and sections are dense with ALL-CAPS tracked text, which is weak for Arabic (no case) and for low-vision readers.

## 6. Adaptation for Devora

Context: dark cosmic surfaces, amber `#f2a84b`, `< • >` DevoraMark, Arabic-first RTL + English, three pillars (Websites · Automation & AI agents · Custom software), two lead calculators (website cost estimator, automation ROI), three.js + GSAP + Lenis + motion already installed, no-shadow rule, single 920 px breakpoint.

| # | Zawiya idea | Adapt for Devora (not copy) |
|---|---|---|
| 1 | One persistent particle field morphing per section | One fixed three.js scene (already the engine) but replace the 21-viewport story with a **short, linked homepage**: 5–6 sections drive one scene state (`Points` + a few uniforms), disposed on unmount. Figures follow the three pillars; use the amber/cosmic palette, not coral/violet gradients. Mobile = fewer points, static fallback. |
| 2 | Brand mark as hero object | Hero sculpture is the `< • >` DevoraMark in points; the amber bullet is the lead point that pulses. Mark sampled from the real SVG so it matches the logo in RTL (the bracket pair mirrors; the dot stays centred). |
| 3 | Mock UI frames instead of screenshots | Three frames per pillar: a bilingual site (RTL/LTR flip), an agent chat + workflow node graph, and a software dashboard. Built in HTML/SVG with `logical` properties so they mirror automatically; floating badges show real numbers from the calculators (e.g., an estimate range). |
| 4 | Hoverable layered stack | Present the **three pillars as layered tiers** (not 6 tech layers): each expands to sub-capabilities and a "see pricing/estimate" link; hover/tap lifts via border + amber glow (no shadows) and can change the scene figure. Tap-to-activate on touch. |
| 5 | Pinned method with rail and counter | One canonical **process taxonomy** (replace the 3 existing ones) as a 4–5 step pinned rail using GSAP ScrollTrigger + Lenis; progress bar in amber; collapsed to a static list under reduced motion and on narrow screens. |
| 6 | Proof widgets beside claims | Make the two calculators the proof: an inline mini estimator ("what would this site cost?") and an ROI slider card in the pillar sections, plus an RTL/EN toggle demo and a handover checklist. Every claim gets a verifiable artefact; no fabricated testimonials. |
| 7 | Pointer vocabulary (glow, tilt, magnetic, shockwave) | Keep a small subset: pointer light on surfaces and magnetic primary CTA via existing motion hooks; click pulse in the field. Fine-pointer only (`usePointerFine`), no custom cursor, nothing hover-only. |
| 8 | Scene rail | Keep a slim rail but place it on the **inline-end** edge so it mirrors in RTL; labels in Arabic first, no uppercase styling for Arabic; it also doubles as keyboard/aria navigation. |
| 9 | Risk-reversal offer framing | Offer a **free quick audit/estimate**: "send your URL or answer six questions, get a range before a call". The estimator and ROI results capture leads with source tagging; copy states the price rule once, sourced from one pricing config. |
| 10 | Perf and a11y discipline in motion | Pause rAF off-screen and when hidden, dispose all geometries/materials/listeners, honor `prefers-reduced-motion` (still frame, not blank) and coarse pointers; single breakpoint 920 px for layout, density chosen by quality tier rather than more breakpoints. |

Additional gaps to exploit where Zawiya is weak: ship real Arabic + English (hreflang), offer WhatsApp and a form with calculators as conversion paths, show real work and pricing signals, and fix decorative overflow by clipping layers with `overflow: clip` on the layer container rather than the body.
