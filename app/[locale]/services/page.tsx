import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import PageIntro from '@/components/ui/PageIntro';
import DisciplineRows from '@/components/services/DisciplineRows';
import ProcessSteps from '@/components/services/ProcessSteps';
import Packages from '@/components/services/Packages';
import AmberBand from '@/components/ui/AmberBand';
import Marquee from '@/components/chrome/Marquee';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'services'});
  return {title: t('sv_label')};
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ServicesContent />;
}

function ServicesContent() {
  const s = useTranslations('services');
  const c = useTranslations('common');
  return (
    <>
      <PageIntro label={s('sv_label')} title={s('sv_title')} sub={s('sv_sub')} />
      <DisciplineRows />
      <ProcessSteps />
      <Packages />
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
      <Marquee />
    </>
  );
}
