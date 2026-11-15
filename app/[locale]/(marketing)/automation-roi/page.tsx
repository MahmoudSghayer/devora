import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import RoiApp from '@/components/roi/RoiApp';
import Container from '@/components/ui/Container';
import {alternates} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'roi'});
  const title = t('meta.title');
  const description = t('meta.description');
  return {
    title,
    description,
    alternates: alternates('/automation-roi', locale as 'en' | 'ar'),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function AutomationRoiPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('roi');
  return (
    <>
      <header className="aura aura-signal relative overflow-x-clip pb-10 pt-[132px] print:pt-0">
        <Container>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.3em] text-signal">{t('page.eyebrow')}</p>
          <h1 className="u-track mt-6 max-w-[20ch] font-display text-[clamp(36px,6vw,84px)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
            {t('page.title')}
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-2">{t('page.sub')}</p>
          <p className="mt-4 max-w-[60ch] border-s-2 border-signal ps-4 text-base leading-relaxed text-muted">
            {t('page.honest')}
          </p>
        </Container>
      </header>
      <section aria-label={t('page.calculator')} className="pb-section">
        <Container>
          <noscript>
            <p className="rounded-card border border-border-card p-5 text-base text-ink-2">
              {t('page.noscript')}{' '}
              <Link href="/contact" className="font-semibold text-amber underline underline-offset-4">
                {t('page.noscriptLink')}
              </Link>
            </p>
          </noscript>
          <RoiApp />
        </Container>
      </section>
    </>
  );
}
