import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import {PILLARS} from '@/lib/pillars';
import PageIntro from '@/components/ui/PageIntro';
import PillarNav from '@/components/services/PillarNav';
import PillarHelper from '@/components/services/PillarHelper';
import PillarSection from '@/components/services/PillarSection';
import ProcessSteps from '@/components/services/ProcessSteps';
import EngagementModels from '@/components/services/EngagementModels';
import AmberBand from '@/components/ui/AmberBand';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'services'});
  const title = t('sv_label');
  const description = t('sv_sub');
  return {
    title,
    description,
    alternates: alternates('/services', locale as 'en' | 'ar'),
    openGraph: {title, description},
    twitter: {title, description},
  };
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
  const navItems = PILLARS.map((p) => ({anchor: p.anchor, label: c(p.navKey)}));
  return (
    <>
      <div className="aura overflow-x-clip">
        <PageIntro label={s('sv_label')} title={s('sv_title')} sub={s('sv_sub')} />
      </div>
      <PillarNav items={navItems} label={s('nav_aria')} />
      <PillarHelper />
      {PILLARS.map((pillar, i) => (
        <PillarSection key={pillar.id} pillar={pillar} index={i} />
      ))}
      <ProcessSteps />
      <EngagementModels />
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
    </>
  );
}
