import type {Metadata} from 'next';
import {useTranslations} from 'next-intl';
import {setRequestLocale, getTranslations} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import Container from '@/components/ui/Container';
import PageIntro from '@/components/ui/PageIntro';
import ContactForm from '@/components/contact/ContactForm';
import ContactAside from '@/components/contact/ContactAside';
import Marquee from '@/components/chrome/Marquee';

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
  return (
    <>
      <PageIntro label={t('ct_label')} title={t('ct_title')} sub={t('ct_sub')} />
      <section>
        <Container className="grid gap-14 pb-[120px] pt-24 nav:grid-cols-[7fr_4fr] nav:gap-20">
          <ContactForm />
          <ContactAside />
        </Container>
      </section>
      <Marquee />
    </>
  );
}
