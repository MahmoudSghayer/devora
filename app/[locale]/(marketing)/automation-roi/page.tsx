import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import RoiApp from '@/components/roi/RoiApp';
import CalcShell from '@/components/calc/CalcShell';
import ScopedMessages from '@/components/i18n/ScopedMessages';
import Container from '@/components/ui/Container';
import {pageMetadata} from '@/lib/seo';
import {BreadcrumbJsonLd, WebApplicationJsonLd} from '@/components/seo/schemas';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'roi'});
  const title = t('meta.title');
  const description = t('meta.description');
  return pageMetadata({locale, path: '/automation-roi', title, description});
}

export default async function AutomationRoiPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as 'en' | 'ar';
  const t = await getTranslations({locale, namespace: 'roi'});
  const tc = await getTranslations({locale, namespace: 'common'});
  const title = t('meta.title');
  const description = t('meta.description');
  return (
    <>
      <WebApplicationJsonLd kind="roi" locale={l} name={title} description={description} />
      <BreadcrumbJsonLd locale={l} items={[{name: tc('nav_home'), path: ''}, {name: title, path: '/automation-roi'}]} />
      <CalcShell
        spacer="h-[132px] print:hidden"
        intro={
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
        }
      >
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
            <ScopedMessages namespaces={['roi']}>
              <RoiApp />
            </ScopedMessages>
          </Container>
        </section>
      </CalcShell>
    </>
  );
}
