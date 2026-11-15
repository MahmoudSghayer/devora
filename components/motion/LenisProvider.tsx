'use client';

import {useEffect} from 'react';
import {setLenis} from '@/lib/scroll/lenis-store';

/**
 * Smooth scroll for marketing pages. Desktop (fine pointer, ≥ nav breakpoint)
 * only, never under reduced motion; Lenis is dynamically imported after idle so
 * it never competes with first paint. Renders nothing.
 */
export default function LenisProvider() {
  useEffect(() => {
    const ok = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (min-width: 920px) and (prefers-reduced-motion: no-preference)',
    );
    if (!ok.matches) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    const boot = async () => {
      const {default: Lenis} = await import('lenis');
      if (cancelled) return;
      const lenis = new Lenis({lerp: 0.1, wheelMultiplier: 1, autoRaf: true});
      setLenis(lenis);
      destroy = () => {
        lenis.destroy();
        setLenis(null);
      };
    };
    type Idle = Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (n: number) => void;
    };
    const w = window as Idle;
    const hasIdle = typeof w.requestIdleCallback === 'function';
    const id = hasIdle ? w.requestIdleCallback!(boot) : window.setTimeout(boot, 400);
    return () => {
      cancelled = true;
      if (hasIdle) w.cancelIdleCallback?.(id);
      else clearTimeout(id);
      destroy?.();
    };
  }, []);
  return null;
}
