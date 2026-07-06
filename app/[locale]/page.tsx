import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import HeroHome from '@/components/home/HeroHome';
import Marquee from '@/components/chrome/Marquee';
import ServicesOverview from '@/components/home/ServicesOverview';
import SelectedWork from '@/components/home/SelectedWork';
import Testimonials from '@/components/home/Testimonials';
import TeamSection from '@/components/home/TeamSection';
import AmberBand from '@/components/ui/AmberBand';

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
      <SelectedWork />
      <Testimonials />
      <TeamSection />
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
        buttonHref="/contact"
      />
    </>
  );
}
