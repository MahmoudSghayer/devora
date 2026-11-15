'use client';

import {useEffect, type RefObject} from 'react';
import {getLenis} from '@/lib/scroll/lenis-store';

type Gsap = typeof import('gsap').gsap;
type ScrollTriggerT = typeof import('gsap/ScrollTrigger').ScrollTrigger;

/**
 * Runs `setup` inside a gsap.context scoped to `scope`, with GSAP + ScrollTrigger
 * lazy-loaded (so pages without scenes never ship them). Skipped entirely under
 * reduced motion. Everything is reverted on unmount. If Lenis is running the
 * ScrollTrigger is kept in sync with it.
 */
export function useScrollScene(
  scope: RefObject<HTMLElement | null>,
  setup: (ctx: {gsap: Gsap; ScrollTrigger: ScrollTriggerT; root: HTMLElement}) => void,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let revert: (() => void) | undefined;
    (async () => {
      const [{gsap}, {ScrollTrigger}] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = getLenis();
      const off = lenis?.on('scroll', ScrollTrigger.update);
      const ctx = gsap.context(() => setup({gsap, ScrollTrigger, root}), root);
      revert = () => {
        ctx.revert();
        off?.();
      };
    })();
    return () => {
      cancelled = true;
      revert?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
