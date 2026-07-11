'use client';

import {useEffect, useRef} from 'react';
import type {CSSProperties} from 'react';
import type {DevoraCopy, Quality} from '@/lib/experience/devora-universe';

// Client shell for the DEVORA OS homepage. The markup is server-rendered (passed
// in as `html`) so it ships in the initial response; here we only mount the
// DevoraUniverse controller against it and tear it down on unmount. The
// controller is dynamically imported so three/gsap/lenis stay off the critical
// path — a prefers-reduced-motion visitor never loads or runs them.
export default function DevoraExperience({
  html,
  copy,
  accent = '#F2A84B',
  quality = 'Balanced',
  grain = true,
}: {
  html: string;
  copy: DevoraCopy;
  accent?: string;
  quality?: Quality;
  grain?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let controller: {destroy: () => void} | null = null;
    const reduced =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    import('@/lib/experience/devora-universe').then(({DevoraUniverse}) => {
      if (cancelled || !rootRef.current) return;
      controller = new DevoraUniverse(rootRef.current, {
        copy,
        accent,
        quality,
        grain,
        reducedMotion: reduced,
      });
    });

    return () => {
      cancelled = true;
      if (controller) controller.destroy();
    };
  }, [copy, accent, quality, grain]);

  const style = {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    color: '#F5F6F8',
    overflowX: 'clip',
    ['--accent' as string]: accent,
    background:
      'radial-gradient(120% 80% at 50% -10%, rgba(242,168,75,.07), transparent 55%), radial-gradient(120% 90% at 50% 120%, rgba(58,88,150,.10), transparent 55%), #050609',
    fontFamily:
      'var(--font-general, var(--font-space-grotesk)), var(--font-arabic), sans-serif',
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      data-experience
      style={style}
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
}
