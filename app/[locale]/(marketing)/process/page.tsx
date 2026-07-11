import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import PageIntro from '@/components/ui/PageIntro';
import ProcessDetail from '@/components/process/ProcessDetail';
import AmberBand from '@/components/ui/AmberBand';
import Marquee from '@/components/chrome/Marquee';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'process'});
  const title = t('pr_label');
  const description = t('pr_sub');
  return {
    title,
    description,
    alternates: alternates('/process'),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function ProcessPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ProcessContent />;
}

function ProcessContent() {
  const p = useTranslations('process');
  const c = useTranslations('common');
  return (
    <>
      <PageIntro label={p('pr_label')} title={p('pr_title')} sub={p('pr_sub')} />
      <ProcessDetail />
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
      <Marquee />
    </>
  );
}
