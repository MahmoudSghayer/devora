import {OG_SIZE, OG_CONTENT_TYPE, ogAlt, renderOgImage} from '@/lib/seo/og-image';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateImageMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return [{id: 'og', size: OG_SIZE, contentType: OG_CONTENT_TYPE, alt: ogAlt(locale)}];
}

export default async function Image({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return renderOgImage(locale);
}
