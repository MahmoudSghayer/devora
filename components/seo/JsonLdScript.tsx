import {serializeJsonLd} from '@/lib/seo/jsonld';

// Renders one JSON-LD script tag; `<` is escaped so content can't close it.
export default function JsonLdScript({data}: {data: Record<string, unknown>}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: serializeJsonLd({'@context': 'https://schema.org', ...data})}}
    />
  );
}
