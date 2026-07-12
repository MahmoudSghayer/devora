import type {ReactNode} from 'react';
import Header from '@/components/chrome/Header';
import Footer from '@/components/chrome/Footer';
import ScrollProgress from '@/components/chrome/ScrollProgress';

// Chrome for the standard marketing pages (about, services, work, pricing …).
// The homepage lives directly under [locale] (outside this group) so the
// full-bleed DEVORA OS experience can supply its own header, rail and footer.
export default function MarketingLayout({children}: {children: ReactNode}) {
  return (
    <>
      <div aria-hidden className="devora-cosmos" />
      <ScrollProgress />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
