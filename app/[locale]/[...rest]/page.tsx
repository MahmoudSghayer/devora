import {notFound} from 'next/navigation';

// Unmatched URLs under a locale funnel into the locale-aware not-found page
// (full site chrome) instead of the framework default, which has no <html>.
export default function CatchAll() {
  notFound();
}
