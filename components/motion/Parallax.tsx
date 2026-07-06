'use client';

import type {ReactNode} from 'react';
import {useRef} from 'react';
import {motion} from 'motion/react';
import {useParallax} from '@/lib/hooks/useParallax';

// Parallax image frame. The outer box owns the aspect-ratio + rounding +
// overflow-hidden (via className); the inner layer is oversized (-inset-y-15%)
// so the vertical travel never reveals an edge. Children should fill it
// (h-full w-full object-cover).
export default function Parallax({
  speed = 0.08,
  className = '',
  children,
}: {
  speed?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const y = useParallax(ref, speed);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{y}} className="absolute inset-x-0 -inset-y-[15%]">
        {children}
      </motion.div>
    </div>
  );
}
