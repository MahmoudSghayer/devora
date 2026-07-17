import './globals.css';
import type {Metadata} from 'next';

// Root layout is a pass-through — the <html>/<body> live in [locale]/layout
// so lang/dir can be set per locale (standard next-intl App Router pattern).
export const metadata: Metadata = {
  metadataBase: new URL('https://devora.design'),
  title: {
    default: 'devora — استوديو ويب متكامل',
    template: '%s · devora',
  },
  description:
    'devora — dev + aura. استوديو ويب متكامل ثنائي اللغة: استراتيجية، هوية بصرية، تصميم، برمجة، ونمو. فريق واحد من أول اتصال وحتى يوم الإطلاق.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return children;
}
