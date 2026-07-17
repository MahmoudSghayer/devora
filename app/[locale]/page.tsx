import type {Metadata} from 'next';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {getPathname} from '@/i18n/navigation';
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
  const title = t.meta_title;
  const description = t.hero.sub;
  return {
    // Absolute so the root `%s · devora` template isn't appended (the title
    // already carries the brand name — otherwise it doubles to "… · devora").
    title: {absolute: title},
    description,
    alternates: alternates('', locale as 'en' | 'ar'),
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
    otherLocaleHref: getPathname({href: '/', locale: other}),
    otherLocaleLabel: messages.common.lang_toggle,
    contactHref: getPathname({href: '/contact', locale}),
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
