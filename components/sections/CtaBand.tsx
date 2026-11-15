import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import ArrowButton from '@/components/ui/ArrowButton';
import Reveal from '@/components/motion/Reveal';
import {Link} from '@/i18n/navigation';

// Closing contact band in the v2 aura/glass language.
export default function CtaBand() {
  const t = useTranslations('hero.cta');
  return (
    <section className="py-section">
      <Container>
        <Reveal>
          <div className="glass-hi aura relative overflow-hidden rounded-panel px-6 py-16 text-center nav:px-16 nav:py-24">
            <h2
              className="u-track mx-auto max-w-[18ch] bg-[linear-gradient(180deg,var(--color-ink),var(--color-amber))] bg-clip-text font-display font-bold leading-[1.04] tracking-[-0.03em] text-transparent"
              style={{fontSize: 'var(--text-cta)'}}
            >
              {t('title')}
            </h2>
            <p className="mx-auto mt-6 max-w-[520px] text-lead leading-[1.6] text-muted">{t('sub')}</p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-4 max-nav:mx-auto max-nav:max-w-[360px] nav:flex-row nav:items-center">
              <ArrowButton
                href="/contact"
                label={t('primary')}
                className="justify-center px-10 py-5 text-[17px]"
              />
              <Link
                href="/estimate"
                className="inline-flex items-center justify-center rounded-pill border border-border-ghost px-8 py-5 font-display text-base font-semibold text-ink transition-colors hover:border-amber hover:text-amber"
              >
                {t('secondary')}
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
