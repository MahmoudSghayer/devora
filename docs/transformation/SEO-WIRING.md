# SEO wiring (for the orchestrator)

SEO agent owns: `lib/seo.ts`, `lib/seo/*`, `components/seo/*`, `app/sitemap.ts`, `app/robots.ts`, `app/[locale]/{opengraph,twitter}-image.tsx`. Pages/layout are wired by the orchestrator.

## metadataBase
Already set in `app/layout.tsx` (`new URL('https://devora.design')`). No change needed. `StructuredData` in `app/[locale]/layout.tsx` is already mounted and now renders Organization + WebSite only (`<StructuredData locale={locale as Locale} />`, same signature).

## pageMetadata
Replaces the hand-written `generateMetadata` return. It sets title, description, canonical + hreflang (via `alternates()`, still exported), openGraph (url, siteName, type, `ar_AR`/`en_US` + alternateLocale, title, description, image) and twitter card + image.
IMPORTANT: a page that sets its own `openGraph`/`twitter` loses the inherited file-convention image, so always use `pageMetadata` (it adds `/opengraph-image` / `/en/opengraph-image` explicitly).

```ts
import {pageMetadata} from '@/lib/seo';
export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'faq'});
  return pageMetadata({locale, path: '/faq', title: t('f_label'), description: t('f_sub')});
}
```
Paths: `''` home, `/services`, `/pricing`, `/faq`, `/estimate`, `/automation-roi`, `/work/${slug}` (`type: 'article'` optional).

## JSON-LD components (`@/components/seo/schemas`)
All are server components; render inside the page body. `locale` is `'en' | 'ar'`.
`OrganizationJsonLd`, `WebSiteJsonLd({locale})`, `ProfessionalServiceJsonLd({locale})`, `ServicesJsonLd({locale})` (3 pillar Services from `pillars`), `FaqJsonLd({items:[{question,answer}]})`, `BreadcrumbJsonLd({locale, items:[{name, path}]})` (include the Home crumb, `path: ''`), `WebApplicationJsonLd({kind:'estimate'|'roi', locale, name, description})`.
FAQ answers must be the already-resolved strings (apply `pricingParams(locale)` first).

```tsx
import {ProfessionalServiceJsonLd, ServicesJsonLd, BreadcrumbJsonLd, FaqJsonLd, WebApplicationJsonLd} from '@/components/seo/schemas';
const l = locale as 'en' | 'ar';
const crumbs = [{name: tc('nav_home'), path: ''}, {name: title, path: '/services'}]; // tc = common (use the real home label key)
```

| Page | Add |
|---|---|
| `/` (home, no FAQ section) | `<ProfessionalServiceJsonLd locale={l}/>` `<ServicesJsonLd locale={l}/>` |
| `/services` | `<ServicesJsonLd locale={l}/>` `<BreadcrumbJsonLd locale={l} items={[home, {name: title, path:'/services'}]}/>` |
| `/pricing` | `<BreadcrumbJsonLd .../>` (+ `<FaqJsonLd items={…}/>` only if the page visibly shows those Q&As) |
| `/faq` | `<FaqJsonLd items={GROUPS.flatMap(g=>g.pairs).map(([q,a])=>({question:t(q), answer:t(a, pricingParams(locale))}))}/>` + Breadcrumb |
| `/estimate` | `<WebApplicationJsonLd kind="estimate" locale={l} name={title} description={description}/>` + Breadcrumb (`path:'/estimate'`) |
| `/automation-roi` | `<WebApplicationJsonLd kind="roi" .../>` + Breadcrumb (`path:'/automation-roi'`) |

Only mark up FAQ content that is visible on the same page (Google policy). No ratings/reviews/addresses/prices are emitted; the WebApplication offer is free (price 0, ILS).

## Images
`app/[locale]/opengraph-image.tsx` / `twitter-image.tsx` render via `lib/seo/og-image.tsx` (Cairo fetched from fonts.gstatic.com once, cached in module; falls back to the default font on failure). Palette: `lib/seo/og-palette.ts` only. Arabic is set as whole words in a `row-reverse` flex row because Satori ignores `direction: rtl`.

## Sitemap / robots
Sitemap includes `/estimate` and `/automation-roi` (both locales + hreflang alternates). robots: allow `/`, disallow `/admin` and `/api/`, sitemap pointer. Admin pages should also carry `robots: {index:false}` metadata (not owned by SEO).
