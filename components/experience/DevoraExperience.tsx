'use client';

import {useEffect, useRef, useSyncExternalStore} from 'react';
import type {CSSProperties} from 'react';
import type {DevoraCopy, Quality} from '@/lib/experience/devora-universe';
import StarField from '@/components/chrome/StarField';

// Coarse-pointer (phone/tablet) detection as an external store: SSR-safe
// (server snapshot is always false, so hydration matches) and re-evaluates if
// the pointer type changes. Reused to decide whether to show the 2D StarField.
const COARSE = '(pointer: coarse)';
const subscribeCoarse = (cb: () => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const m = window.matchMedia(COARSE);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};
const getCoarse = () => window.matchMedia(COARSE).matches;

// Client shell for the DEVORA OS homepage. The markup is server-rendered (passed
// in as `html`) so it ships in the initial response; here we only mount the
// DevoraUniverse controller against it and tear it down on unmount. The
// controller is dynamically imported so three/gsap/lenis stay off the critical
// path — a prefers-reduced-motion visitor never loads or runs them.
//
// On phones/tablets (coarse pointer) we force the controller's static, no-WebGL
// path: it calls init() directly and never calls loadLibs(), so the ~665 KB of
// three/gsap/lenis is never downloaded or run. The page stays fully functional
// (reveals shown, scroll-synced panels, native scroll) and a cheap 2D StarField
// gives it the same cosmos without the WebGL cost.
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
  // false on the server + first hydration paint, then the real value — so the
  // StarField only mounts once the client confirms a coarse pointer.
  const mobile = useSyncExternalStore(subscribeCoarse, getCoarse, () => false);

  useEffect(() => {
    let cancelled = false;
    let controller: {destroy: () => void} | null = null;
    const mq = (q: string) =>
      typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(q).matches;
    const reduced = mq('(prefers-reduced-motion: reduce)');
    const coarse = mq('(pointer: coarse)'); // phones + tablets → skip WebGL

    import('@/lib/experience/devora-universe').then(({DevoraUniverse}) => {
      if (cancelled || !rootRef.current) return;
      controller = new DevoraUniverse(rootRef.current, {
        copy,
        accent,
        quality,
        grain,
        // Coarse pointer OR reduced-motion → static, no-WebGL, no loadLibs().
        reducedMotion: reduced || coarse,
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
    <>
      {mobile && (
        // z-[1]: above the experience root's opaque base, below the atmosphere
        // overlays (z 2) and content (z 10). Cheap 2D cosmos in place of WebGL.
        <StarField className="pointer-events-none fixed inset-0 z-[1] h-full w-full" />
      )}
      <div
        ref={rootRef}
        data-experience
        style={style}
        dangerouslySetInnerHTML={{__html: html}}
      />
    </>
  );
}
