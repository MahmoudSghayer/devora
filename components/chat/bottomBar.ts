'use client';

import {useEffect, type RefObject} from 'react';

/** CSS var holding the height (px) of the page's mobile bottom bar; 0 when none. */
export const BOTTOM_BAR_VAR = '--bottom-bar-h';

/**
 * Floating controls (chat launcher + panel, scroll toggle) sit above this offset
 * so they never overlap a mobile bottom bar (estimate sheet, live range bar).
 */
export const aboveBottomBar = (gap: string) => `calc(${gap} + var(${BOTTOM_BAR_VAR}, 0px))`;

/**
 * Publish the height of a mounted bottom bar. Sets `--bottom-bar-h` on <html>
 * and `data-bottom-bar` on <body>; both are removed on unmount. A hidden bar
 * (display:none at `nav:`) reports 0, so desktop is unaffected.
 */
export function useBottomBar(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) {
        root.style.setProperty(BOTTOM_BAR_VAR, `${h}px`);
        document.body.dataset.bottomBar = '';
      } else {
        root.style.removeProperty(BOTTOM_BAR_VAR);
        delete document.body.dataset.bottomBar;
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty(BOTTOM_BAR_VAR);
      delete document.body.dataset.bottomBar;
    };
  }, [ref]);
}
