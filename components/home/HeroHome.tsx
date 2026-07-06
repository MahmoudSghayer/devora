import type {CSSProperties} from 'react';
import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import WordReveal from '@/components/motion/WordReveal';
import HeroReveal from '@/components/motion/HeroReveal';
import ArrowButton from '@/components/ui/ArrowButton';
import {Link} from '@/i18n/navigation';

export default function HeroHome() {
  const t = useTranslations('home');
  const c = useTranslations('common');
  const line1 = t('hero_h1a');
  const n1 = line1.split(/\s+/).filter(Boolean).length;

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* drifting vertical hairlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-grid-drift"
        style={
          {
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 160px)',
            '--drift': '160px',
            '--drift-dur': '18s',
          } as CSSProperties
        }
      />

      {/* rotating logo ornament (desktop only) */}
      <div
        aria-hidden
        className="pointer-events-none absolute end-[6%] top-[16%] hidden h-[220px] w-[220px] nav:block"
      >
        <div
          className="animate-spin-slow h-full w-full"
          style={{
            border: '3px solid rgba(244,197,66,0.25)',
            borderRadius: '64px 64px 64px 10px',
          }}
        />
        <div
          className="animate-pulse-dot absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber"
          style={{'--pulse-dur': '4s'} as CSSProperties}
        />
      </div>

      <Container className="relative pb-[90px] pt-[110px]">
        <HeroReveal index={0}>
          <div className="flex items-center gap-3">
            <span className="animate-pulse-dot inline-block h-2 w-2 rounded-full bg-amber" />
            <span className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
              {t('hero_label')}
            </span>
          </div>
        </HeroReveal>

        <h1 className="u-track mt-8 max-w-[16ch] font-display text-h1 font-bold leading-[1.02] tracking-[-0.03em]">
          <WordReveal as="span" text={line1} className="block text-ink" delayBase={120} />
          <WordReveal
            as="span"
            text={t('hero_h1b')}
            className="block text-amber"
            delayBase={120 + n1 * 65}
          />
        </h1>

        <div className="mt-10 flex flex-col gap-8 nav:flex-row nav:items-end nav:justify-between">
          <HeroReveal index={1}>
            <p className="max-w-[560px] text-[19px] leading-[1.65] text-muted">
              {t('hero_sub')}
            </p>
          </HeroReveal>

          <HeroReveal index={2}>
            <div className="flex flex-wrap items-center gap-4">
              <ArrowButton
                href="/contact"
                label={c('nav_cta')}
                variant="amber"
                className="px-[30px] py-4 text-base"
              />
              <Link
                href="/work"
                className="rounded-pill border border-border-ghost px-[30px] py-4 text-base font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-amber hover:text-amber"
              >
                {t('hero_cta2')}
              </Link>
            </div>
          </HeroReveal>
        </div>
      </Container>
    </section>
  );
}
