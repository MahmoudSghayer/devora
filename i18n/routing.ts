import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'ar',
  // Arabic is the default/primary experience and serves unprefixed
  // ('/', '/about', ...); English keeps its explicit '/en' prefix
  // ('/en', '/en/about', ...). localeDetection is off so '/' deterministically
  // serves Arabic regardless of the visitor's Accept-Language header or
  // locale cookie — required for consistent SEO crawling.
  localePrefix: 'as-needed',
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
