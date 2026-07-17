import {SITE, SOCIALS} from '@/lib/site';

// Organization + WebSite JSON-LD, rendered once per locale layout. No visible
// UI, so it stays outside NextIntlClientProvider — schema.org consumers read
// the script tag directly, not the intl-aware render tree.
export default function StructuredData({locale}: {locale: 'en' | 'ar'}) {
  const url = `https://${SITE.domain}`;
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: SITE.name,
        url,
        email: SITE.email,
        sameAs: SOCIALS.map((s) => s.href),
      },
      {
        '@type': 'WebSite',
        url,
        name: SITE.name,
        inLanguage: locale,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
