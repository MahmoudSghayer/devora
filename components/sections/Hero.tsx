import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import Container from '@/components/ui/Container';
import ArrowButton from '@/components/ui/ArrowButton';
import KineticHeadline from '@/components/motion/KineticHeadline';
import AuraSceneLazy from '@/components/three/AuraSceneLazy';

// Homepage hero. The h1 is server-rendered text (LCP). The aura orb is purely
// decorative: its wrapper ignores pointer events, the scene listens on window.
export default function Hero() {
  const t = useTranslations('hero');
  const emphasis = t('emphasis').split(',');

  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-bg pb-24 pt-32 nav:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 0%, color-mix(in oklab, var(--color-amber) 14%, transparent), transparent 70%), radial-gradient(45% 50% at 85% 60%, color-mix(in oklab, var(--color-signal) 9%, transparent), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 end-0 -z-10 w-full opacity-60 nav:w-[62%] nav:opacity-100"
      >
        <AuraSceneLazy className="absolute inset-0" intensity={1} interactive />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40"
        style={{background: 'linear-gradient(to bottom, transparent, var(--color-bg))'}}
      />

      <Container className="relative">
        <p className="glass u-mono inline-flex items-center gap-2.5 rounded-pill px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-ink-2">
          <span aria-hidden className="size-1.5 rounded-full bg-amber" />
          {t('chip')}
        </p>

        <KineticHeadline
          text={t('title')}
          emphasis={emphasis}
          className="mt-7 max-w-[15ch] font-display text-display font-bold leading-[1.02] tracking-[-0.03em] text-ink max-nav:max-w-[11ch] max-nav:text-[clamp(56px,11vw,96px)] nav:max-w-[16ch]"
        />

        <p className="mt-7 max-w-[560px] text-lead leading-[1.6] text-muted">{t('sub')}</p>

        <div className="mt-10 flex flex-col items-stretch gap-4 max-nav:max-w-[420px] nav:flex-row nav:flex-wrap nav:items-center">
          <ArrowButton
            href="/estimate"
            label={t('cta_estimate')}
            className="justify-center px-8 py-4 text-base"
          />
          <Link
            href="/automation-roi"
            className="glass inline-flex items-center justify-center gap-2.5 rounded-pill px-8 py-4 font-display text-base font-semibold text-ink transition-colors hover:border-signal"
          >
            <span aria-hidden className="size-2 rounded-full bg-signal animate-pulse-dot" />
            {t('cta_roi')}
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center px-2 font-display text-[15px] font-medium text-muted underline decoration-border-ghost underline-offset-[6px] transition-colors hover:text-amber hover:decoration-amber"
          >
            {t('cta_talk')}
          </Link>
        </div>
      </Container>

      <div
        aria-hidden
        className="u-mono pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-faint max-nav:hidden"
      >
        {t('scroll')}
        <span className="block h-6 w-px animate-[dvCue_2s_ease-in-out_infinite] bg-amber motion-reduce:animate-none" />
      </div>
    </section>
  );
}
