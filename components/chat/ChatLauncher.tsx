'use client';

import {motion, useReducedMotion} from 'motion/react';
import {EASE} from '@/lib/motion';

export default function ChatLauncher({
  open,
  label,
  onClick,
}: {
  open: boolean;
  label: string;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={open}
      whileHover={reduce ? undefined : {scale: 1.05}}
      whileTap={reduce ? undefined : {scale: 0.95}}
      transition={{duration: 0.2, ease: EASE}}
      className="grid size-14 place-items-center self-end rounded-full bg-amber text-on-amber outline-none ring-offset-2 ring-offset-bg focus-visible:ring-2 focus-visible:ring-amber"
    >
      {open ? (
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </motion.button>
  );
}
