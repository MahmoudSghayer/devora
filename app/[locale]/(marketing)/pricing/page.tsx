import type {Metadata} from 'next';
import {useLocale, useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import {BreadcrumbJsonLd, FaqJsonLd} from '@/components/seo/schemas';
import PageIntro from '@/components/ui/PageIntro';
import Container from '@/components/ui/Container';
import HowPricingWorks from '@/components/pricing/HowPricingWorks';
import Included from '@/components/pricing/Included';
import CustomNeeds from '@/components/pricing/CustomNeeds';
import {pricingParams} from '@/lib/pricing/config';
import FAQAccordion from '@/components/ui/FAQAccordion';
import AmberBand from '@/components/ui/AmberBand';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'pricing'});
  const title = t('p_label');
  const description = t('p_sub');
  return pageMetadata({locale, path: '/pricing', title, description});
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as 'en' | 'ar';
  const [tc, t, f] = await Promise.all([
    getTranslations({locale, namespace: 'common'}),
    getTranslations({locale, namespace: 'pricing'}),
    getTranslations({locale, namespace: 'faq'}),
  ]);
  const fp = pricingParams(locale);
  return (
    <>
      <FaqJsonLd
        items={[
          {question: f('q5'), answer: f('a5', fp)},
          {question: f('q6'), answer: f('a6', fp)},
          {question: f('q7'), answer: f('a7')},
        ]}
      />
      <BreadcrumbJsonLd locale={l} items={[{name: tc('nav_home'), path: ''}, {name: t('p_label'), path: '/pricing'}]} />
      <PricingContent />
    </>
  );
}

function PricingContent() {
  const p = useTranslations('pricing');
  const f = useTranslations('faq');
  const c = useTranslations('common');

  const params = pricingParams(useLocale());
  const items = [
    {q: f('q5'), a: f('a5', params)},
    {q: f('q6'), a: f('a6', params)},
    {q: f('q7'), a: f('a7')},
  ];

  return (
    <>
      <div className="aura overflow-x-clip">
        <PageIntro label={p('p_label')} title={p('p_title')} sub={p('p_sub')} />
      </div>
      <HowPricingWorks />
      <Included />
      <CustomNeeds
        label={p('custom_label')}
        title={p('custom_title')}
        sub={p('custom_sub')}
      />
      <section aria-labelledby="pricing-faq-title" className="py-section">
        <Container>
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            <span aria-hidden>{'// '}</span>
            {p('faq_label')}
          </p>
          <h2 id="pricing-faq-title" className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
            {p('faq_title')}
          </h2>
          <div className="mt-10">
            <FAQAccordion items={items} />
          </div>
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
