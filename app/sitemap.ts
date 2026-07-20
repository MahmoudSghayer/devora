import type { MetadataRoute } from 'next'
import { CASES } from '@/lib/site'

const BASE_URL = 'https://devora.design'
const LOCALES = ['en', 'ar'] as const
const ROUTES = [
  '',
  '/work',
  '/services',
  '/pricing',
  '/about',
  '/process',
  '/industries',
  '/faq',
  '/contact',
  ...CASES.map((c) => `/work/${c.slug}`),
]

type Locale = (typeof LOCALES)[number]

// Arabic is the default locale (as-needed prefix) and serves unprefixed;
// English keeps its explicit '/en' prefix.
const urlFor = (locale: Locale, route: string) =>
  locale === 'ar' ? `${BASE_URL}${route || '/'}` : `${BASE_URL}/en${route}`

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: urlFor(locale, route),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: route === '' ? 1.0 : 0.8,
      alternates: {
        languages: {
          en: urlFor('en', route),
          ar: urlFor('ar', route),
          'x-default': urlFor('ar', route),
        },
      },
    }))
  )
}
