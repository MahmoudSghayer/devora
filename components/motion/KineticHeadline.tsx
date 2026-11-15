'use client';

import {useEffect, useRef, type ElementType} from 'react';
import {useLocale} from 'next-intl';
import {useReducedMotion} from 'motion/react';
import {usePointerFine} from '@/lib/hooks/usePointerFine';

/**
 * Headline whose weight swells near the cursor (Space Grotesk and Cairo are
 * both variable fonts). Latin text reacts per character; Arabic reacts per WORD
 * because splitting Arabic into letters would break cursive joining.
 *
 * The text is server-rendered and visible immediately (LCP = the headline);
 * entrance is a short CSS transform+opacity rise that starts at 0.25 opacity.
 * `emphasis` words get the amber colour. Without a fine pointer or with reduced
 * motion it renders as a plain static heading.
 */
export default function KineticHeadline({
  text,
  emphasis = [],
  as: Tag = 'h1',
  className = '',
}: {
  text: string;
  emphasis?: string[];
  as?: ElementType;
  className?: string;
}) {
  const locale = useLocale();
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const perChar = locale !== 'ar';
  const words = text.split(/\s+/).filter(Boolean);
  const active = fine && !reduced;

  useEffect(() => {
    if (!active) return;
    const el = root.current;
    if (!el) return;
    const units = Array.from(el.querySelectorAll<HTMLElement>('[data-k]'));
    let raf = 0, px = -9999, py = -9999;
    const radius = 160;
    const paint = () => {
      raf = 0;
      for (const u of units) {
        const r = u.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const k = Math.max(0, 1 - d / radius);
        u.style.fontWeight = String(Math.round(500 + 200 * k * k));
      }
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const leave = () => {
      px = py = -9999;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    window.addEventListener('pointermove', move, {passive: true});
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [active, text]);

  return (
    <Tag ref={root} className={`kinetic u-track ${className}`}>
      {words.map((w, wi) => {
        const strong = emphasis.includes(w.replace(/[.,،!?؟]/g, ''));
        const delay = Math.min(wi * 70, 420);
        return (
          <span
            key={wi}
            className={`kinetic-word inline-block ${strong ? 'text-amber' : ''}`}
            style={{animationDelay: `${delay}ms`, marginInlineEnd: '0.26em'}}
          >
            {perChar && active
              ? Array.from(w).map((c, ci) => (
                  <span key={ci} data-k className="inline-block" style={{fontWeight: 500}}>
                    {c}
                  </span>
                ))
              : active
                ? <span data-k style={{fontWeight: 500}}>{w}</span>
                : w}
          </span>
        );
      })}
    </Tag>
  );
}
