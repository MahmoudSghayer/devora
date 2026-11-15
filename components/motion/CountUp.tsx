'use client';

import {useEffect, useRef} from 'react';
import {animate, useInView, useReducedMotion} from 'motion/react';

/**
 * Animated number with tabular numerals. Server HTML contains the FINAL value
 * (works without JS / for crawlers); on first view it counts up from 0, and on
 * later `value` changes it springs from the number currently shown.
 *
 * Formatting is described with serialisable props (locale + Intl options) so
 * this can be used from Server Components.
 */
export default function CountUp({
  value,
  locale = 'en',
  options,
  duration = 1.4,
  spring = false,
  className = '',
}: {
  value: number;
  locale?: string;
  options?: Intl.NumberFormatOptions;
  duration?: number;
  /** springy retarget for live, frequently-changing values (calculators) */
  spring?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const started = useRef(false);
  const reduced = useReducedMotion();
  const inView = useInView(ref, {once: true, amount: 0.4});
  const tag = locale === 'ar' ? 'ar-u-nu-latn' : locale;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = new Intl.NumberFormat(tag, options);
    const write = (n: number) => {
      shown.current = n;
      el.textContent = fmt.format(n);
    };
    if (reduced) {
      write(value);
      return;
    }
    if (!started.current) {
      if (!inView) return;
      started.current = true;
      const c = animate(0, value, {duration, ease: [0.22, 1, 0.36, 1], onUpdate: write});
      return () => c.stop();
    }
    const c = animate(shown.current, value, spring
      ? {type: 'spring', stiffness: 120, damping: 20, onUpdate: write}
      : {duration: 0.7, ease: [0.22, 1, 0.36, 1], onUpdate: write});
    return () => c.stop();
  }, [value, inView, reduced, tag, options, duration, spring]);

  return (
    <span ref={ref} className={`num ${className}`}>
      {new Intl.NumberFormat(tag, options).format(value)}
    </span>
  );
}
