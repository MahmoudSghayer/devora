import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import PageIntro from '@/components/ui/PageIntro';
import Story from '@/components/about/Story';
import Difference from '@/components/about/Difference';
import Values from '@/components/about/Values';
import Crew from '@/components/about/Crew';
import AmberBand from '@/components/ui/AmberBand';
import Marquee from '@/components/chrome/Marquee';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'about'});
  const title = t('a_label');
  const description = t('a_sub');
  return {
    title,
    description,
    alternates: alternates('/about'),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <AboutContent />;
}

function AboutContent() {
  const a = useTranslations('about');
  const c = useTranslations('common');
  return (
    <>
      <PageIntro label={a('a_label')} title={a('a_title')} sub={a('a_sub')} />
      <Story />
      <Difference />
      <Values />
      <Crew />
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
      <Marquee />
    </>
  );
}
