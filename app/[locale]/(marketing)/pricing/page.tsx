import type {Metadata} from 'next';
import {useLocale, useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import PageIntro from '@/components/ui/PageIntro';
import Container from '@/components/ui/Container';
import PricingModels from '@/components/pricing/PricingModels';
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
  return {
    title,
    description,
    alternates: alternates('/pricing', locale as 'en' | 'ar'),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <PricingContent />;
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
      <PricingModels />
      <Included />
      <CustomNeeds />
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
