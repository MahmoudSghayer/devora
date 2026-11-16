import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import {BreadcrumbJsonLd} from '@/components/seo/schemas';
import PageIntro from '@/components/ui/PageIntro';
import ProcessDetail from '@/components/process/ProcessDetail';
import AmberBand from '@/components/ui/AmberBand';
import Container from '@/components/ui/Container';
import ArrowLink from '@/components/ui/ArrowLink';
import {PILLARS} from '@/lib/pillars';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'process'});
  const title = t('pr_label');
  const description = t('pr_sub');
  return pageMetadata({locale, path: '/process', title, description});
}

export default async function ProcessPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as 'en' | 'ar';
  const [tc, t] = await Promise.all([
    getTranslations({locale, namespace: 'common'}),
    getTranslations({locale, namespace: 'process'}),
  ]);
  return (
    <>
      <BreadcrumbJsonLd locale={l} items={[{name: tc('nav_home'), path: ''}, {name: t('pr_label'), path: '/process'}]} />
      <ProcessContent />
    </>
  );
}

function ProcessContent() {
  const p = useTranslations('process');
  const c = useTranslations('common');
  const pillars = useTranslations('pillars');
  return (
    <>
      <div className="aura overflow-x-clip">
        <PageIntro label={p('pr_label')} title={p('pr_title')} sub={p('pr_sub')} />
      </div>
      <ProcessDetail />
      <section aria-labelledby="process-pillars-title" className="border-t border-border pb-[var(--space-section)] pt-[var(--space-block)]">
        <Container>
          <h2
            id="process-pillars-title"
            className="u-track max-w-[760px] font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
          >
            {p('pr_pillars_t')}
          </h2>
          <p className="mt-5 max-w-[620px] text-lead text-muted">{p('pr_pillars_d')}</p>
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {PILLARS.map((pl) => (
              <li key={pl.id}>
                <ArrowLink href={`/services#${pl.anchor}`} label={pillars(`${pl.id}.name`)} />
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
    </>
  );
}
