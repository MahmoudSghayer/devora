import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import {BreadcrumbJsonLd} from '@/components/seo/schemas';
import PageIntro from '@/components/ui/PageIntro';
import Story from '@/components/about/Story';
import Difference from '@/components/about/Difference';
import Values from '@/components/about/Values';
import Crew from '@/components/about/Crew';
import AmberBand from '@/components/ui/AmberBand';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'about'});
  const title = t('a_label');
  const description = t('a_sub');
  return pageMetadata({locale, path: '/about', title, description});
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as 'en' | 'ar';
  const [tc, t] = await Promise.all([
    getTranslations({locale, namespace: 'common'}),
    getTranslations({locale, namespace: 'about'}),
  ]);
  return (
    <>
      <BreadcrumbJsonLd locale={l} items={[{name: tc('nav_home'), path: ''}, {name: t('a_label'), path: '/about'}]} />
      <AboutContent />
    </>
  );
}

function AboutContent() {
  const a = useTranslations('about');
  const c = useTranslations('common');
  return (
    <>
      <div className="aura overflow-x-clip">
        <PageIntro label={a('a_label')} title={a('a_title')} sub={a('a_sub')} />
      </div>
      <Story />
      <Difference />
      <Values />
      <Crew />
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
    </>
  );
}
