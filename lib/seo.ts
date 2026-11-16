import type {Metadata} from 'next';

// Build hreflang alternates for a root-relative path (e.g. '' or '/work').
// metadataBase (https://devora.design) resolves these to absolute URLs.
// Arabic is the default locale and serves unprefixed ('as-needed' prefix
// mode), so canonical follows whichever locale is active, and x-default
// points at the Arabic root since Arabic is the default/primary experience.
export function alternates(path: string, locale: 'en' | 'ar'): Metadata['alternates'] {
  const en = `/en${path}`;
  const ar = path || '/';
  return {
    canonical: locale === 'ar' ? ar : en,
    languages: {en, ar, 'x-default': ar},
  };
}

type SeoLocale = 'en' | 'ar';

const OG_LOCALE: Record<SeoLocale, string> = {ar: 'ar_AR', en: 'en_US'};

export type PageMetadataInput = {
  locale: string;
  /** root-relative path, '' for the homepage (e.g. '/pricing') */
  path: string;
  title: string;
  description: string;
  type?: 'website' | 'article';
};

// Full per-page metadata: canonical + hreflang, Open Graph and Twitter card.
// The OG/Twitter image comes from the app/[locale]/opengraph-image convention.
export function pageMetadata({locale, path, title, description, type = 'website'}: PageMetadataInput): Metadata {
  const loc: SeoLocale = locale === 'ar' ? 'ar' : 'en';
  const other: SeoLocale = loc === 'ar' ? 'en' : 'ar';
  const alt = alternates(path, loc);
  const url = typeof alt?.canonical === 'string' ? alt.canonical : path || '/';
  // Child segments that set openGraph/twitter do not inherit the parent
  // segment's file-convention image, so point at the locale's image route.
  const prefix = loc === 'ar' ? '' : '/en';
  const image = {url: `${prefix}/opengraph-image`, width: 1200, height: 630, alt: title};
  return {
    title,
    description,
    alternates: alt,
    openGraph: {
      url,
      siteName: 'devora',
      type,
      locale: OG_LOCALE[loc],
      alternateLocale: [OG_LOCALE[other]],
      title,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{...image, url: `${prefix}/twitter-image`}],
    },
  };
}
