'use client';

import {useEffect, useRef} from 'react';
import {createMarkScene, type MarkHandle} from '@/lib/three/mark-scene';

export type MarkParticlesProps = {
  className?: string;
  /** Glow / particle strength, 1 = default. */
  intensity?: number;
  /** Pointer parallax, repulsion and click pulse (fine pointers only). */
  interactive?: boolean;
  /** Fired after the first frame has been drawn. */
  onReady?: () => void;
  /** Fired when WebGL setup fails or the context is not restored; show the poster instead. */
  onError?: () => void;
};

const MAX_DPR = 1.5;
const RESTORE_TIMEOUT_MS = 2000;
const INTERACTIVE = 'a,button,input,textarea,select,summary,[role=button]';

function budget(width: number, height: number) {
  const nav = navigator as Navigator & {deviceMemory?: number};
  const cores = nav.hardwareConcurrency || 8;
  const weak = cores <= 4 || (nav.deviceMemory || 8) <= 4;
  const area = Math.min(1, Math.max(0.65, (width * height) / (1440 * 900)));
  const count = weak ? 3500 : Math.max(5500, Math.round((cores >= 8 ? 9000 : 7000) * area));
  return {count, dustCount: weak ? 350 : Math.round(800 * area)};
}

export default function MarkParticles({
  className = '', intensity = 1, interactive = true, onReady, onError,
}: MarkParticlesProps) {
  const box = useRef<HTMLDivElement>(null);
  const live = useRef({intensity, interactive, onReady, onError, handle: null as MarkHandle | null});

  useEffect(() => {
    live.current.intensity = intensity;
    live.current.interactive = interactive;
    live.current.onReady = onReady;
    live.current.onError = onError;
    live.current.handle?.setIntensity(intensity);
  }, [intensity, interactive, onReady, onError]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // A fresh canvas per mount: a context force-lost on cleanup can't be reused (StrictMode).
    const cv = document.createElement('canvas');
    cv.className = 'absolute inset-0 size-full';
    el.appendChild(cv);
    const state = live.current;

    let handle: MarkHandle;
    try {
      const style = getComputedStyle(document.documentElement);
      const token = (name: string) => style.getPropertyValue(name).trim();
      handle = createMarkScene({
        canvas: cv,
        colors: {amber: token('--color-amber'), amberHi: token('--color-amber-hi'), signal: token('--color-signal')},
        ...budget(el.clientWidth, el.clientHeight),
        antialias: false,
        maxDpr: MAX_DPR,
        intensity: state.intensity,
      });
    } catch {
      cv.remove();
      queueMicrotask(() => state.onError?.());
      return;
    }
    state.handle = handle;

    let raf = 0;
    let last = 0;
    let inView = true;
    let visible = !document.hidden;
    let lost = false;
    let ready = false;
    let failed = false;
    let restoreTimer = 0;

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
    const fail = () => {
      if (failed) return;
      failed = true;
      stop();
      state.onError?.();
    };
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      try {
        handle.render(dt);
      } catch {
        fail();
        return;
      }
      if (!ready) {
        ready = true;
        state.onReady?.();
      }
      if (inView && visible && !lost) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || failed || !inView || !visible || lost) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const measure = () => {
      handle.resize(el.clientWidth, el.clientHeight);
      if (!raf && !lost && !failed) {
        try { handle.render(0); } catch { fail(); }
      }
    };
    const ndc = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2] as const;
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const io = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      if (inView) start(); else stop();
    });
    io.observe(el);
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) start(); else stop();
    };
    const fine = window.matchMedia('(pointer: fine)').matches;
    const onMove = (e: PointerEvent) => {
      if (state.interactive && fine) handle.setPointer(...ndc(e));
    };
    const onDown = (e: PointerEvent) => {
      if (!state.interactive || !fine || (e.target as Element).closest?.(INTERACTIVE)) return;
      const [x, y] = ndc(e);
      if (Math.abs(x) <= 1 && Math.abs(y) <= 1) handle.pulse(x, y);
    };
    const onLeave = () => handle.clearPointer();
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      stop();
      restoreTimer = window.setTimeout(fail, RESTORE_TIMEOUT_MS);
    };
    const onRestored = () => {
      lost = false;
      window.clearTimeout(restoreTimer);
      measure();
      start();
    };

    const root = document.documentElement;
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointermove', onMove, {passive: true});
    window.addEventListener('pointerdown', onDown, {passive: true});
    root.addEventListener('pointerleave', onLeave);
    cv.addEventListener('webglcontextlost', onLost);
    cv.addEventListener('webglcontextrestored', onRestored);
    measure();
    start();

    return () => {
      stop();
      window.clearTimeout(restoreTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerleave', onLeave);
      cv.removeEventListener('webglcontextlost', onLost);
      cv.removeEventListener('webglcontextrestored', onRestored);
      state.handle = null;
      handle.dispose();
      cv.remove();
    };
  }, []);

  return <div ref={box} aria-hidden className={`relative size-full overflow-hidden ${className}`} />;
}
