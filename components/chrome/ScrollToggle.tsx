'use client';

import {useEffect, useState} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import {useLocale} from 'next-intl';
import {EASE} from '@/lib/motion';

// Floating scroll control on the START side (the chat widget owns the END
// side, bottom-5 end-5). At the top it points down → one click jumps to the
// bottom; once you've scrolled it points up → one click returns to the top.
// Fixed-position, so it can be mounted anywhere (we render it from Footer).
export default function ScrollToggle() {
  const reduced = useReducedMotion();
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = scrolled;
  const label = toTop
    ? locale === 'ar'
      ? 'العودة إلى الأعلى'
      : 'Back to top'
    : locale === 'ar'
      ? 'الانتقال إلى الأسفل'
      : 'Jump to bottom';

  const handleClick = () => {
    const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
    window.scrollTo({
      top: toTop ? 0 : document.documentElement.scrollHeight,
      behavior,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="fixed bottom-6 start-6 z-40 flex h-12 w-12 items-center justify-center rounded-pill border border-border-ghost bg-[rgba(15,15,15,0.85)] text-ink backdrop-blur-[12px] transition-colors hover:border-amber hover:text-amber print:hidden"
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{rotate: toTop ? 0 : 180}}
        transition={reduced ? {duration: 0} : {duration: 0.3, ease: EASE}}
        className="text-xl leading-none"
      >
        ↑
      </motion.span>
    </button>
  );
}
