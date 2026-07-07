import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import HeroHome from '@/components/home/HeroHome';
import Marquee from '@/components/chrome/Marquee';
import ServicesOverview from '@/components/home/ServicesOverview';
import ProcessTeaser from '@/components/home/ProcessTeaser';
import SelectedWork from '@/components/home/SelectedWork';
import IndustriesTeaser from '@/components/home/IndustriesTeaser';
import CarePlanTeaser from '@/components/home/CarePlanTeaser';
import Testimonials from '@/components/home/Testimonials';
import TeamSection from '@/components/home/TeamSection';
import FaqTeaser from '@/components/home/FaqTeaser';
import AmberBand from '@/components/ui/AmberBand';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'home'});
  const title = 'devora — full-stack web studio';
  const description = t('hero_sub');
  return {
    title,
    description,
    alternates: alternates(''),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}

function HomeContent() {
  const c = useTranslations('common');
  return (
    <>
      <HeroHome />
      <Marquee />
      <ServicesOverview />
      <ProcessTeaser />
      <SelectedWork />
      <IndustriesTeaser />
      <CarePlanTeaser />
      <Testimonials />
      <TeamSection />
      <FaqTeaser />
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
        buttonHref="/contact"
      />
    </>
  );
}
