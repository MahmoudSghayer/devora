'use client';

import {useEffect} from 'react';
import {getLenis} from '@/lib/scroll/lenis-store';

/** Locks page scroll while `locked` (pauses Lenis too). */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    getLenis()?.stop();
    return () => {
      html.style.overflow = prev;
      getLenis()?.start();
    };
  }, [locked]);
}
