'use client';

import type {ReactNode} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {EASE, REVEAL_VIEWPORT} from '@/lib/motion';

// Scroll reveal: start opacity 0 / translateY(32px), reveal when ~12% in view
// (once). Stagger via explicit `delay` (ms) or `index` (auto index*90ms).
// Reduced motion → instant snap. whileInView never permanently hides
// off-screen content; on-load in-view items animate immediately.
export default function Reveal({
  children,
  delay = 0,
  index,
  className,
}: {
  children: ReactNode;
  delay?: number;
  index?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const d = index != null ? index * 0.09 : delay / 1000;
  return (
    <motion.div
      className={className}
      initial={{opacity: 0, y: 32}}
      whileInView={{opacity: 1, y: 0}}
      viewport={REVEAL_VIEWPORT}
      transition={reduced ? {duration: 0} : {duration: 0.75, ease: EASE, delay: d}}
    >
      {children}
    </motion.div>
  );
}
