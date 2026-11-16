import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import {BreadcrumbJsonLd} from '@/components/seo/schemas';
import {CASES} from '@/lib/site';
import PageIntro from '@/components/ui/PageIntro';
import CaseStudyRow from '@/components/work/CaseStudyRow';
import AmberBand from '@/components/ui/AmberBand';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'work'});
  const title = t('wk_label');
  const description = t('wk_sub');
  return pageMetadata({locale, path: '/work', title, description});
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as 'en' | 'ar';
  const [tc, t] = await Promise.all([
    getTranslations({locale, namespace: 'common'}),
    getTranslations({locale, namespace: 'work'}),
  ]);
  return (
    <>
      <BreadcrumbJsonLd locale={l} items={[{name: tc('nav_home'), path: ''}, {name: t('wk_label'), path: '/work'}]} />
      <WorkContent />
    </>
  );
}

function WorkContent() {
  const w = useTranslations('work');
  const c = useTranslations('common');
  return (
    <>
      <div className="aura overflow-x-clip">
        <PageIntro label={w('wk_label')} title={w('wk_title')} sub={w('wk_sub')} />
      </div>
      {CASES.map((cs, i) => (
        <CaseStudyRow key={cs.slug} index={i} reverse={i % 2 === 1} />
      ))}
      <AmberBand
        title={w('next_t')}
        sub={w('next_sub')}
        buttonLabel={c('nav_cta')}
        centered
      />
    </>
  );
}
