import type {Metadata} from 'next';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {alternates} from '@/lib/seo';
import {SITE} from '@/lib/site';
import DevoraExperience from '@/components/experience/DevoraExperience';
import {buildExperienceMarkup, type ExperienceCopy} from '@/components/experience/markup';

const INSTAGRAM = 'https://instagram.com/devora.designs';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const messages = (await getMessages({locale})) as {experience: ExperienceCopy};
  const t = messages.experience;
  const title = 'DEVORA — Digital Empire Engineering';
  const description = t.hero.sub;
  return {
    title,
    description,
    alternates: alternates(''),
    openGraph: {title, description},
    twitter: {title, description},
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const messages = (await getMessages({locale})) as {
    experience: ExperienceCopy;
    common: {lang_toggle: string};
  };
  const copy = messages.experience;
  const other = locale === 'ar' ? 'en' : 'ar';

  const html = buildExperienceMarkup(copy, {
    otherLocaleHref: `/${other}`,
    otherLocaleLabel: messages.common.lang_toggle,
    contactHref: `/${locale}/contact`,
    email: SITE.email,
    instagramHref: INSTAGRAM,
  });

  // The controller only needs the localized data it drives at runtime.
  const controllerCopy = {
    services: copy.services,
    build: copy.build,
    act_labels: copy.act_labels,
  };

  return <DevoraExperience html={html} copy={controllerCopy} />;
}
