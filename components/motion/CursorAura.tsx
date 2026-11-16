'use client';

import {useEffect, useRef} from 'react';
import {useReducedMotion} from 'motion/react';
import {usePointerFine} from '@/lib/hooks/usePointerFine';

/**
 * Soft light that trails the pointer. It NEVER hides the native cursor (the old
 * homepage drew a second cursor on top of it). It swells over interactive
 * elements. Fine-pointer + motion-allowed only; position is written straight to
 * the DOM inside rAF so React never re-renders.
 */
export default function CursorAura() {
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const enabled = fine && !reduced;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    let tx = -200, ty = -200, x = tx, y = ty, scale = 1, target = 1, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      scale += (target - scale) * 0.18;
      el.style.transform = `translate3d(${x - 120}px, ${y - 120}px, 0) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = '1';
      const t = e.target as Element | null;
      target = t?.closest('a,button,[role="button"],input,select,textarea,summary') ? 1.7 : 1;
    };
    const leave = () => { el.style.opacity = '0'; };
    window.addEventListener('pointermove', move, {passive: true});
    document.documentElement.addEventListener('pointerleave', leave);
    raf = requestAnimationFrame(loop);
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed start-0 top-0 h-[240px] w-[240px] rounded-full opacity-0 transition-opacity duration-300"
      style={{
        zIndex: 'var(--z-cursor)',
        background:
          'radial-gradient(closest-side, color-mix(in oklab, var(--color-amber) 14%, transparent), transparent)',
        mixBlendMode: 'screen',
        willChange: 'transform',
      }}
    />
  );
}
