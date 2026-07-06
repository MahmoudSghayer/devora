'use client';

import type {RefObject} from 'react';
import {useScroll, useTransform, useReducedMotion} from 'motion/react';

// Vertical parallax (RTL-safe). Returns a MotionValue<string> percentage to
// feed a motion element's `y`. The consumer wraps this in an overflow-hidden,
// oversized layer so the travel never reveals an edge (see <Parallax>).
export function useParallax(ref: RefObject<HTMLElement | null>, speed = 0.08) {
  const reduced = useReducedMotion();
  const {scrollYProgress} = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const p = 8 * (speed / 0.08); // ~8% of travel at the design's 0.08 speed
  return useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? ['0%', '0%'] : [`${p}%`, `-${p}%`]
  );
}
