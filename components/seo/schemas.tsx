import {getTranslations} from 'next-intl/server';
import {SITE, SOCIALS} from '@/lib/site';
import {PILLARS} from '@/lib/pillars';
import {CURRENCY} from '@/lib/pricing/config';
import {LOGO_URL, ORG_ID, SITE_URL, localizedUrl, type SeoLocale} from '@/lib/seo/jsonld';
import JsonLdScript from './JsonLdScript';

// Page-level JSON-LD. All values come from lib/site.ts, the `pillars` /
// `common` message namespaces or props — nothing is invented (no ratings,
// reviews, addresses, phone numbers or prices).

const WEBSITE_ID = `${SITE_URL}/#website`;
const orgRef = {'@id': ORG_ID};

export function OrganizationJsonLd() {
  return (
    <JsonLdScript
      data={{
        '@type': 'Organization',
        '@id': ORG_ID,
        name: SITE.name,
        url: SITE_URL,
        logo: LOGO_URL,
        email: SITE.email,
        telephone: SITE.whatsapp,
        sameAs: SOCIALS.map((s) => s.href),
      }}
    />
  );
}

export function WebSiteJsonLd({locale}: {locale: SeoLocale}) {
  return (
    <JsonLdScript
      data={{
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_URL,
        name: SITE.name,
        inLanguage: locale,
        publisher: orgRef,
      }}
    />
  );
}

export async function ProfessionalServiceJsonLd({locale}: {locale: SeoLocale}) {
  const t = await getTranslations({locale, namespace: 'common'});
  return (
    <JsonLdScript
      data={{
        '@type': 'ProfessionalService',
        '@id': `${SITE_URL}/#service`,
        name: SITE.name,
        url: localizedUrl(locale, ''),
        description: t('footer_tag'),
        image: LOGO_URL,
        email: SITE.email,
        telephone: SITE.whatsapp,
        sameAs: SOCIALS.map((s) => s.href),
        availableLanguage: ['ar', 'en'],
        parentOrganization: orgRef,
      }}
    />
  );
}

// One Service per pillar (Websites, Automation & AI agents, Custom software).
export async function ServicesJsonLd({locale}: {locale: SeoLocale}) {
  const t = await getTranslations({locale, namespace: 'pillars'});
  return (
    <JsonLdScript
      data={{
        '@graph': PILLARS.map((p) => ({
          '@type': 'Service',
          '@id': `${localizedUrl(locale, '/services')}#${p.anchor}`,
          name: t(`${p.id}.name`),
          description: t(`${p.id}.desc`),
          url: `${localizedUrl(locale, '/services')}#${p.anchor}`,
          inLanguage: locale,
          provider: orgRef,
        })),
      }}
    />
  );
}

export function FaqJsonLd({items}: {items: readonly {question: string; answer: string}[]}) {
  return (
    <JsonLdScript
      data={{
        '@type': 'FAQPage',
        mainEntity: items.map((i) => ({
          '@type': 'Question',
          name: i.question,
          acceptedAnswer: {'@type': 'Answer', text: i.answer},
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  locale,
  items,
}: {
  locale: SeoLocale;
  /** in order, including the home crumb; `path` is root-relative ('' = home) */
  items: readonly {name: string; path: string}[];
}) {
  return (
    <JsonLdScript
      data={{
        '@type': 'BreadcrumbList',
        itemListElement: items.map((i, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: i.name,
          item: localizedUrl(locale, i.path),
        })),
      }}
    />
  );
}

const APP_PATH = {estimate: '/estimate', roi: '/automation-roi', discuss: '/discuss'} as const;

// Free interactive calculators. Title/description are the page's own strings.
export function WebApplicationJsonLd({
  kind,
  locale,
  name,
  description,
}: {
  kind: keyof typeof APP_PATH;
  locale: SeoLocale;
  name: string;
  description: string;
}) {
  return (
    <JsonLdScript
      data={{
        '@type': 'WebApplication',
        name,
        description,
        url: localizedUrl(locale, APP_PATH[kind]),
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        inLanguage: locale,
        isAccessibleForFree: true,
        offers: {'@type': 'Offer', price: 0, priceCurrency: CURRENCY},
        provider: orgRef,
      }}
    />
  );
}
