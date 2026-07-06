'use client';

import type {ReactNode} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {EASE} from '@/lib/motion';

// Hero entrance: fade up 26px on mount, staggered by explicit index
// (100 + index*110 ms). Reduced motion → instant. Content ends visible.
export default function HeroReveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{opacity: 0, y: 26}}
      animate={{opacity: 1, y: 0}}
      transition={
        reduced
          ? {duration: 0}
          : {duration: 0.75, ease: EASE, delay: (100 + index * 110) / 1000}
      }
    >
      {children}
    </motion.div>
  );
}
