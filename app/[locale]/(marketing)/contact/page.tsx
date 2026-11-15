import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import Container from '@/components/ui/Container';
import PageIntro from '@/components/ui/PageIntro';
import ContactForm from '@/components/contact/ContactForm';
import CustomNeeds from '@/components/pricing/CustomNeeds';
import ContactAside from '@/components/contact/ContactAside';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'contact'});
  const title = t('ct_label');
  const description = t('ct_sub');
  return {
    title,
    description,
    alternates: alternates('/contact', locale as 'en' | 'ar'),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <ContactContent />;
}

function ContactContent() {
  const t = useTranslations('contact');
  const p = useTranslations('pricing');
  return (
    <>
      <div className="aura overflow-x-clip">
        <PageIntro label={t('ct_label')} title={t('ct_title')} sub={t('ct_sub')} />
      </div>
      <CustomNeeds
        label={p('paths_label')}
        title={p('paths_title')}
        sub={p('paths_sub')}
        headingId="contact-paths-title"
        className="border-b border-border pb-block pt-section"
      />
      <section aria-labelledby="contact-plain-title" className="py-section">
        <Container className="mb-block">
          <p className="u-mono font-mono text-xs uppercase tracking-[0.22em] text-amber">
            <span aria-hidden>{'// '}</span>
            {p('plain_label')}
          </p>
          <h2
            id="contact-plain-title"
            className="u-track mt-4 font-display text-h2 font-semibold leading-[1.05] tracking-[-0.02em]"
          >
            {p('plain_title')}
          </h2>
        </Container>
        <Container className="grid gap-14 nav:grid-cols-[7fr_4fr] nav:gap-20">
          <ContactForm />
          <ContactAside />
        </Container>
      </section>
    </>
  );
}
