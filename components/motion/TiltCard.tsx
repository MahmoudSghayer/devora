'use client';

import type {ReactNode, PointerEvent} from 'react';
import {motion, useMotionValue, useReducedMotion, useSpring} from 'motion/react';
import {usePointerFine} from '@/lib/hooks/usePointerFine';

/**
 * Pointer-driven 3D tilt with a moving specular highlight (.tilt-sheen).
 * No-op without a fine pointer or under reduced motion. `max` is degrees.
 */
export default function TiltCard({
  children,
  className = '',
  max = 7,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  as?: 'div' | 'li' | 'article';
}) {
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const cfg = {stiffness: 170, damping: 18, mass: 0.2};
  const srx = useSpring(rx, cfg);
  const sry = useSpring(ry, cfg);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (!enabled) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    el.style.setProperty('--hx', `${px * 100}%`);
    el.style.setProperty('--hy', `${py * 100}%`);
    el.style.setProperty('--sheen', '1');
  };
  const onLeave = (e: PointerEvent<HTMLElement>) => {
    rx.set(0);
    ry.set(0);
    e.currentTarget.style.setProperty('--sheen', '0');
  };

  const Comp = motion[as];
  return (
    <Comp
      className={`tilt-sheen relative ${className}`}
      style={enabled ? {rotateX: srx, rotateY: sry, transformPerspective: 900} : undefined}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </Comp>
  );
}
