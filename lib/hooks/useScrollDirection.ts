'use client';

import {useEffect, useState} from 'react';

// Returns true when the header should hide: scrolling down AND past `threshold`.
// rAF-throttled; returns on any upward scroll. Mirrors the prototype exactly.
export function useScrollDirection(threshold = 320) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setHidden(y > threshold && y > last);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return hidden;
}
