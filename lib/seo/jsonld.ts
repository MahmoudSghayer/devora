import {SITE} from '@/lib/site';

export type SeoLocale = 'en' | 'ar';

export const SITE_URL = `https://${SITE.domain}`;

/** Absolute URL for a root-relative path in a locale (Arabic is unprefixed). */
export function localizedUrl(locale: SeoLocale, path: string): string {
  return locale === 'ar' ? `${SITE_URL}${path || '/'}` : `${SITE_URL}/en${path}`;
}

/** Serialise JSON-LD safely for a <script> tag (`<` escaped to <). */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export const ORG_ID = `${SITE_URL}/#organization`;
// app/icon.svg is the real brand mark served at /icon.svg.
export const LOGO_URL = `${SITE_URL}/icon.svg`;
