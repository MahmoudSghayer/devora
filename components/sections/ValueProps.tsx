import type {ReactNode} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import Reveal from '@/components/motion/Reveal';
import TiltCard from '@/components/motion/TiltCard';
import Spotlight from '@/components/motion/Spotlight';
import CountUp from '@/components/motion/CountUp';
import {PILLARS} from '@/lib/pillars';
import {CASES} from '@/lib/site';

// Facts derived from constants: 3 pillars, 4 live products, 2 free calculators,
// and the 5-step process (process.s1..s5).
const CALCULATORS = new Set(PILLARS.map((p) => p.calculator).filter((c) => c !== '/contact')).size;
const PROCESS_STEPS = 5;

const svg = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'size-8',
} as const;

const ICONS: Record<string, ReactNode> = {
  growth: (
    <svg {...svg}>
      <path d="M4 25h24" />
      <path d="M6 20l6-6 5 4 9-10" />
      <path d="M20 8h6v6" />
    </svg>
  ),
  time: (
    <svg {...svg}>
      <circle cx="16" cy="17" r="10" />
      <path d="M16 11v6l4 3" />
      <path d="M13 4h6" />
    </svg>
  ),
  cost: (
    <svg {...svg}>
      <path d="M5 8h22l-8 9v8l-6 3v-11z" />
    </svg>
  ),
  edge: (
    <svg {...svg}>
      <path d="M16 3l3.5 8.5L28 15l-8.5 3.5L16 27l-3.5-8.5L4 15l8.5-3.5z" />
    </svg>
  ),
};

const KEYS = ['growth', 'time', 'cost', 'edge'] as const;

export default function ValueProps() {
  const t = useTranslations('hero.value');
  const locale = useLocale();
  const facts = [
    {n: PILLARS.length, k: 'fact_pillars'},
    {n: CASES.length, k: 'fact_products'},
    {n: CALCULATORS, k: 'fact_tools'},
    {n: PROCESS_STEPS, k: 'fact_steps'},
  ] as const;

  return (
    <section className="py-section">
      <Container>
        <Reveal>
          <SectionHeader label={t('label')} title={t('title')} />
        </Reveal>

        <ul className="mt-14 grid gap-5 nav:grid-cols-2">
          {KEYS.map((k, i) => (
            <li key={k}>
              <Reveal index={i}>
                <TiltCard max={4} className="h-full">
                  <Spotlight className="glass h-full rounded-panel p-8 nav:p-10">
                    <span className="inline-flex size-14 items-center justify-center rounded-card border border-border-amber bg-featured text-amber">
                      {ICONS[k]}
                    </span>
                    <h3 className="u-track mt-6 font-display text-h3 font-semibold leading-[1.1] tracking-[-0.02em]">
                      {t(`${k}_t`)}
                    </h3>
                    <p className="mt-3 max-w-[48ch] leading-[1.65] text-muted">{t(`${k}_d`)}</p>
                  </Spotlight>
                </TiltCard>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal delay={150}>
          <dl
            aria-label={t('facts_aria')}
            className="mt-14 grid grid-cols-2 gap-y-8 border-t border-border pt-10 nav:grid-cols-4"
          >
            {facts.map((f) => (
              <div key={f.k} className="flex flex-col-reverse justify-end">
                <dt className="u-mono mt-3 font-mono text-xs uppercase tracking-[0.18em] text-muted">
                  {t(f.k)}
                </dt>
                <dd className="font-display text-stat font-bold leading-none tracking-[-0.03em] text-ink">
                  <CountUp value={f.n} locale={locale} />
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}
