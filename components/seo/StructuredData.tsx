import {OrganizationJsonLd, WebSiteJsonLd} from './schemas';
import type {SeoLocale} from '@/lib/seo/jsonld';

// Global default (mounted by the locale layout): Organization + WebSite only.
// Page-specific schemas live in ./schemas and are rendered by each page.
export default function StructuredData({locale}: {locale: SeoLocale}) {
  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd locale={locale} />
    </>
  );
}
