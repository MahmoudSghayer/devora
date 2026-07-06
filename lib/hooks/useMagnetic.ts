'use client';

import type {MouseEvent} from 'react';
import {useMotionValue, useSpring, useReducedMotion} from 'motion/react';

// Magnetic pull toward the cursor. Symmetric about the element's own centre in
// viewport px, so it is RTL-agnostic. Springs back on leave.
export function useMagnetic(sx = 0.22, sy = 0.3) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = {stiffness: 150, damping: 15, mass: 0.1};
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * sx);
    y.set((e.clientY - r.top - r.height / 2) * sy);
  };
  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return {x: springX, y: springY, onMouseMove, onMouseLeave};
}
