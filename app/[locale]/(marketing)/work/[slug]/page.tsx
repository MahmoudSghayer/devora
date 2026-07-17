import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import {CASES} from '@/lib/site';
import CaseStudyDetail from '@/components/work/CaseStudyDetail';
import AmberBand from '@/components/ui/AmberBand';
import Marquee from '@/components/chrome/Marquee';

// Prerender one page per case (locale comes from the parent [locale] segment).
export function generateStaticParams() {
  return CASES.map((c) => ({slug: c.slug}));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}): Promise<Metadata> {
  const {locale, slug} = await params;
  const data = CASES.find((c) => c.slug === slug);
  if (!data) return {};
  const copy = locale === 'ar' ? data.ar : data.en;
  const title = `${data.domain} — ${copy.industry}`;
  const description = copy.summary;
  return {
    title,
    description,
    alternates: alternates(`/work/${slug}`, locale as 'en' | 'ar'),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function CasePage({
  params,
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  setRequestLocale(locale);
  const data = CASES.find((c) => c.slug === slug);
  if (!data) notFound();

  const c = await getTranslations({locale, namespace: 'common'});

  return (
    <>
      <CaseStudyDetail data={data} locale={locale} />
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
      <Marquee />
    </>
  );
}
