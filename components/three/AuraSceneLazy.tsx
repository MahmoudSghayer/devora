'use client';

/**
 * Poster-first loader for the WebGL particle mark.
 *
 * Server HTML (and reduced-motion / no-WebGL / coarse-pointer users) only ever gets the static
 * CSS poster. After first paint + idle, capable fine-pointer devices lazy-load `MarkParticles`
 * and cross-fade the canvas over the poster. Coarse pointers (phones) never load WebGL.
 */
import {useEffect, useState, type ComponentType} from 'react';
import type {MarkParticlesProps} from './MarkParticles';
import Poster from './Poster';

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

export default function AuraSceneLazy({className = '', onReady, onError, ...rest}: MarkParticlesProps) {
  const [Scene, setScene] = useState<ComponentType<MarkParticlesProps> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduced || coarse) return;
    let cancelled = false;
    const load = () => {
      if (cancelled || !webglAvailable()) return;
      import('./MarkParticles').then((m) => { if (!cancelled) setScene(() => m.default); }, () => {});
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
