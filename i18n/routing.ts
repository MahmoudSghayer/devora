import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  // Always prefix the locale so /en and /ar are explicit (README-recommended).
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
