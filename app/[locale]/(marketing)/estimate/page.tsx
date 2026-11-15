import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import Container from '@/components/ui/Container';
import EstimatorApp from '@/components/estimator/EstimatorApp';
import {Link} from '@/i18n/navigation';
import {pageMetadata} from '@/lib/seo';
import {BreadcrumbJsonLd, WebApplicationJsonLd} from '@/components/seo/schemas';
import {SITE, SOCIALS} from '@/lib/site';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'estimator'});
  const title = t('meta.title');
  const description = t('meta.description');
  return pageMetadata({locale, path: '/estimate', title, description});
}

export default async function EstimatePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as 'en' | 'ar';
  const t = await getTranslations({locale, namespace: 'estimator'});
  const tc = await getTranslations({locale, namespace: 'common'});
  const title = t('meta.title');
  const description = t('meta.description');

  return (
    <>
      <WebApplicationJsonLd kind="estimate" locale={l} name={title} description={description} />
      <BreadcrumbJsonLd locale={l} items={[{name: tc('nav_home'), path: ''}, {name: title, path: '/estimate'}]} />
      <div className="aura overflow-x-clip border-b border-border print:hidden">
        <Container className="relative pb-10 pt-[120px] nav:pb-14">
          <p className="flex items-center gap-2.5">
            <span aria-hidden className="font-mono text-[13px] leading-none text-amber">
              ◗
            </span>
            <span className="u-mono font-mono text-xs uppercase tracking-[0.3em] text-amber">{t('intro.label')}</span>
          </p>
          <h1 className="u-track mt-6 max-w-[20ch] font-display text-[clamp(34px,5.5vw,76px)] font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
            {t('intro.title')}
          </h1>
          <p className="mt-5 max-w-[620px] text-[18px] leading-[1.65] text-muted">{t('intro.sub')}</p>
          <p className="glass mt-7 max-w-[760px] rounded-card px-5 py-4 text-sm leading-relaxed text-ink-2">
            {t('trust')}
          </p>
        </Container>
      </div>

      <Container className="pb-24 pt-10 nav:pt-14 print:p-0">
        <noscript>
          <p className="glass mb-8 rounded-card p-5 text-ink-2">
            {t('nojs')}{' '}
            <Link href="/contact" className="font-semibold text-amber underline underline-offset-4">
              {t('nojs_link')}
            </Link>
          </p>
        </noscript>
        <EstimatorApp email={SITE.email} socials={SOCIALS} />
      </Container>
    </>
  );
}
