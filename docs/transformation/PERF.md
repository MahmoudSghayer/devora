# Performance and accessibility (Phase 6)

Method: production build (`next build`, in a scratchpad copy so other agents' servers were untouched), `next start`, Lighthouse 12 mobile preset (Moto G emulation, simulated 4x CPU / slow 4G) with Playwright's Chromium, axe-core via `@axe-core/playwright` (not added to package.json). `/` is the default Arabic locale, `/en` English.

## Lighthouse mobile (quiet-machine run; Perf / A11y / SEO / BP, LCP, TBT, CLS)

| Page | Before | After |
|---|---|---|
| `/en` | 97 / 97 / 92 / 96, 1.4s, 190ms, 0 | 98 / 100 / 92 / 96, 1.2s, 180ms, 0 |
| `/` (ar) | 98 / 97 / 92 / 96, 1.4s, 150ms, 0.002 | 99 / 100 / 92 / 96, 1.2s, 110ms, 0 |
| `/estimate` | 99 / 96 / 92 / 96, 1.2s, 130ms | 97 / 100 / 92 / 96, 1.1s, 190ms |
| `/automation-roi` | 98 / 96 / 92 / 96, 1.2s, 150ms | 98 / 100 / 92 / 96, 1.1s, 150ms |
| `/discuss` | 100 / 96 / 92 / 96, 1.2s, 60ms | 99 / 100 / 92 / 96, 1.1s, 120ms |
| `/services` (ar) | **79** / 96 / 92 / 96, **5.2s** LCP | **99** / 100 / 92 / 96, 1.1s |

Desktop preset: `/` before 100 / LCP 0.4s / TBT 0ms / CLS 0.003; `/en` after 100 / LCP 0.3s / TBT 0ms / CLS 0. A desktop Lighthouse run of the Arabic `/` on the after build never completed in this headless sandbox (software-GL WebGL stalls the trace; the same page loads in 0.4s and renders at ~19fps in Playwright, identical to the base build), so the canvas-path TBT is unmeasured by Lighthouse there.

Notes
- SEO 92 is a localhost artefact: the `canonical` audit fails because the canonical is `https://devora.design/...` while the tested origin is `localhost`. All other SEO audits pass; on the real domain it is 100.
- Best-practices 96: `/_vercel/insights/script.js` 404s off Vercel only.
- Later re-runs were taken while other agents ran E2E suites on the same machine: base and after both swung to TBT 500-1300ms (base `/en`: 530-920ms; after: 680-880ms), so TBT deltas below ~300ms are noise here. LCP, CLS, a11y and payload are deterministic.

## What changed

1. **Message scoping.** The root layout now provides only `common` + `chat`; pages wrap client islands in `components/i18n/ScopedMessages` (server component, `lib/i18n/pickMessages.ts`) with exactly the namespaces they use (`estimator`, `roi`, `discuss`, `contact`, `homeB`; `common` is always included for the arrow buttons/links). HTML payload on `/en` (raw / gzip): 318 KB / 77.6 KB -> 252 KB / 56.6 KB; `/en/estimate` 137 / 33.9 -> 79 / 14.5; `/en/automation-roi` 153 / 36.0 -> 104 / 20.5; `/en/discuss` 139 / 34.4 -> 76 / 14.3; `/en/services` 183 / 40.3 -> 114 / 19.1. Console scan of every route (EN + AR, 390 + 1440): no `MISSING_MESSAGE`, no page errors.
2. **Chat widget.** `ChatWidgetLazy` renders a static launcher (same size/position, no CLS) in the SSR HTML and loads the widget chunk on idle (4s timeout) or first pointer/key/touch/scroll; a click before the chunk loads opens the panel on mount (`ChatWidget initialOpen`). Realtime presence/conversation channels now subscribe only once a conversation exists (panel opened). Verified in Chromium EN + AR: launcher visible at DOMContentLoaded, identical bounding box after the swap, panel opens, send posts `/api/conversation` + `/api/chat`, no console errors.
3. **Fonts.** Cairo (Arabic subset, 30 KB) is self-hosted in `public/fonts` with `@font-face` + metric-matched fallback in `globals.css`; `app/[locale]/layout.tsx` preloads it only when `locale === 'ar'` (next/font can only preload per route file, not per locale). EN never requests it (unicode-range). `display: swap` kept; fallback uses the same size-adjust/overrides next/font generated. `/fonts/*` is cached immutable.
4. **PageIntro entrance was hydration-gated.** `HeroReveal`/`WordReveal` started at opacity 0 / clipped and animated only after JS hydrated, so every sub-page LCP (e.g. `/services` 5.2s) waited for hydration. They are now CSS-only server components (`.hero-rise` / `.word-rise`, reduced-motion safe), so the headline paints with first paint and ships less JS.
5. **Assets.** Removed 5 unreferenced starter SVGs. All raster images already use `next/image` with `sizes`; the only raw `<img>` is inside the `ImageResponse` apple-icon (required).
6. **A11y (axe):** contrast of `text-faint` (3.9:1) and `text-faint-2` (2.9:1) raised to >= 4.5:1; logo link name now derives from its visible text (label-in-name).

## axe result (all 12 routes x EN/AR x 390/1440)

After fixes: 0 violations except the logo label-in-name (fixed afterwards in `Logo.tsx`; verified on the DOM with axe, 0 violations).

## Remaining / not done

- Mobile TBT is dominated by hydration + Motion/React; unused JS reported by Lighthouse is ~60 KB + ~50 KB in two shared chunks (framework/motion). No further splitting attempted.
- A `poster` CSS chunk is preloaded on every marketing page but only used on the home hero (Chrome logs an "unused preload" warning).
- `/api/*` and 404 console noise: only the Vercel insights script off-platform.
- Calculators were scanned at their first step only.

## Files touched

`app/[locale]/layout.tsx`, `app/globals.css`, `lib/fonts.ts`, `lib/i18n/pickMessages.ts` (new), `components/i18n/ScopedMessages.tsx` (new), `components/chat/ChatWidgetLazy.tsx`, `components/chat/ChatWidget.tsx`, `components/chat/useRealtimeConversation.ts`, `components/motion/HeroReveal.tsx`, `components/motion/WordReveal.tsx`, `components/chrome/Logo.tsx`, `next.config.ts`, `public/fonts/cairo-arabic.9ff27b8a.woff2` (new), `public/*.svg` (removed), page wrappers in `app/[locale]/(marketing)/{page,estimate,automation-roi,discuss,contact}`.
