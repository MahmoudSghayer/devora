// Master easing from the design handoff (ease-out-quint feel).
// Framer accepts the cubic-bezier control points as a 4-tuple.
export const EASE = [0.22, 1, 0.36, 1] as const;

// Shared viewport config for scroll reveals: fire once, at ~12% visibility,
// with a -60px bottom margin (mirrors the prototype's IntersectionObserver).
export const REVEAL_VIEWPORT = {
  once: true,
  amount: 0.12,
  margin: '0px 0px -60px 0px',
} as const;
