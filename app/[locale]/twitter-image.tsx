import {ogImage, size, contentType, alt} from './opengraph-image';

// Re-use the exact same on-brand artwork as the Open Graph image.
export {size, contentType, alt};

export default async function Image({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  return ogImage(locale);
}
