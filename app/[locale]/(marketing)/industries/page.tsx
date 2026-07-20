import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import PageIntro from '@/components/ui/PageIntro';
import IndustryGrid from '@/components/industries/IndustryGrid';
import AmberBand from '@/components/ui/AmberBand';
import Marquee from '@/components/chrome/Marquee';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'industries'});
  const title = t('i_label');
  const description = t('i_sub');
  return {
    title,
    description,
    alternates: alternates('/industries', locale as 'en' | 'ar'),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function IndustriesPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <IndustriesContent />;
}

function IndustriesContent() {
  const i = useTranslations('industries');
  const c = useTranslations('common');
  return (
    <>
      <PageIntro label={i('i_label')} title={i('i_title')} sub={i('i_sub')} />
      <IndustryGrid />
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
      <Marquee />
    </>
  );
}
