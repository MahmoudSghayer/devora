import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import {ProfessionalServiceJsonLd, ServicesJsonLd} from '@/components/seo/schemas';
import ScopedMessages from '@/components/i18n/ScopedMessages';
import Hero from '@/components/sections/Hero';
import ValueWhy from '@/components/sections/ValueWhy';
import PillarSwitcher from '@/components/sections/PillarSwitcher';
import ScenarioSimulator from '@/components/sections/ScenarioSimulator';
import SelectedWork from '@/components/sections/SelectedWork';
import CalculatorCards from '@/components/sections/CalculatorCards';
import StackConstellation from '@/components/sections/StackConstellation';
import CtaBand from '@/components/sections/CtaBand';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'hero'});
  const meta = await getTranslations({locale, namespace: 'common'});
  return {
    ...pageMetadata({locale, path: '', title: meta('home_title'), description: t('sub')}),
    // Absolute: the title already carries the brand, so skip the root template.
    title: {absolute: meta('home_title')},
  };
}

// Homepage: eight sections — Hero · Value (+ why, proof) · Pillars · WhatsApp
// scenario · Selected work · Calculators · Stack · CTA. Process and FAQ live on
// their own pages and are linked from the value section and the CTA band.
export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as 'en' | 'ar';
  return (
    <>
      <ProfessionalServiceJsonLd locale={l} />
      <ServicesJsonLd locale={l} />
      <Hero />
      <ValueWhy />
      <PillarSwitcher />
      <ScopedMessages namespaces={['homeB']}>
        <ScenarioSimulator />
      </ScopedMessages>
      <SelectedWork />
      <ScopedMessages namespaces={['homeB']}>
        <CalculatorCards />
      </ScopedMessages>
      <StackConstellation />
      <CtaBand />
    </>
  );
}
