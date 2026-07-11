import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import PageIntro from '@/components/ui/PageIntro';
import CaseStudyRow from '@/components/work/CaseStudyRow';
import AmberBand from '@/components/ui/AmberBand';
import Marquee from '@/components/chrome/Marquee';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'work'});
  const title = t('wk_label');
  const description = t('wk_sub');
  return {
    title,
    description,
    alternates: alternates('/work'),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <WorkContent />;
}

function WorkContent() {
  const w = useTranslations('work');
  const c = useTranslations('common');
  return (
    <>
      <PageIntro label={w('wk_label')} title={w('wk_title')} sub={w('wk_sub')} />
      <CaseStudyRow index={0} reverse={false} />
      <CaseStudyRow index={1} reverse={true} />
      <AmberBand title={w('next_t')} buttonLabel={c('nav_cta')} centered />
      <Marquee />
    </>
  );
}
