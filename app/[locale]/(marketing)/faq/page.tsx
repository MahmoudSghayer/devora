import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import PageIntro from '@/components/ui/PageIntro';
import Container from '@/components/ui/Container';
import FAQAccordion from '@/components/ui/FAQAccordion';
import AmberBand from '@/components/ui/AmberBand';
import Marquee from '@/components/chrome/Marquee';

// Question keys grouped by theme. Answers pair as a{n}.
const GROUPS = [
  {label: 'g_general', pairs: [['q1', 'a1'], ['q2', 'a2'], ['q3', 'a3'], ['q4', 'a4'], ['q11', 'a11']]},
  {label: 'g_pricing', pairs: [['q5', 'a5'], ['q6', 'a6']]},
  {label: 'g_process', pairs: [['q7', 'a7'], ['q8', 'a8'], ['q12', 'a12']]},
  {label: 'g_tech', pairs: [['q9', 'a9'], ['q10', 'a10']]},
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'faq'});
  const title = t('f_label');
  const description = t('f_sub');
  return {
    title,
    description,
    alternates: alternates('/faq', locale as 'en' | 'ar'),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <FaqContent />;
}

function FaqContent() {
  const f = useTranslations('faq');
  const c = useTranslations('common');
  return (
    <>
      <PageIntro label={f('f_label')} title={f('f_title')} sub={f('f_sub')} />
      <section>
        <Container className="flex flex-col gap-16 py-24">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-muted-2">
                {f(g.label)}
              </p>
              <div className="mt-6">
                <FAQAccordion
                  items={g.pairs.map(([q, a]) => ({q: f(q), a: f(a)}))}
                />
              </div>
            </div>
          ))}
        </Container>
      </section>
      <AmberBand
        title={c('cta_title')}
        sub={c('cta_sub')}
        buttonLabel={c('cta_btn')}
      />
      <Marquee />
    </>
  );
}
