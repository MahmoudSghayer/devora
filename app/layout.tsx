import './globals.css';
import type {Metadata} from 'next';

// Root layout is a pass-through — the <html>/<body> live in [locale]/layout
// so lang/dir can be set per locale (standard next-intl App Router pattern).
export const metadata: Metadata = {
  metadataBase: new URL('https://devora.design'),
  title: {
    default: 'devora — full-stack web studio',
    template: '%s · devora',
  },
  description:
    'devora — dev + aura. A bilingual full-stack web studio: strategy, brand, design, code and growth. One team from first call to launch day.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return children;
}
