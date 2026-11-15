'use client';

import {useSyncExternalStore} from 'react';

const QUERY = '(hover: hover) and (pointer: fine)';

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** True only on devices with a hover-capable fine pointer (mouse / trackpad).
 *  Server snapshot is false so pointer effects never render on touch/SSR. */
export function usePointerFine(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
