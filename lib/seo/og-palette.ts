// OG/Twitter images render through next/og (Satori), which cannot read CSS
// variables, so the theme tokens are mirrored here as named constants. This is
// the ONLY file allowed to hold raw colours for SEO output. Keep in sync with
// the matching `--color-*` tokens in app/globals.css.
export const OG_PALETTE = {
  /** --color-bg */
  bg: '#050609',
  /** --color-surface */
  surface: '#0d0f16',
  /** --color-border-card */
  borderCard: '#232732',
  /** --color-ink */
  ink: '#f5f6f8',
  /** --color-muted */
  muted: '#9aa0ab',
  /** --color-amber */
  amber: '#f2a84b',
  /** --color-amber-hi */
  amberHi: '#ffc46b',
  /** --color-amber at ~22% (aura glow) */
  amberGlow: 'rgba(242, 168, 75, 0.22)',
  /** --color-amber at ~8% (outer aura) */
  amberGlowFaint: 'rgba(242, 168, 75, 0.06)',
} as const;
