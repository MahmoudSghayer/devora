'use client';

import {useCallback, useEffect, useRef, useState, type KeyboardEvent} from 'react';
import {motion, useReducedMotion} from 'motion/react';
import ArrowButton from '@/components/ui/ArrowButton';
import ArrowLink from '@/components/ui/ArrowLink';
import {EASE} from '@/lib/motion';

export interface PillarView {
  id: string;
  anchor: string;
  tint: 'web' | 'auto' | 'soft';
  calculator: string;
  name: string;
  kicker: string;
  headline: string;
  desc: string;
  items: string[];
  scenarioTitle: string;
  scenario: string;
  outcomes: string[];
  cta: string;
}

interface Labels {
  tabs: string;
  scenario: string;
  outcomes: string;
  includes: string;
  explore: string;
}

// Literal class names so Tailwind can see them.
const TINT = {
  web: {
    text: 'text-pillar-web',
    active: 'border-pillar-web/60 bg-pillar-web/[0.07]',
    dot: 'bg-pillar-web',
    rule: 'border-pillar-web/50',
    glow: 'var(--color-pillar-web)',
  },
  auto: {
    text: 'text-pillar-auto',
    active: 'border-pillar-auto/60 bg-pillar-auto/[0.07]',
    dot: 'bg-pillar-auto',
    rule: 'border-pillar-auto/50',
    glow: 'var(--color-pillar-auto)',
  },
  soft: {
    text: 'text-pillar-soft',
    active: 'border-pillar-soft/60 bg-pillar-soft/[0.07]',
    dot: 'bg-pillar-soft',
    rule: 'border-pillar-soft/50',
    glow: 'var(--color-pillar-soft)',
  },
} as const;

/**
 * Tablist + panels. Every panel is in the DOM (inactive ones `hidden`) so the
 * SSR HTML contains all copy; the first panel is visible on the server.
 */
export default function PillarTabs({pillars, labels}: {pillars: PillarView[]; labels: Labels}) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Deep link: #websites | #automation | #software (+ hashchange).
  useEffect(() => {
    const read = () => {
      const i = pillars.findIndex((p) => p.anchor === window.location.hash.slice(1));
      if (i >= 0) setActive(i);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [pillars]);

  const select = useCallback((i: number, focus: boolean) => {
    setActive(i);
    if (focus) tabRefs.current[i]?.focus();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = pillars.length;
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    let next = active;
    switch (e.key) {
      case 'ArrowDown':
        next = (active + 1) % n;
        break;
      case 'ArrowUp':
        next = (active - 1 + n) % n;
        break;
      case 'ArrowRight':
        next = (active + (rtl ? -1 : 1) + n) % n;
        break;
      case 'ArrowLeft':
        next = (active + (rtl ? 1 : -1) + n) % n;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = n - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    select(next, true);
  };

  return (
    <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-6 nav:mt-14 nav:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] nav:gap-10">
      <div className="min-w-0 nav:sticky nav:top-28 nav:self-start">
        <div
          role="tablist"
          aria-label={labels.tabs}
          onKeyDown={onKeyDown}
          className="-mx-6 flex snap-x gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] nav:mx-0 nav:flex-col nav:gap-3 nav:overflow-visible nav:px-0 nav:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {pillars.map((p, i) => {
            const on = i === active;
            const tint = TINT[p.tint];
            return (
              <button
                key={p.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`pillar-tab-${p.id}`}
                aria-selected={on}
                aria-controls={`pillar-panel-${p.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(i, false)}
                className={`group flex min-h-12 shrink-0 snap-start items-center gap-3 rounded-card border px-4 py-3 text-start transition-colors nav:gap-5 nav:px-6 nav:py-5 ${
                  on
                    ? tint.active
                    : 'border-border-card bg-surface/60 hover:border-border-ghost hover:bg-surface-2'
                }`}
              >
                <span
                  className={`u-mono font-mono text-xs nav:text-sm ${on ? tint.text : 'text-faint'}`}
                  dir="ltr"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex flex-col">
                  <span
                    className={`font-display text-[17px] font-semibold leading-tight whitespace-nowrap nav:whitespace-normal nav:text-h3 ${
                      on ? 'text-ink' : 'text-ink-2'
                    }`}
                  >
                    {p.name}
                  </span>
                  <span className="u-mono mt-1 hidden font-mono text-xs uppercase tracking-[0.18em] text-muted nav:block">
                    {p.kicker}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0">
        {pillars.map((p, i) => {
          const on = i === active;
          const tint = TINT[p.tint];
          return (
            <div
              key={p.id}
              role="tabpanel"
              id={`pillar-panel-${p.id}`}
              aria-labelledby={`pillar-tab-${p.id}`}
              hidden={!on}
              tabIndex={0}
            >
              <motion.div
                initial={false}
                animate={on ? {opacity: 1, y: 0} : {opacity: 0, y: reduced ? 0 : 14}}
                transition={reduced ? {duration: 0} : {duration: 0.5, ease: EASE}}
                className="aura glass relative overflow-clip rounded-panel p-6 nav:p-10"
                style={{['--aura-color' as string]: tint.glow}}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10"
                  style={{
                    background: `radial-gradient(520px circle at 85% 0%, color-mix(in oklab, ${tint.glow} 12%, transparent), transparent 65%)`,
                  }}
                />
                <p className={`u-mono font-mono text-xs uppercase tracking-[0.22em] ${tint.text}`}>
                  <span aria-hidden>{'// '}</span>
                  {p.kicker}
                </p>
                <h3 className="u-track mt-4 font-display text-h3 font-semibold leading-[1.1] tracking-[-0.02em]">
                  {p.headline}
                </h3>
                <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-muted">{p.desc}</p>

                <h4 className="u-mono mt-9 font-mono text-xs uppercase tracking-[0.2em] text-faint">
                  {labels.includes}
                </h4>
                <ul className="mt-4 grid gap-x-8 gap-y-3 nav:grid-cols-2">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-start gap-3 text-[15px] leading-snug text-ink-2">
                      <span aria-hidden className={`mt-[7px] size-1.5 shrink-0 rounded-full ${tint.dot}`} />
                      {it}
                    </li>
                  ))}
                </ul>

                <div className="mt-9 grid gap-4 nav:grid-cols-2">
                  <div className={`rounded-card border border-border-card bg-bg/50 p-5 border-s-2 ${tint.rule}`}>
                    <h4 className="u-mono font-mono text-xs uppercase tracking-[0.2em] text-faint">
                      {labels.scenario}
                    </h4>
                    <p className="mt-3 font-display text-[17px] font-semibold text-ink">{p.scenarioTitle}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">{p.scenario}</p>
                  </div>
                  <div className="rounded-card border border-border-card bg-bg/50 p-5">
                    <h4 className="u-mono font-mono text-xs uppercase tracking-[0.2em] text-faint">
                      {labels.outcomes}
                    </h4>
                    <ul className="mt-3 space-y-3">
                      {p.outcomes.map((o) => (
                        <li key={o} className="flex items-start gap-3 text-[14px] leading-snug text-ink-2">
                          <span aria-hidden className={`${tint.text} font-mono`}>
                            +
                          </span>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <ArrowButton href={p.calculator} label={p.cta} className="min-h-12 px-7 py-3 text-[15px]" />
                  <ArrowLink href={`/services#${p.anchor}`} label={labels.explore} />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
