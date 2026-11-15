import {OG_SIZE, OG_CONTENT_TYPE, OG_ALT, renderOgImage} from '@/lib/seo/og-image';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = OG_ALT;

export default async function Image({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return renderOgImage(locale);
}
