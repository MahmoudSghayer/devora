import {useTranslations} from 'next-intl';
import Header from '@/components/chrome/Header';
import Footer from '@/components/chrome/Footer';
import StarField from '@/components/chrome/StarField';
import Container from '@/components/ui/Container';
import ArrowButton from '@/components/ui/ArrowButton';
import ArrowLink from '@/components/ui/ArrowLink';

const LINKS = [
  {href: '/services', key: 'nav_services'},
  {href: '/estimate', key: 'nav_estimate'},
  {href: '/automation-roi', key: 'nav_roi'},
  {href: '/contact', key: 'nav_contact'},
] as const;

// 404 with the full site chrome. It lives outside the (marketing) group, so it
// assembles the same cosmos + starfield + header/footer itself.
export default function NotFound() {
  const c = useTranslations('common');
  return (
    <>
      <div aria-hidden className="devora-cosmos" />
      <StarField />
      <div aria-hidden className="devora-grain" />
      <Header />
      <main id="main" className="flex-1">
        <section className="aura overflow-x-clip">
          <Container className="flex min-h-[70vh] flex-col items-start justify-center pb-section pt-[150px]">
            <p className="u-mono num font-mono text-xs uppercase tracking-[0.36em] text-amber" dir="ltr">
              404
            </p>
            <h1 className="u-track mt-6 max-w-[14ch] font-display text-h1-sub font-semibold leading-[0.98] tracking-[-0.03em]">
              {c('nf_title')}
            </h1>
            <div className="mt-10">
              <ArrowButton href="/" label={c('nav_home')} className="px-8 py-4 text-base" />
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <ArrowLink href={l.href} label={c(l.key)} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
