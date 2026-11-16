'use client';

import type {ReactNode, PointerEvent, ElementType} from 'react';

/**
 * Wraps a surface and feeds the cursor position to the `.spot` CSS utility
 * (radial light + border highlight). Pure CSS does the painting, so there is no
 * React re-render per pointermove. Without a fine pointer the CSS never shows.
 */
export default function Spotlight({
  children,
  className = '',
  tone = 'amber',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'amber' | 'signal' | 'soft';
  as?: ElementType;
}) {
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  const toneCls = tone === 'signal' ? 'spot-signal' : tone === 'soft' ? 'spot-soft' : '';
  return (
    <Tag className={`spot ${toneCls} ${className}`} onPointerMove={onMove}>
      {children}
    </Tag>
  );
}
