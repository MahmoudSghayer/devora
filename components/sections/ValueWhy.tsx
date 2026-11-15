import type {ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';
import TiltCard from '@/components/motion/TiltCard';
import Spotlight from '@/components/motion/Spotlight';
import {PILLARS} from '@/lib/pillars';
import ProofStrip from './ProofStrip';

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

const OUTCOMES = [
  {
    key: 'growth',
    icon: (
      <svg {...svg}>
        <path d="M4 25h24" />
        <path d="M6 20l6-6 5 4 9-10" />
        <path d="M20 8h6v6" />
      </svg>
    ),
  },
  {
    key: 'time',
    icon: (
      <svg {...svg}>
        <circle cx="16" cy="17" r="10" />
        <path d="M16 11v6l4 3" />
        <path d="M13 4h6" />
      </svg>
    ),
  },
  {
    key: 'cost',
    icon: (
      <svg {...svg}>
        <path d="M5 8h22l-8 9v8l-6 3v-11z" />
      </svg>
    ),
  },
  {
    key: 'edge',
    icon: (
      <svg {...svg}>
        <path d="M16 3l3.5 8.5L28 15l-8.5 3.5L16 27l-3.5-8.5L4 15l8.5-3.5z" />
      </svg>
    ),
  },
] as const;

const DOT = {web: 'bg-pillar-web', auto: 'bg-pillar-auto', soft: 'bg-pillar-soft'} as const;

/** One bento tile: tilt + cursor spotlight around a glass surface. */
function Tile({
  index,
  span,
  tone = 'amber',
  title,
  children,
}: {
  index: number;
  span: string;
  tone?: 'amber' | 'signal';
  title: string;
  children: ReactNode;
}) {
  return (
    <li className={span}>
      <Reveal index={index} className="h-full">
        <TiltCard max={3} className="h-full">
          <Spotlight tone={tone} className="glass flex h-full flex-col rounded-panel p-7 nav:p-9">
            <h4
              className={`u-track font-display text-[22px] font-semibold leading-[1.15] tracking-[-0.02em] ${
                tone === 'signal' ? 'text-signal-hi' : 'text-ink'
              }`}
            >
              {title}
            </h4>
            {children}
          </Spotlight>
        </TiltCard>
      </Reveal>
    </li>
  );
}

const body = 'mt-3 max-w-[52ch] leading-[1.65] text-muted';

/**
 * Section 2: what the work is for (four outcomes) + why Devora (five
 * advantages as an asymmetric bento) + the live-client proof strip. No
 * metrics: every claim is a statement of how we work.
 */
export default function ValueWhy() {
  const t = useTranslations('hero.value');
  const w = useTranslations('why');
  const p = useTranslations('pillars');

  return (
    <>
      <section className="relative overflow-x-clip py-section">
        <Container>
          <Reveal>
            <SectionHeader label={t('label')} title={t('title')} />
          </Reveal>

          <ul className="mt-12 grid gap-4 nav:mt-14 nav:grid-cols-4">
            {OUTCOMES.map((o, i) => (
              <li key={o.key}>
                <Reveal index={i} className="h-full">
                  <TiltCard max={4} className="h-full">
                    <Spotlight className="glass h-full rounded-panel p-7">
                      <span className="inline-flex size-14 items-center justify-center rounded-card border border-border-amber bg-featured text-amber">
                        {o.icon}
                      </span>
                      <h3 className="u-track mt-6 font-display text-[24px] font-semibold leading-[1.1] tracking-[-0.02em]">
                        {t(`${o.key}_t`)}
                      </h3>
                      <p className="mt-3 leading-[1.65] text-muted">{t(`${o.key}_d`)}</p>
                    </Spotlight>
                  </TiltCard>
                </Reveal>
              </li>
            ))}
          </ul>

          <div className="mt-section">
            <Reveal>
              <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
                <span aria-hidden>{'// '}</span>
                {w('label')}
              </p>
              <h3 className="u-track mt-4 max-w-[20ch] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
                {w('title')}
              </h3>
              <p className="mt-5 max-w-[560px] text-lead leading-[1.6] text-muted">{w('sub')}</p>
            </Reveal>

            <ul aria-label={w('list_aria')} className="mt-10 grid gap-4 nav:mt-12 nav:grid-cols-6">
              <Tile index={0} span="nav:col-span-4" title={w('a_t')}>
                <p className={body}>{w('a_d')}</p>
                <div aria-hidden className="mt-auto flex flex-wrap items-center gap-2 pt-7">
                  {PILLARS.map((pl, i) => (
                    <span key={pl.id} className="flex items-center gap-2">
                      {i > 0 && <span className="font-mono text-faint">+</span>}
                      <span className="inline-flex items-center gap-2 rounded-pill border border-border-chip bg-bg/40 px-3.5 py-2 text-[14px] text-ink-2">
                        <span className={`size-2 rounded-full ${DOT[pl.tint]}`} />
                        {p(`${pl.id}.name`)}
                      </span>
                    </span>
                  ))}
                </div>
              </Tile>

              <Tile index={1} span="nav:col-span-2" title={w('b_t')}>
                <p className={body}>{w('b_d')}</p>
                <div aria-hidden className="mt-auto flex items-center gap-3 pt-7">
                  <span
                    dir="ltr"
                    lang="en"
                    className="rounded-card border border-border-chip bg-bg/40 px-4 py-2 font-display text-lg font-semibold text-ink-2"
                  >
                    {w('b_en')}
                  </span>
                  <span
                    dir="rtl"
                    lang="ar"
                    className="rounded-card border border-border-amber bg-featured px-4 py-2 font-display text-lg font-semibold text-amber"
                  >
                    {w('b_ar')}
                  </span>
                </div>
              </Tile>

              <Tile index={2} span="nav:col-span-2" title={w('c_t')}>
                <p className={body}>{w('c_d')}</p>
              </Tile>

              <Tile index={3} span="nav:col-span-2" title={w('d_t')}>
                <p className={body}>{w('d_d')}</p>
                <div className="mt-auto pt-6">
                  <ArrowLink href="/estimate" label={w('d_link')} />
                </div>
              </Tile>

              <Tile index={4} span="nav:col-span-2" tone="signal" title={w('e_t')}>
                <p className={body}>{w('e_d')}</p>
              </Tile>
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-3">
              <ArrowLink href="/process" label={w('process_link')} />
              <ArrowLink href="/faq" label={w('faq_link')} />
            </div>
          </div>
        </Container>
      </section>
      <ProofStrip />
    </>
  );
}
