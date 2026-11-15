import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import {BreadcrumbJsonLd} from '@/components/seo/schemas';
import PageIntro from '@/components/ui/PageIntro';
import IndustryGrid from '@/components/industries/IndustryGrid';
import AmberBand from '@/components/ui/AmberBand';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'industries'});
  const title = t('i_label');
  const description = t('i_sub');
  return pageMetadata({locale, path: '/industries', title, description});
}

export default async function IndustriesPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as 'en' | 'ar';
  const [tc, t] = await Promise.all([
    getTranslations({locale, namespace: 'common'}),
    getTranslations({locale, namespace: 'industries'}),
  ]);
  return (
    <>
      <BreadcrumbJsonLd locale={l} items={[{name: tc('nav_home'), path: ''}, {name: t('i_label'), path: '/industries'}]} />
      <IndustriesContent />
    </>
  );
}

function IndustriesContent() {
  const i = useTranslations('industries');
  const c = useTranslations('common');
  return (
    <>
      <div className="aura overflow-x-clip">
        <PageIntro label={i('i_label')} title={i('i_title')} sub={i('i_sub')} />
      </div>
      <IndustryGrid />
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
    </>
  );
}
