'use client';

import type {ReactNode} from 'react';
import {motion} from 'motion/react';
import {useMagnetic} from '@/lib/hooks/useMagnetic';

// Wraps a CTA (button/link) in an inline-block motion layer that pulls toward
// the cursor and springs back. The whole child translates together.
export default function Magnetic({
  children,
  sx = 0.22,
  sy = 0.3,
  className = '',
}: {
  children: ReactNode;
  sx?: number;
  sy?: number;
  className?: string;
}) {
  const {x, y, onMouseMove, onMouseLeave} = useMagnetic(sx, sy);
  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{x, y}}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.span>
  );
}
