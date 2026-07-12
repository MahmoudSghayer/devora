import type {ReactNode} from 'react';
import Header from '@/components/chrome/Header';
import Footer from '@/components/chrome/Footer';
import ScrollProgress from '@/components/chrome/ScrollProgress';
import StarField from '@/components/chrome/StarField';

// Chrome for the standard marketing pages (about, services, work, pricing …).
// The homepage lives directly under [locale] (outside this group) so the
// full-bleed DEVORA OS experience can supply its own header, rail and footer.
// These pages get a lighter echo of that world: a cosmic gradient, a canvas
// starfield and a film-grain wash behind the content.
export default function MarketingLayout({children}: {children: ReactNode}) {
  return (
    <>
      <div aria-hidden className="devora-cosmos" />
      <StarField />
      <div aria-hidden className="devora-grain" />
      <ScrollProgress />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
