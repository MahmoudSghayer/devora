# Devora design system v2

v2 **evolves** the brand — it does not replace it. Near-black cosmic surfaces, the amber "aura" accent (`#f2a84b`) and the `< • >` DevoraMark stay. v2 adds depth, light and interaction. Tokens live in `app/globals.css` (`@theme`, Tailwind v4 CSS-first).

## Principles
1. **Depth without shadows.** No `box-shadow`. Depth = translucent glass layers, hairline borders, radial light (`aura`, `spot`), surface shifts, hover lift.
2. **Amber is the only brand/CTA colour.** The cool **signal** accent (`--color-signal`, `text-signal`, `bg-signal-lo`) is reserved for automation / AI / data visuals (ROI charts, simulator, AI stack nodes). Pillar hues (`pillar-web` = amber, `pillar-auto` = signal, `pillar-soft` = soft violet) are *tints* only.
3. **One breakpoint.** `nav:` (920px) / `max-nav:`. Never `sm/md/lg`.
4. **RTL-first.** Arabic is the default locale. Logical utilities only; `u-mono` / `u-track` on tracked text; never split Arabic into letters.
5. **Motion is optional.** Everything respects `prefers-reduced-motion`; pointer effects need `(hover: hover) and (pointer: fine)`.

## Tokens
| Group | Tokens |
|---|---|
| Surfaces | `bg`, `bg-alt`, `bg-foot`, `surface`, `surface-2`, `featured`, `glass`, `glass-hi` |
| Borders | `border`, `border-sub`, `border-card`, `border-chip`, `border-ghost`, `border-amber`, `glass-border`, `hairline` |
| Text | `ink`, `ink-2`, `muted`, `muted-2`, `faint`, `faint-2` |
| Accents | `amber`, `amber-hi`, `on-amber`, `signal`, `signal-hi`, `signal-lo`, `pillar-*`, `positive`, `danger` |
| Radii | `rounded-pill` · `rounded-panel` (28) · `rounded-card` (18) · `rounded-img` (16) · `rounded-input` (10) · `rounded-chip` (8) |
| Type | `text-display`, `text-h1`, `text-h1-sub`, `text-h2`, `text-h3`, `text-lead`, `text-stat`, `text-cta`, `text-case` (all fluid `clamp`) |
| z-index | `--z-base/raised/sticky/header/sheet/overlay/chat/toast/cursor` — use `style={{zIndex:'var(--z-header)'}}` |
| Rhythm | `py-section` (`--space-section`), `gap-block` (`--space-block`) |
| Fonts | Space Grotesk (variable, Latin) · Cairo (variable, Arabic) · Space Mono (labels) |

## Surface & light utilities
- `.glass` / `.glass-hi` — translucent panel + blur + hairline border.
- `.aura` (+ `aura-signal`, `aura-soft`; `--aura-color`) — soft radial light behind a block.
- `.spot` (+ `spot-signal`, `spot-soft`) — cursor-following radial light on the surface and its 1px border. Feed `--mx/--my` via `<Spotlight>`.
- `.tilt-sheen` — specular highlight used by `<TiltCard>`.
- `.num` — tabular numerals for counters/prices.

## Motion & interaction primitives
`components/motion/*`, `lib/hooks/*`:

| Primitive | Purpose |
|---|---|
| `Reveal`, `WordReveal`, `Parallax` | scroll reveals |
| `Magnetic` | CTA pull toward cursor |
| `TiltCard` | pointer 3D tilt + moving specular highlight |
| `Spotlight` | cursor light on cards (CSS does the painting) |
| `CursorAura` | soft trailing light; **keeps the native cursor** (the old double-cursor is gone) |
| `CountUp` | animated tabular counters; SSR renders the final value |
| `KineticHeadline` | weight swells near the cursor; per-letter in Latin, per-**word** in Arabic; h1 stays an immediate LCP |
| `useScrollScene` | lazy GSAP + ScrollTrigger scoped to a ref, reverted on unmount, synced with Lenis |
| `LenisProvider` | smooth scroll — desktop, fine pointer, motion allowed only; loaded on idle |
| `usePointerFine`, `useFocusTrap`, `useScrollLock` | a11y/interaction building blocks |

Page transitions use React `<ViewTransition>` (`experimental.viewTransition` in `next.config.ts`, `app/[locale]/(marketing)/template.tsx`, CSS in `globals.css`). Browsers without the API simply navigate.

## Accessibility baseline
Global `:focus-visible` ring (amber, 3px offset); skip link in the marketing layout; mobile menu is a modal dialog with focus trap, Escape, scroll lock and localized labels; touch targets ≥ 44px; one `h1` per page; decorative layers `aria-hidden`.

## WebGL
`components/three/*` is the single reusable raw-three island (aura core + particles). It lazy-loads after idle, pauses offscreen/hidden, caps DPR at 1.5, handles context loss, disposes everything on unmount and falls back to a static CSS/SVG poster for reduced motion, no WebGL and coarse pointers.
