import type {Metadata} from 'next';

// Build hreflang alternates for a root-relative path (e.g. '' or '/work').
// metadataBase (https://devora.design) resolves these to absolute URLs.
// Canonical points at the en variant; ar and x-default are declared alongside.
export function alternates(path: string): Metadata['alternates'] {
  return {
    canonical: `/en${path}`,
    languages: {
      en: `/en${path}`,
      ar: `/ar${path}`,
      'x-default': `/en${path}`,
    },
  };
}
