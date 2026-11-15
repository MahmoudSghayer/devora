'use client';

import {useEffect, useState} from 'react';
import {useScrollDirection} from '@/lib/hooks/useScrollDirection';
import Container from '@/components/ui/Container';

// Sticky in-page nav for the three pillar anchors. It tucks under the site
// header while that is visible and slides to the top edge when the header
// hides on scroll-down (same hook + threshold as the header), and marks the
// pillar currently in view.
export default function PillarNav({
  items,
  label,
}: {
  items: {anchor: string; label: string}[];
  label: string;
}) {
  const headerHidden = useScrollDirection(320);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.anchor))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      {rootMargin: '-35% 0px -55% 0px'},
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav
      aria-label={label}
      className={`glass sticky border-x-0 transition-[top] duration-[400ms] ${
        headerHidden ? 'top-0' : 'top-[76px]'
      }`}
      style={{zIndex: 'var(--z-sticky)'}}
    >
      <Container>
        <ul className="grid grid-cols-3 gap-1 py-1.5 nav:flex nav:justify-center nav:gap-3">
          {items.map((i) => {
            const on = active === i.anchor;
            return (
              <li key={i.anchor} className="flex">
                <a
                  href={`#${i.anchor}`}
                  aria-current={on ? 'location' : undefined}
                  className={`flex min-h-11 flex-1 items-center justify-center rounded-pill px-3 text-center font-display text-[13px] font-medium leading-tight transition-colors nav:px-6 nav:text-sm ${
                    on
                      ? 'bg-amber text-on-amber'
                      : 'text-ink-2 hover:text-amber'
                  }`}
                >
                  {i.label}
                </a>
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}
