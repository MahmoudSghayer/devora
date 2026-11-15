import {useTranslations} from 'next-intl';
import Container from '@/components/ui/Container';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';
import {CASES} from '@/lib/site';

// Real client products only (CASES). No metrics, no logos.
export default function ProofStrip() {
  const t = useTranslations('hero.proof');
  return (
    <section className="border-y border-border bg-bg-alt py-10">
      <Container>
        <Reveal className="flex flex-col gap-6 nav:flex-row nav:items-center nav:justify-between">
          <p className="u-mono shrink-0 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            {t('label')}
          </p>
          <ul
            aria-label={t('list_aria')}
            className="grid grid-cols-2 gap-x-6 gap-y-3 nav:flex nav:flex-1 nav:justify-center nav:gap-x-12"
          >
            {CASES.map((c) => (
              <li key={c.slug}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 font-display text-[17px] font-medium text-ink-2 transition-colors hover:text-amber"
                >
                  <span dir="ltr">{c.domain}</span>
                  <span aria-hidden className="text-faint">↗</span>
                  <span className="sr-only">{t('new_tab')}</span>
                </a>
              </li>
            ))}
          </ul>
          <ArrowLink href="/work" label={t('see_work')} />
        </Reveal>
      </Container>
    </section>
  );
}
