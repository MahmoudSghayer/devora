import type {ReactNode} from 'react';
import {getTranslations} from 'next-intl/server';
import Header from '@/components/chrome/Header';
import Footer from '@/components/chrome/Footer';
import ScrollProgress from '@/components/chrome/ScrollProgress';
import StarField from '@/components/chrome/StarField';
import LenisProvider from '@/components/motion/LenisProvider';
import CursorAura from '@/components/motion/CursorAura';

// Chrome for every marketing page (home, services, work, pricing, calculators …):
// a cosmic gradient, canvas starfield and film grain behind the content, plus
// desktop-only smooth scroll and a cursor light (both off for touch and reduced
// motion). The skip link is the first focusable element.
export default async function MarketingLayout({children}: {children: ReactNode}) {
  const t = await getTranslations('common');
  return (
    <>
      <a
        href="#main"
        className="fixed start-3 top-[-80px] rounded-chip bg-amber px-4 py-2.5 font-semibold text-on-amber transition-[top] focus:top-3"
        style={{zIndex: 'var(--z-toast)'}}
      >
        {t('skip')}
      </a>
      <div aria-hidden className="devora-cosmos" />
      <StarField />
      <div aria-hidden className="devora-grain" />
      <LenisProvider />
      <CursorAura />
      <ScrollProgress />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
