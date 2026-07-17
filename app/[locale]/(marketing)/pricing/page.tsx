import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import PageIntro from '@/components/ui/PageIntro';
import Container from '@/components/ui/Container';
import PricingModels from '@/components/pricing/PricingModels';
import Included from '@/components/pricing/Included';
import FAQAccordion from '@/components/ui/FAQAccordion';
import AmberBand from '@/components/ui/AmberBand';
import Marquee from '@/components/chrome/Marquee';

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

  const items = [
    {q: f('q5'), a: f('a5')},
    {q: f('q6'), a: f('a6')},
    {q: f('q7'), a: f('a7')},
  ];

  return (
    <>
      <PageIntro label={p('p_label')} title={p('p_title')} sub={p('p_sub')} />
      <PricingModels />
      <Included />
      <section className="border-t border-border">
        <Container className="py-24">
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
            {p('faq_label')}
          </p>
          <h2 className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]">
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
      <Marquee />
    </>
  );
}
