import type {Metadata} from 'next';
import {useLocale, useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {pageMetadata} from '@/lib/seo';
import {BreadcrumbJsonLd, FaqJsonLd} from '@/components/seo/schemas';
import PageIntro from '@/components/ui/PageIntro';
import Container from '@/components/ui/Container';
import {pricingParams} from '@/lib/pricing/config';
import AmberBand from '@/components/ui/AmberBand';
import FaqList, {type FaqItem} from './FaqList';

type Pair = readonly [q: string, a: string, link?: readonly [href: string, label: string]];

// Question keys grouped by theme; answers pair as a{n}. The first group carries
// the objections people raise before they start (accuracy, staff, ownership,
// timelines); optional links send them to the matching tool or page.
const GROUPS: readonly {label: string; pairs: readonly Pair[]}[] = [
  {
    label: 'g_start',
    pairs: [
      ['q13', 'a13', ['/estimate', 'l_estimate']],
      ['q14', 'a14', ['/automation-roi', 'l_roi']],
      ['q9', 'a9'],
      ['q7', 'a7', ['/process', 'l_process']],
      ['q15', 'a15'],
    ],
  },
  {
    label: 'g_general',
    pairs: [['q1', 'a1'], ['q2', 'a2'], ['q3', 'a3'], ['q4', 'a4'], ['q11', 'a11']],
  },
  {
    label: 'g_pricing',
    pairs: [['q5', 'a5', ['/pricing', 'l_pricing']], ['q6', 'a6']],
  },
  {
    label: 'g_process',
    pairs: [['q8', 'a8'], ['q12', 'a12'], ['q10', 'a10']],
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'faq'});
  const title = t('f_label');
  const description = t('f_sub');
  return pageMetadata({locale, path: '/faq', title, description});
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const l = locale as 'en' | 'ar';
  const [tc, t] = await Promise.all([
    getTranslations({locale, namespace: 'common'}),
    getTranslations({locale, namespace: 'faq'}),
  ]);
  const faqParams = pricingParams(locale);
  return (
    <>
      <FaqJsonLd
        items={GROUPS.flatMap((g) => g.pairs).map(([q, a]) => ({question: t(q), answer: t(a, faqParams)}))}
      />
      <BreadcrumbJsonLd locale={l} items={[{name: tc('nav_home'), path: ''}, {name: t('f_label'), path: '/faq'}]} />
      <FaqContent />
    </>
  );
}

function FaqContent() {
  const locale = useLocale();
  const params = pricingParams(locale);
  const f = useTranslations('faq');
  const c = useTranslations('common');
  return (
    <>
      <div className="aura overflow-x-clip">
        <PageIntro label={f('f_label')} title={f('f_title')} sub={f('f_sub')} />
      </div>
      <section aria-label={f('f_title')} className="py-section">
        <Container className="flex flex-col gap-block">
          {GROUPS.map((g) => {
            const items: FaqItem[] = g.pairs.map(([q, a, link]) => ({
              q: f(q),
              a: f(a, params),
              link: link ? {href: link[0], label: f(link[1])} : undefined,
            }));
            return (
              <div key={g.label} className="grid gap-6 nav:grid-cols-[4fr_8fr] nav:gap-16">
                <h2 className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber nav:pt-5">
                  <span aria-hidden>{'// '}</span>
                  {f(g.label)}
                </h2>
                <FaqList items={items} idPrefix={g.label} />
              </div>
            );
          })}
        </Container>
      </section>
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
    </>
  );
}
