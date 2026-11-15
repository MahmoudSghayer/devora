'use client';

import {useEffect, useRef} from 'react';
import {createAuraScene, type AuraHandle} from '@/lib/three/scene';

export type AuraSceneProps = {
  className?: string;
  /** Glow / particle strength, 1 = default. */
  intensity?: number;
  /** Pointer parallax + lighting (fine pointers only). */
  interactive?: boolean;
  /** Optional accessible description; the canvas is decorative (aria-hidden) without it. */
  description?: string;
  /** Fired after the first frame has been drawn. */
  onReady?: () => void;
  /** Fired when WebGL setup fails or the context is not restored; show the poster instead. */
  onError?: () => void;
};

const MAX_DPR = 1.5;
const RESTORE_TIMEOUT_MS = 2000;

function dustCount(width: number, height: number) {
  const nav = navigator as Navigator & {deviceMemory?: number};
  const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820;
  const weak = (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4;
  const base = coarse ? 1400 : weak ? 2400 : 4200;
  const area = Math.min(1, Math.max(0.5, (width * height) / (1440 * 900)));
  return Math.round(base * area);
}

export default function AuraScene({
  className = '', intensity = 1, interactive = true, description, onReady, onError,
}: AuraSceneProps) {
  const box = useRef<HTMLDivElement>(null);
  const live = useRef({intensity, interactive, onReady, onError, handle: null as AuraHandle | null});

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
    // A fresh canvas per mount: a context that was force-lost on cleanup can't be reused (StrictMode).
    const cv = document.createElement('canvas');
    cv.className = 'absolute inset-0 size-full';
    el.appendChild(cv);
    const state = live.current;

    let handle: AuraHandle;
    try {
      const style = getComputedStyle(document.documentElement);
      const token = (name: string) => style.getPropertyValue(name).trim();
      handle = createAuraScene({
        canvas: cv,
        colors: {
          amber: token('--color-amber'), amberHi: token('--color-amber-hi'),
          bg: token('--color-bg'), signal: token('--color-signal'),
        },
        dustCount: dustCount(el.clientWidth, el.clientHeight),
        antialias: window.devicePixelRatio < 2,
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
    const finePointer = window.matchMedia('(pointer: fine)').matches;

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
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    const measure = () => {
      handle.resize(el.clientWidth, el.clientHeight);
      if (!raf && !lost && !failed) {
        try { handle.render(0); } catch { fail(); }
      }
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
    const onMove = (e: PointerEvent) => {
      if (!state.interactive || !finePointer) return;
      handle.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
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

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointermove', onMove, {passive: true});
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
      cv.removeEventListener('webglcontextlost', onLost);
      cv.removeEventListener('webglcontextrestored', onRestored);
      state.handle = null;
      handle.dispose();
      cv.remove();
    };
  }, []);

  return (
    <div
      ref={box}
      className={`relative size-full overflow-hidden ${className}`}
      {...(description ? {role: 'img', 'aria-label': description} : {'aria-hidden': true})}
    />
  );
}
