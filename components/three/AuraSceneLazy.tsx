'use client';

/**
 * Poster-first loader for the WebGL aura.
 *
 * Server HTML (and reduced-motion / no-WebGL / coarse-pointer users) only ever gets the static
 * CSS poster. After first paint + idle, capable fine-pointer devices lazy-load `AuraScene`
 * and cross-fade the canvas over the poster.
 *
 * Mobile decision: coarse pointer => poster only. The scene has not been profiled on real
 * phones, and the brief only allows a lighter mobile scene if measured, so we do not guess.
 */
import {useEffect, useState, type ComponentType} from 'react';
import type {AuraSceneProps} from './AuraScene';

type Props = AuraSceneProps;

const IDLE_TIMEOUT_MS = 1500;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

const DOTS = [
  ['14%', '28%', 3], ['82%', '22%', 2], ['70%', '78%', 3], ['24%', '72%', 2],
  ['90%', '56%', 2], ['8%', '52%', 2], ['52%', '10%', 2], ['40%', '90%', 3],
] as const;

function Poster() {
  return (
    <div aria-hidden className="absolute inset-0 [container-type:size]">
      <div
        className="absolute inset-0 m-auto size-[min(62cqw,62cqh)] rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, var(--color-amber-hi) 0%, color-mix(in oklab, var(--color-amber) 55%, transparent) 22%, color-mix(in oklab, var(--color-amber) 14%, transparent) 48%, transparent 70%)',
        }}
      />
      {DOTS.map(([x, y, s]) => (
        <span
          key={`${x}${y}`}
          className="absolute rounded-full bg-amber-hi opacity-60"
          style={{insetInlineStart: x, top: y, width: s, height: s}}
        />
      ))}
    </div>
  );
}

export default function AuraSceneLazy({className = '', onReady, onError, ...rest}: Props) {
  const [Scene, setScene] = useState<ComponentType<AuraSceneProps> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduced || coarse) return;
    let cancelled = false;
    const load = () => {
      if (cancelled || !webglAvailable()) return;
      import('./AuraScene').then((m) => { if (!cancelled) setScene(() => m.default); }, () => {});
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: {timeout: number}) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    // Wait for first paint, then idle.
    let idle = 0;
    let timer = 0;
    const raf = requestAnimationFrame(() => {
      if (w.requestIdleCallback) idle = w.requestIdleCallback(load, {timeout: IDLE_TIMEOUT_MS});
      else timer = window.setTimeout(load, 200);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (idle) w.cancelIdleCallback?.(idle);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`relative size-full overflow-hidden ${className}`}>
      <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}>
        <Poster />
      </div>
      {Scene && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <Scene
            {...rest}
            onReady={() => { setReady(true); onReady?.(); }}
            onError={() => { setScene(null); setReady(false); onError?.(); }}
          />
        </div>
      )}
    </div>
  );
}
