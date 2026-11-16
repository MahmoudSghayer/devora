import Image from 'next/image';
import {useLocale, useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import ArrowLink from '@/components/ui/ArrowLink';
import Reveal from '@/components/motion/Reveal';
import TiltCard from '@/components/motion/TiltCard';
import Parallax from '@/components/motion/Parallax';
import {CASES} from '@/lib/site';

/**
 * Section 5: the four real client products. Screenshot cards tilt with the
 * pointer and the image drifts with scroll; the one case without a capture
 * (kareem) is a typographic card with the same aspect ratio, so the grid never
 * shifts. Narrative copy is the localized CASES[i][locale] text.
 */
export default function SelectedWork() {
  const t = useTranslations('why');
  const locale = useLocale() === 'ar' ? 'ar' : 'en';

  return (
    <section className="relative overflow-x-clip border-b border-border py-section">
      <Container>
        <Reveal>
          <SectionHeader
            label={t('sw_label')}
            title={t('sw_title')}
            link={<ArrowLink href="/work" label={t('sw_all')} />}
          />
          <p className="mt-5 max-w-[640px] text-lead leading-[1.6] text-muted">{t('sw_sub')}</p>
        </Reveal>

        <ul className="mt-10 grid gap-6 nav:mt-14 nav:grid-cols-2 nav:gap-8">
          {CASES.map((c, i) => {
            const copy = c[locale];
            return (
              <li key={c.slug} className={i % 2 === 1 ? 'nav:mt-16' : undefined}>
                <Reveal index={i % 2} className="h-full">
                  <TiltCard max={3} className="h-full">
                    <article className="glass flex h-full flex-col overflow-hidden rounded-panel">
                      <Link
                        href={`/work/${c.slug}`}
                        aria-hidden
                        tabIndex={-1}
                        className="group block"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden border-b border-border-card bg-surface">
                          {c.image ? (
                            <Parallax speed={0.05} className="size-full">
                              <Image
                                src={c.image}
                                alt={t('sw_image_alt', {domain: c.domain})}
                                fill
                                sizes="(max-width: 920px) 100vw, 640px"
                                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
                              />
                            </Parallax>
                          ) : (
                            <div className="flex size-full flex-col justify-between bg-[radial-gradient(70%_80%_at_20%_10%,color-mix(in_oklab,var(--color-amber)_14%,transparent),transparent_70%)] p-8">
                              <span aria-hidden className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-faint">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span
                                dir="ltr"
                                className="font-display text-case font-bold leading-none tracking-[-0.03em] text-ink"
                              >
                                {c.domain}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex flex-1 flex-col p-6 nav:p-8">
                        <p className="u-mono font-mono text-xs uppercase tracking-[0.18em] text-amber">
                          {copy.industry}
                        </p>
                        <h3 className="mt-3 font-display text-h3 font-semibold leading-[1.1] tracking-[-0.02em]">
                          <span dir="ltr" className="u-track">
                            {c.domain}
                          </span>
                        </h3>
                        <p className="mt-3 line-clamp-3 leading-[1.6] text-muted">{copy.summary}</p>
                        <div className="mt-auto flex flex-wrap items-center gap-x-8 gap-y-3 pt-6">
                          <ArrowLink href={`/work/${c.slug}`} label={t('sw_case')} />
                          <a
                            href={c.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-medium text-ink-2 transition-colors hover:text-amber"
                          >
                            {t('sw_live')}
                            <span aria-hidden>↗</span>
                            <span className="sr-only">{t('sw_new_tab')}</span>
                          </a>
                        </div>
                      </div>
                    </article>
                  </TiltCard>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
