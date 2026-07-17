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
